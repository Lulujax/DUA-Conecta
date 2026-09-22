import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ADDITIONAL_ORIGINS = process.env.ADDITIONAL_ORIGINS
  ? process.env.ADDITIONAL_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [];
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida');
  process.exit(1);
}

if (!JWT_SECRET || JWT_SECRET === 'CLAVE_SECRETA_DE_FALLBACK' || JWT_SECRET.length < 20) {
  console.error('❌ JWT_SECRET debe estar definida y tener al menos 20 caracteres. No uses el valor por defecto.');
  process.exit(1);
}

if (FRONTEND_URL === 'http://localhost:5173' && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  ADVERTENCIA: FRONTEND_URL sigue siendo el valor por defecto (localhost). ' +
    'Establece FRONTEND_URL=https://tu-app.vercel.app en las variables de entorno de Render ' +
    'para que el CORS funcione en producción.');
}

const isLocalDb = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');

const sql = postgres(DATABASE_URL, {
  ssl: isLocalDb ? false : 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30
});

const ALLOWED_ORIGINS = new Set([
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
  ...ADDITIONAL_ORIGINS
]);

app.use(cors({
  origin: (origin, callback) => {
    // Peticiones servidor-a-servidor no envían cabecera Origin
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
    // Previews de Vercel del proyecto (p.ej. dua-conecta-git-main.vercel.app)
    if (/^https:\/\/dua-conecta(-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS: origin no permitido: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Render y otros proxies: usar la IP real del cliente para el rate limit
app.set('trust proxy', 1);

// Protección básica global contra abuso
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Inténtalo más tarde.' }
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' }
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de recuperación. Inténtalo más tarde.' }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'dua-conecta-api' });
});

type AuthRequest = express.Request & {
  user?: { id: number; email?: string; name?: string };
};

async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      elements JSONB NOT NULL DEFAULT '[]'::jsonb,
      preview_img TEXT,
      template_id TEXT,
      category TEXT,
      thumbnail_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS templates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      thumbnail_url TEXT,
      base_elements JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT,
      width INTEGER,
      height INTEGER,
      elements JSONB NOT NULL DEFAULT '[]'::jsonb,
      thumbnail_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

function requireAuth(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autorización faltante.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email?: string; name?: string };
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado. Vuelve a iniciar sesión.' });
  }
}

// --- AUTH ---

app.post('/auth/register', authLimiter, async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({ error: 'El correo electrónico no es válido.' });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
    return res.status(400).json({ error: 'El nombre no es válido.' });
  }

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, name, email
    `;

    const user = newUser[0] as { id: number; name: string; email: string };
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      user,
      token
    });
  } catch (error) {
    console.error('❌ Error Registro:', error);
    return res.status(500).json({ error: 'Error al registrar usuario en DB' });
  }
});

app.post('/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;

    const user = users[0] as any;
    const valid = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!valid) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      token
    });
  } catch (error) {
    console.error('❌ Error Login:', error);
    return res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

app.get('/auth/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const users = await sql`SELECT id, name, email FROM users WHERE id = ${userId}`;
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json({ user: users[0] });
  } catch (error) {
    console.error('❌ Error /auth/me:', error);
    return res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

app.post('/auth/logout', (_req, res) => {
  return res.json({ success: true });
});

app.post('/auth/forgot-password', passwordResetLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Falta el correo' });
  }

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return res.status(500).json({ error: 'Servidor de correo no configurado.' });
  }

  try {
    const users = await sql`SELECT id, email FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return res.json({ success: true });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await sql`
      INSERT INTO password_resets (email, token, expires_at)
      VALUES (${email}, ${token}, ${expiresAt.toISOString()})
    `;

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });

    const resetURL = `${FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    await transporter.sendMail({
      from: SMTP_USER,
      to: email,
      subject: 'Recuperación de contraseña - DUA-Conecta',
      html: `<p>Haz clic aquí para restablecer tu contraseña:</p><a href="${resetURL}">${resetURL}</a><p>Este enlace expira en 1 hora.</p>`
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error forgot-password:', error);
    return res.status(500).json({ error: 'No se pudo procesar la recuperación.' });
  }
});

app.post('/auth/reset-password-confirm', authLimiter, async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const resets = await sql`
      SELECT id FROM password_resets
      WHERE email = ${email} AND token = ${code} AND used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;

    if (resets.length === 0) {
      return res.status(400).json({ error: 'El enlace ha caducado o es inválido.' });
    }

    const users = await sql`SELECT id, password_hash FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0] as any;
    const samePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (samePassword) {
      return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la anterior.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${user.id}`;
    await sql`UPDATE password_resets SET used = TRUE WHERE id = ${resets[0].id}`;

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error reset-password-confirm:', error);
    return res.status(500).json({ error: 'Error al restablecer la contraseña.' });
  }
});

app.post('/auth/change-password', requireAuth, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const users = await sql`SELECT id, password_hash FROM users WHERE id = ${req.user!.id}`;
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0] as any;
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta.', code: 'incorrecta' });
    }

    const samePassword = await bcrypt.compare(newPassword, user.password_hash);
    if (samePassword) {
      return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la anterior.', code: 'misma' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${user.id}`;

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error change-password:', error);
    return res.status(500).json({ error: 'Error al cambiar la contraseña.' });
  }
});

// --- TEMPLATES ---

app.get('/templates', async (_req, res) => {
  try {
    const templates = await sql`SELECT * FROM templates ORDER BY id ASC`;
    return res.json({ templates });
  } catch (error) {
    console.error('❌ Error templates:', error);
    return res.status(500).json({ error: 'No se pudieron cargar las plantillas' });
  }
});

app.get('/templates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const templates = await sql`SELECT * FROM templates WHERE id = ${id}`;
    if (templates.length === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    return res.json({ template: templates[0] });
  } catch (error) {
    console.error('❌ Error template:', error);
    return res.status(500).json({ error: 'No se pudo cargar la plantilla' });
  }
});

// --- IMAGES ---

app.get('/api/search-images', async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'El parámetro query es requerido.' });
  }

  if (!PIXABAY_API_KEY || PIXABAY_API_KEY.length < 10) {
    return res.status(500).json({ error: 'Pixabay API Key no configurada.' });
  }

  try {
    const response = await fetch(`https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(String(query))}&image_type=photo&safesearch=true&per_page=20`);
    const data = await response.json();
    const hits = (data.hits || []).map((hit: any) => ({
      webformatURL: hit.webformatURL,
      previewURL: hit.previewURL,
      tags: hit.tags
    }));
    return res.json({ success: true, hits });
  } catch (error) {
    console.error('❌ Pixabay API error:', error);
    return res.status(500).json({ error: 'No se pudieron buscar imágenes.' });
  }
});

// Alias for client compatibility
app.get('/api/pixabay', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'El parámetro q es requerido.' });
  }

  if (!PIXABAY_API_KEY || PIXABAY_API_KEY.length < 10) {
    return res.status(500).json({ error: 'Pixabay API Key no configurada.' });
  }

  try {
    const response = await fetch(`https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(String(q))}&image_type=photo&safesearch=true&per_page=20`);
    const data = await response.json();
    return res.json({ hits: data.hits || [] });
  } catch (error) {
    console.error('❌ Pixabay API error:', error);
    return res.status(500).json({ error: 'No se pudieron buscar imágenes.' });
  }
});

// --- IMAGE PROXY (para PDF sin taint CORS) ---
// Pixabay/Pexels no envían cabeceras CORS; html2canvas no puede leer esa imagen
// y el export a PDF explota. Este proxy las descarga en el servidor y las sirve
// con Access-Control-Allow-Origin: * para que el canvas quede "limpio".

const IMAGE_PROXY_ALLOWED_HOSTS = ['pixabay.com', 'pexels.com'];

app.get('/api/image-proxy', requireAuth, async (req, res) => {
  const rawUrl = String(req.query.url || '');
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return res.status(400).json({ error: 'URL inválida.' });
  }

  const host = parsedUrl.hostname.toLowerCase();
  const allowed = IMAGE_PROXY_ALLOWED_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  if (!allowed || (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:')) {
    return res.status(403).json({ error: 'Host no permitido.' });
  }

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'No se pudo cargar la imagen.' });
    }
    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buffer);
  } catch (error) {
    console.error('❌ Error proxy de imagen:', error);
    return res.status(502).json({ error: 'No se pudo cargar la imagen.' });
  }
});

// --- ACTIVITIES ---

app.post('/api/activities', requireAuth, async (req: AuthRequest, res) => {
  const { name, elements, previewImg, templateId, category, thumbnailUrl } = req.body;

  if (!name || !elements) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }

  try {
    const created = await sql`
      INSERT INTO activities (user_id, name, elements, preview_img, template_id, category, thumbnail_url)
      VALUES (${req.user!.id}, ${name}, ${sql.json(elements)}, ${previewImg ?? null}, ${templateId ?? null}, ${category ?? null}, ${thumbnailUrl ?? null})
      RETURNING id
    `;
    return res.json({ success: true, activityId: created[0].id, activity: created[0] });
  } catch (error) {
    console.error('❌ Error crear actividad:', error);
    return res.status(500).json({ error: 'No se pudo guardar la actividad.' });
  }
});

app.get('/api/activities', requireAuth, async (req: AuthRequest, res) => {
  try {
    const activities = await sql`
      SELECT *
      FROM activities
      WHERE user_id = ${req.user!.id}
      ORDER BY created_at DESC
    `;
    return res.json({ activities });
  } catch (error) {
    console.error('❌ Error listar actividades:', error);
    return res.status(500).json({ error: 'No se pudieron cargar las actividades.' });
  }
});

app.get('/api/activities/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const activities = await sql`
      SELECT * FROM activities
      WHERE id = ${id} AND user_id = ${req.user!.id}
    `;
    if (activities.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada.' });
    }
    return res.json({ activity: activities[0] });
  } catch (error) {
    console.error('❌ Error obtener actividad:', error);
    return res.status(500).json({ error: 'No se pudo cargar la actividad.' });
  }
});

app.put('/api/activities/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { name, elements, previewImg } = req.body;

  if (!name || !elements) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }

  try {
    const updated = await sql`
      UPDATE activities
      SET name = ${name},
          elements = ${sql.json(elements)},
          preview_img = ${previewImg ?? null},
          updated_at = NOW()
      WHERE id = ${id} AND user_id = ${req.user!.id}
      RETURNING id
    `;

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada.' });
    }

    return res.json({ success: true, message: 'Cambios guardados.' });
  } catch (error) {
    console.error('❌ Error actualizar actividad:', error);
    return res.status(500).json({ error: 'No se pudo actualizar la actividad.' });
  }
});

app.delete('/api/activities/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const deleted = await sql`
      DELETE FROM activities
      WHERE id = ${id} AND user_id = ${req.user!.id}
      RETURNING id
    `;

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada.' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error eliminar actividad:', error);
    return res.status(500).json({ error: 'No se pudo eliminar la actividad.' });
  }
});

// --- PROJECTS ---

app.post('/projects', requireAuth, async (req: AuthRequest, res) => {
  const { name, width, height, elements, thumbnailUrl } = req.body;

  if (!elements) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }

  try {
    const newProject = await sql`
      INSERT INTO projects (user_id, name, width, height, elements, thumbnail_url)
      VALUES (${req.user!.id}, ${name}, ${width}, ${height}, ${sql.json(elements)}, ${thumbnailUrl})
      RETURNING id, name
    `;
    return res.json({ success: true, project: newProject[0] });
  } catch (error) {
    console.error('❌ Error guardar proyecto:', error);
    return res.status(500).json({ error: 'No se pudo guardar el proyecto.' });
  }
});

app.get('/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projects = await sql`
      SELECT * FROM projects
      WHERE user_id = ${req.user!.id}
      ORDER BY created_at DESC
    `;
    return res.json({ projects });
  } catch (error) {
    console.error('❌ Error listar proyectos:', error);
    return res.status(500).json({ error: 'Error al cargar proyectos.' });
  }
});

// --- GLOBAL ERROR HANDLER ---

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

// --- START ---

async function startServer() {
  try {
    await ensureSchema();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
      console.log(`🔗 Frontend permitido: ${FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('❌ Error inicializando servidor:', error);
    process.exit(1);
  }
}

startServer();
