import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const DATABASE_URL = process.env.DATABASE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'CLAVE_SECRETA_DE_FALLBACK';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está definida');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30
});

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

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
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
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
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
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

app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
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

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;

    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0] as any;
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
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

app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Falta el correo' });
  }

  try {
    const users = await sql`SELECT id, email FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      // Don't reveal whether the email exists
      return res.json({ success: true });
    }

    const userId = (users[0] as { id: number }).id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Remove any existing reset tokens for this user and insert the new one atomically
    await sql.begin(async (txSql) => {
      await txSql`DELETE FROM password_resets WHERE user_id = ${userId}`;
      await txSql`
        INSERT INTO password_resets (user_id, token, expires_at)
        VALUES (${userId}, ${token}, ${expiresAt})
      `;
    });

    const resetURL = `${FRONTEND_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_PORT === 465,
          auth: { user: SMTP_USER, pass: SMTP_PASS }
        });

        await transporter.sendMail({
          from: SMTP_USER,
          to: email,
          subject: 'Recuperación de contraseña - DUA Conecta',
          html: `<p>Haz clic aquí para restablecer tu contraseña:</p><a href="${resetURL}">${resetURL}</a><p>Este enlace expira en 1 hora.</p>`
        });
      } catch (emailError) {
        console.error('❌ Error enviando email:', emailError);
        // Token is already saved; email failure is non-fatal
      }
    } else {
      console.warn('⚠️ SMTP no configurado. URL de recuperación:', resetURL);
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error forgot-password:', error);
    return res.status(500).json({ error: 'No se pudo procesar la recuperación.' });
  }
});

app.post('/auth/reset-password-confirm', async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Faltan datos requeridos.' });
  }

  try {
    const resets = await sql`
      SELECT pr.user_id
      FROM password_resets pr
      INNER JOIN users u ON u.id = pr.user_id
      WHERE pr.token = ${code}
        AND u.email = ${email}
        AND pr.expires_at > NOW()
    `;

    if (resets.length === 0) {
      return res.status(400).json({ error: 'El enlace de recuperación no es válido o ha expirado.' });
    }

    const userId = (resets[0] as { user_id: number }).user_id;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
    await sql`DELETE FROM password_resets WHERE user_id = ${userId}`;

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error reset-password-confirm:', error);
    return res.status(500).json({ error: 'No se pudo restablecer la contraseña.' });
  }
});

app.get('/templates', async (_req, res) => {
  try {
    const templates = await sql`SELECT * FROM templates ORDER BY id ASC`;
    return res.json({ templates });
  } catch (error) {
    console.error('❌ Error templates:', error);
    return res.status(500).json({ error: 'No se pudieron cargar las plantillas' });
  }
});

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
    const imageUrls = (data.hits || []).map((hit: any) => hit.webformatURL);
    return res.json({ success: true, images: imageUrls });
  } catch (error) {
    console.error('❌ Pixabay API error:', error);
    return res.status(500).json({ error: 'No se pudieron buscar imágenes.' });
  }
});

app.post('/api/activities', requireAuth, async (req: AuthRequest, res) => {
  const { name, elements, previewImg } = req.body;

  if (!name || !elements) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }

  try {
    const created = await sql`
      INSERT INTO activities (user_id, name, elements, preview_img)
      VALUES (${req.user!.id}, ${name}, ${sql.json(elements)}, ${previewImg})
      RETURNING id
    `;
    return res.json({ success: true, activity: created[0] });
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
          preview_img = ${previewImg},
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