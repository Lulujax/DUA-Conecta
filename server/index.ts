import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import postgres from 'postgres';

// 1. Cargar variables de entorno
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// 2. Configuración de Base de Datos (Postgres / Supabase)
// Asegúrate de que tu .env tenga DATABASE_URL=postgres://postgres.tuusuario:pass@aws-0-us-west-1.pooler.supabase.com:6543/postgres
const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require',     // Necesario para Supabase en producción/nube
  max: 10,            // Máximo de conexiones simultáneas
  idle_timeout: 20,   // Cerrar conexiones inactivas
  connect_timeout: 30
});

// 3. Configuración de Seguridad (CORS) - ¡CRUCIAL PARA EL LOGIN!
app.use(cors({
  origin: 'http://localhost:5173', // Solo permitimos a tu Frontend
  credentials: true,               // Permite el paso de cookies/tokens
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aumentar límite de JSON para guardar diseños grandes
app.use(express.json({ limit: '50mb' }));

// ==========================================
// 🔐 RUTAS DE AUTENTICACIÓN (/auth/...)
// ==========================================

// POST /auth/register
app.post('/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    // Verificar si ya existe
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }

    // Insertar usuario
    const newUser = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${password})
      RETURNING id, name, email
    `;

    // Responder con éxito y un token simulado
    res.status(201).json({ 
      user: newUser[0], 
      token: 'token-simulado-' + newUser[0].id 
    });

  } catch (error) {
    console.error('❌ Error Registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario en DB' });
  }
});

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Faltan credenciales' });

  try {
    // Buscar usuario
    const users = await sql`SELECT * FROM users WHERE email = ${email}`;
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];

    // Verificar contraseña (Texto plano por ahora, idealmente usar bcrypt)
    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Login Exitoso
    res.json({ 
      user: { id: user.id, name: user.name, email: user.email },
      token: 'token-simulado-' + user.id 
    });

  } catch (error) {
    console.error('❌ Error Login:', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
});

// GET /auth/me (Para verificar sesión al recargar página)
app.get('/auth/me', (req, res) => {
    // Aquí deberíamos validar el token real. Por simplicidad devolvemos ok si hay header.
    const authHeader = req.headers.authorization;
    if(authHeader) {
        res.json({ valid: true });
    } else {
        res.status(401).json({ error: 'No autorizado' });
    }
});

// ==========================================
// 🎨 RUTAS DE PLANTILLAS
// ==========================================

app.get('/templates', async (req, res) => {
  try {
    // Usamos COALESCE para evitar errores si width/height vienen vacíos
    const templates = await sql`
      SELECT id, name, category, thumbnail_url, description, 
             COALESCE(width, 794) as width, 
             COALESCE(height, 1123) as height 
      FROM templates 
      ORDER BY id ASC
    `;
    res.json({ templates });
  } catch (error) {
    console.error('❌ Error Templates:', error);
    res.status(500).json({ error: 'Error al cargar galería' });
  }
});

app.get('/templates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await sql`SELECT * FROM templates WHERE id = ${id}`;
    
    if (result.length === 0) return res.status(404).json({ error: 'Plantilla no encontrada' });

    const tmpl = result[0];
    
    // TRUUCO IMPORTANTE: 
    // Tu seed.ts guarda en 'base_elements', pero el editor busca 'elements'.
    // Aquí hacemos la traducción para que el frontend funcione.
    const cleanTemplate = {
        ...tmpl,
        elements: tmpl.base_elements || tmpl.elements || [] 
    };

    res.json({ template: cleanTemplate });

  } catch (error) {
    console.error(`❌ Error Template ${id}:`, error);
    res.status(500).json({ error: 'Error al cargar diseño' });
  }
});

// ==========================================
// 💾 RUTAS DE PROYECTOS (GUARDAR)
// ==========================================

app.post('/projects', async (req, res) => {
  const { userId, name, width, height, elements, thumbnailUrl } = req.body;

  if (!userId || !elements) return res.status(400).json({ error: 'Datos incompletos' });

  try {
    const newProject = await sql`
      INSERT INTO projects (user_id, name, width, height, elements, thumbnail_url)
      VALUES (${userId}, ${name}, ${width}, ${height}, ${elements}::jsonb, ${thumbnailUrl})
      RETURNING id, name
    `;
    res.json({ success: true, project: newProject[0] });
  } catch (e) {
    console.error('❌ Error Guardar:', e);
    res.status(500).json({ error: 'No se pudo guardar el proyecto' });
  }
});

// Obtener mis proyectos
app.get('/projects', async (req, res) => {
    const { userId } = req.query;
    if(!userId) return res.status(400).json({ error: 'Usuario requerido' });

    try {
        const projects = await sql`SELECT * FROM projects WHERE user_id = ${userId} ORDER BY created_at DESC`;
        res.json({ projects });
    } catch(e) {
        res.status(500).json({ error: 'Error al cargar proyectos' });
    }
});

// Iniciar Servidor
app.listen(port, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${port}`);
  console.log(`🔗 Conectado a base de datos (Supabase)`);
});