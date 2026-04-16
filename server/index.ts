import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';

// 1. Cargar variables de entorno
dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL no está configurada.');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('❌ Error: JWT_SECRET no configurado.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

const FRONTEND_PUBLIC_URL = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:5173';
const CORS_ORIGIN = process.env.CORS_ORIGIN || FRONTEND_PUBLIC_URL;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';
const RESET_TOKEN_EXPIRY_MS = Number(process.env.RESET_TOKEN_EXPIRY_MS) || 60 * 60 * 1000;

// 2. Configuración de Base de Datos (Postgres / Supabase)
const sql = postgres(DATABASE_URL, {
  ssl: process.env.DATABASE_SSL === 'false' ? false : 'require',
  max: 10,
  idle_timeout: 20,
  connect_timeout: 30
});

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// 3. Configuración de Seguridad (CORS)
const allowedOrigins = CORS_ORIGIN.split(',').map((origin) => origin.trim());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

type AuthUser = { id: number; name: string; email: string };
type AuthRequest = express.Request & { user?: AuthUser };

function signToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

async function requireAuth(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autorización faltante.' });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    const users = await sql`SELECT id, name, email FROM users WHERE id = ${decoded.userId}`;
    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario no válido.' });
    }

    req.user = users[0];
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      template_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      elements JSONB NOT NULL,
      preview_img TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS activities_user_id_idx ON activities (user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS password_resets_email_idx ON password_resets (email)`;
}

// ==========================================
// 🔐 RUTAS DE AUTENTICACIÓN (/auth/...)
// ==========================================

app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El correo ya está registrado.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id, name, email
    `;

    const user = newUser[0];
    const token = signToken(user.id);

    return res.status(201).json({ success: true, user, token });
  } catch (error) {
    console.error('❌ Error Registro:', error);
    return res.status(500).json({ error: 'Error al registrar usuario en DB.' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan credenciales.' });
  }

  try {
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    const userRecord = users[0];
    const match = await bcrypt.compare(password, userRecord.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    const user = { id: userRecord.id, name: userRecord.name, email: userRecord.email };
    const token = signToken(user.id);

    return res.json({ success: true, user, token });
  } catch (error) {
    console.error('❌ Error Login:', error);
    return res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
});

app.get('/auth/me', requireAuth, (req: AuthRequest, res) => {
  return res.json({ success: true, user: req.user });
});

app.post('/auth/logout', (_req, res) => {
  return res.json({ success: true });
});

app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'El correo es requerido.' });
  }

  const genericResponse = { success: true, message: 'Si el correo existe, se ha enviado un enlace.' };

  try {
    const users = await sql`SELECT id, email FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return res.json(genericResponse);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await sql`DELETE FROM password_resets WHERE email = ${email}`;
    await sql`
      INSERT INTO password_resets (email, token, expires_at)
      VALUES (${email}, ${token}, ${expiresAt})
    `;

    const resetUrl = `${FRONTEND_PUBLIC_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    if (resend) {
      await resend.emails.send({
        from: `DUA Conecta <${EMAIL_FROM}>`,
        to: [email],
        subject: 'Recuperación de Contraseña DUA-Conecta',
        html: `<p>Haz clic en este enlace para restablecer tu contraseña:</p><a href="${resetUrl}">${resetUrl}</a><p>El enlace expira en 1 hora.</p>`
      });
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ RESEND_API_KEY no configurada. Enlace de recuperación generado:', resetUrl);
    } else {
      console.warn('⚠️ RESEND_API_KEY no configurada. Enlace de recuperación generado.');
    }

    return res.json(genericResponse);
  } catch (error) {
    console.error('❌ Error Forgot Password:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud.' });
  }
});

app.post('/auth/reset-password-confirm', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  try {
    const resets = await sql`
      SELECT * FROM password_resets
      WHERE email = ${email} AND token = ${code}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (resets.length === 0 || new Date(resets[0].expires_at) < new Date()) {
      return res.status(400).json({ error: 'El enlace ha caducado.' });
    }

    const users = await sql`SELECT id, password_hash FROM users WHERE email = ${email}`;
    if (users.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const samePassword = await bcrypt.compare(newPassword, users[0].password_hash);
    if (samePassword) {
      return res.status(400).json({ error: 'No uses la misma contraseña anterior.' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${users[0].id}`;
    await sql`DELETE FROM password_resets WHERE email = ${email}`;

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error Reset Password:', error);
    return res.status(500).json({ error: 'Error al restablecer contraseña.' });
  }
});

// ==========================================
// 🖼️ PIXABAY PROXY
// ==========================================

app.get('/api/pixabay', async (req, res) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: 'El parámetro q es requerido.' });
  }

  if (!PIXABAY_API_KEY) {
    return res.status(500).json({ error: 'PIXABAY_API_KEY no configurada.' });
  }

  try {
    const url = new URL('https://pixabay.com/api/');
    url.searchParams.set('key', PIXABAY_API_KEY);
    url.searchParams.set('q', query);
    url.searchParams.set('image_type', 'photo');
    url.searchParams.set('safesearch', 'true');
    url.searchParams.set('per_page', '20');

    const response = await fetch(url.toString());
    if (!response.ok) {
      return res.status(502).json({ error: 'Error al consultar Pixabay.' });
    }

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('❌ Error Pixabay:', error);
    return res.status(500).json({ error: 'Error al buscar imágenes.' });
  }
});

// ==========================================
// 🎨 RUTAS DE PLANTILLAS
// ==========================================

app.get('/templates', async (_req, res) => {
  try {
    const templates = await sql`
      SELECT id, name, category, thumbnail_url, description,
             COALESCE(width, 794) as width,
             COALESCE(height, 1123) as height
      FROM templates
      ORDER BY id ASC
    `;
    return res.json({ templates });
  } catch (error) {
    console.error('❌ Error Templates:', error);
    return res.status(500).json({ error: 'Error al cargar galería.' });
  }
});

app.get('/templates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await sql`SELECT * FROM templates WHERE id = ${id}`;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada.' });
    }

    const tmpl = result[0];
    const cleanTemplate = {
      ...tmpl,
      elements: tmpl.base_elements || tmpl.elements || []
    };

    return res.json({ template: cleanTemplate });
  } catch (error) {
    console.error(`❌ Error Template ${id}:`, error);
    return res.status(500).json({ error: 'Error al cargar diseño.' });
  }
});

// ==========================================
// 🗂️ RUTAS DE ACTIVIDADES
// ==========================================

app.get('/api/activities', requireAuth, async (req: AuthRequest, res) => {
  try {
    const activities = await sql`
      SELECT a.id,
             a.name,
             a.template_id,
             a.preview_img,
             a.updated_at,
             t.thumbnail_url,
             t.category
      FROM activities a
      LEFT JOIN templates t ON t.id = a.template_id
      WHERE a.user_id = ${req.user!.id}
      ORDER BY a.updated_at DESC
    `;

    return res.json({ success: true, activities });
  } catch (error) {
    console.error('❌ Error Activities:', error);
    return res.status(500).json({ error: 'Error al cargar actividades.' });
  }
});

app.get('/api/activities/:id', requireAuth, async (req: AuthRequest, res) => {
  const { id } = req.params;
  try {
    const result = await sql`
      SELECT * FROM activities
      WHERE id = ${id} AND user_id = ${req.user!.id}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada.' });
    }

    return res.json({ success: true, activity: result[0] });
  } catch (error) {
    console.error('❌ Error Activity:', error);
    return res.status(500).json({ error: 'Error al cargar la actividad.' });
  }
});

app.post('/api/activities/save', requireAuth, async (req: AuthRequest, res) => {
  const { name, templateId, elements, previewImg } = req.body;

  if (!name || !templateId || !elements) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }

  try {
    const created = await sql`
      INSERT INTO activities (user_id, name, template_id, elements, preview_img)
      VALUES (${req.user!.id}, ${name}, ${templateId}, ${sql.json(elements)}, ${previewImg})
      RETURNING id, name
    `;

    return res.json({
      success: true,
      activityId: created[0].id,
      message: 'Actividad guardada con éxito.'
    });
  } catch (error) {
    console.error('❌ Error Guardar Actividad:', error);
    return res.status(500).json({ error: 'No se pudo guardar la actividad.' });
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
    console.error('❌ Error Actualizar Actividad:', error);
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
    console.error('❌ Error Eliminar Actividad:', error);
    return res.status(500).json({ error: 'No se pudo eliminar la actividad.' });
  }
});

// ==========================================
// 💾 RUTAS DE PROYECTOS (LEGACY)
// ==========================================

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
  } catch (e) {
    console.error('❌ Error Guardar:', e);
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
  } catch (e) {
    return res.status(500).json({ error: 'Error al cargar proyectos.' });
  }
});

async function startServer() {
  try {
    await ensureSchema();
    app.listen(port, () => {
      console.log(`🚀 Servidor backend corriendo en http://localhost:${port}`);
      console.log(`🔗 Conectado a base de datos (Supabase)`);
    });
  } catch (error) {
    console.error('❌ Error inicializando servidor:', error);
    process.exit(1);
  }
}

startServer();
