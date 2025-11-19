import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import postgres from 'postgres'
import { z } from 'zod'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

// --- CARGADOR MANUAL .ENV ---
const envFile = Bun.file('.env');
if (await envFile.exists()) {
    const text = await envFile.text();
    for (const line of text.split('\n')) {
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] ? match[2].trim() : '';
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[key] = value;
        }
    }
    console.log("✅ Variables de entorno cargadas.");
}

// --- VALIDACIONES ---
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
    throw new Error("ERROR CRÍTICO: Faltan variables de entorno (JWT_SECRET o DATABASE_URL).");
}

// --- SERVICIOS ---
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : { emails: { send: async () => ({ error: { message: "Email no configurado" } }) } };

const isProduction = !process.env.DATABASE_URL.includes('localhost');
const sql = postgres(process.env.DATABASE_URL, { ssl: isProduction ? 'require' : false });

// --- APP ---
const app = new Elysia()
   .use(cors({
        origin: ['http://localhost:5173', 'https://dua-conecta-j1pn.vercel.app'], 
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }))
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!
    }))
    // --- MIDDLEWARE DE AUTENTICACIÓN ---
    .derive(async ({ jwt, cookie, headers }) => {
        let token = cookie.auth_token?.value;
        if (!token && headers.authorization?.startsWith('Bearer ')) {
            token = headers.authorization.substring(7);
        }
        if (!token) return { profile: null };
        const profile = await jwt.verify(token);
        return { profile };
    })

    // --- RUTAS PÚBLICAS ---
    .group('/auth', (app) => app
        .post('/register', async ({ body, set }) => {
            const Schema = z.object({ name: z.string().min(3), email: z.string().email(), password: z.string().min(8) });
            const val = Schema.safeParse(body);
            if (!val.success) { set.status = 400; return { error: 'Datos inválidos' }; }
            try {
                const hashed = await Bun.password.hash(val.data.password);
                await sql`INSERT INTO users (name, email, password_hash) VALUES (${val.data.name}, ${val.data.email}, ${hashed})`;
                set.status = 201; 
                return { success: true, message: 'Usuario registrado.' };
            } catch (e) {
                set.status = 409; return { error: 'El correo ya existe.' };
            }
        })
        .post('/login', async ({ jwt, cookie, body, set }) => {
             const Schema = z.object({ email: z.string().email(), password: z.string().min(1) });
             const val = Schema.safeParse(body);
             if (!val.success) { set.status = 400; return { error: 'Datos inválidos' }; }
             
             const [user] = await sql`SELECT * FROM users WHERE email = ${val.data.email}`;
             if (!user || !(await Bun.password.verify(val.data.password, user.password_hash))) {
                 set.status = 401; return { error: 'Credenciales incorrectas.' };
             }

             const token = await jwt.sign({ userId: user.id, name: user.name });
             
             cookie.auth_token.set({
                 value: token,
                 httpOnly: true,
                 secure: isProduction,
                 sameSite: isProduction ? 'none' : 'lax',
                 maxAge: 7 * 86400,
                 path: '/'
             });

             return { success: true, user: { name: user.name, email: user.email } };
        })
        .post('/logout', ({ cookie }) => {
            cookie.auth_token.remove();
            return { success: true };
        })
        .get('/me', ({ profile }) => {
            if (!profile) return { user: null };
            return { user: { name: (profile as any).name, id: (profile as any).userId } };
        })
        // ... (Rutinas de forgot/reset password omitidas por brevedad, pero deben estar aquí si las usas)
    )

    // --- RUTAS PLANTILLAS ---
    .get('/templates', async ({ set }) => {
        try {
            const templates = await sql`SELECT id, name, category, thumbnail_url, description FROM templates ORDER BY id ASC`;
            return { success: true, templates };
        } catch (error) {
            console.error("Error al listar plantillas:", error);
            set.status = 500; return { error: 'Error al cargar plantillas' };
        }
    })
    .get('/templates/:id', async ({ params: { id }, set }) => {
        try {
            const templateId = parseInt(id);
            if (isNaN(templateId)) { set.status = 400; return { error: 'ID inválido' }; }
            const [template] = await sql`SELECT * FROM templates WHERE id = ${templateId}`;
            if (!template) { set.status = 404; return { error: 'Plantilla no encontrada' }; }
            return { success: true, template };
        } catch (error) {
            console.error("Error al obtener plantilla:", error);
            set.status = 500; return { error: 'Error interno' };
        }
    })

    // --- RUTAS PROTEGIDAS (API) ---
    .group('/api', (app) => app
        .onBeforeHandle(({ profile, set }) => {
            if (!profile) { set.status = 401; return { error: 'No autorizado' }; }
        })
        // MEJORA: Guardar con imagen de preview
        .post('/activities/save', async ({ profile, body, set }) => {
            const userId = (profile as any).userId;
            const { name, templateId, elements, previewImg } = body as any;
            
            const [act] = await sql`
                INSERT INTO saved_activities (user_id, name, template_id, elements, preview_img) 
                VALUES (${userId}, ${name}, ${templateId}, ${elements}, ${previewImg}) 
                RETURNING id
            `;
            return { success: true, activityId: act.id };
        })
        // MEJORA: Obtener actividades con su preview e info de la plantilla
        .get('/activities', async ({ profile }) => {
            const userId = (profile as any).userId;
            try {
                const activities = await sql`
                    SELECT 
                        a.id, a.name, a.template_id, a.updated_at, a.preview_img,
                        t.thumbnail_url, t.category
                    FROM saved_activities a
                    JOIN templates t ON a.template_id::int = t.id
                    WHERE a.user_id = ${userId}
                    ORDER BY a.updated_at DESC
                `;
                return { activities };
            } catch (error) {
                // Fallback por si falla el JOIN
                const activities = await sql`SELECT * FROM saved_activities WHERE user_id = ${userId}`;
                return { activities };
            }
        })
        .get('/activities/:id', async ({ profile, params, set }) => {
             const userId = (profile as any).userId;
             const [act] = await sql`SELECT * FROM saved_activities WHERE id = ${params.id} AND user_id = ${userId}`;
             if(!act) { set.status=404; return {error:'No encontrada'}; }
             return { activity: act };
        })
        // MEJORA: Actualizar con imagen de preview
        .put('/activities/:id', async ({ profile, params, body, set }) => {
             const userId = (profile as any).userId;
             const { name, templateId, elements, previewImg } = body as any;
             
             await sql`
                UPDATE saved_activities 
                SET name=${name}, template_id=${templateId}, elements=${elements}, preview_img=${previewImg}, updated_at=NOW() 
                WHERE id=${params.id} AND user_id=${userId}
             `;
             return { success: true };
        })
        .delete('/activities/:id', async ({ profile, params }) => {
             const userId = (profile as any).userId;
             await sql`DELETE FROM saved_activities WHERE id=${params.id} AND user_id=${userId}`;
             return { success: true };
        })
        // ... otras rutas ...
    )
    .listen(process.env.PORT || 3000);

// --- INICIALIZACIÓN DE DB ---
async function initDB() {
    try {
        console.log("🏗️  Verificando estructura de la base de datos...");
        
        // Tablas base (resumido para brevedad, asegura que estén tus CREATE TABLE completos aquí como antes)
        await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW());`;
        await sql`CREATE TABLE IF NOT EXISTS password_reset_tokens (user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, token TEXT NOT NULL, expires_at TIMESTAMP NOT NULL);`;
        await sql`CREATE TABLE IF NOT EXISTS saved_activities (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, template_id TEXT NOT NULL, elements JSONB NOT NULL, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());`;
        await sql`CREATE TABLE IF NOT EXISTS templates (id SERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, thumbnail_url TEXT, description TEXT, base_elements JSONB NOT NULL, created_at TIMESTAMP DEFAULT NOW());`;

        // MIGRACIÓN AUTOMÁTICA: Añadir columna preview_img si no existe
        try {
            await sql`ALTER TABLE saved_activities ADD COLUMN IF NOT EXISTS preview_img TEXT`;
            console.log("✅ Columna 'preview_img' verificada.");
        } catch (e) { 
            /* Ignorar si ya existe */ 
        }

        console.log("✅ Tablas listas.");
    } catch (error) {
        console.error("❌ ERROR GRAVE DB:", error);
        process.exit(1);
    }
}
await initDB();

console.log(`🦊 Servidor Seguro corriendo en http://localhost:3000`);