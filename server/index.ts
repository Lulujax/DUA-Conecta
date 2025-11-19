import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import postgres from 'postgres'
import { z } from 'zod'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

// 1. Configuración .ENV
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
}

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
    console.error("❌ FALTA .ENV (JWT_SECRET o DATABASE_URL)");
    process.exit(1);
}

// 2. Base de Datos
const sql = postgres(process.env.DATABASE_URL, { 
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : 'require' 
});

// 3. Inicializador DB
async function initDB() {
    try {
        console.log("🏗️ Verificando tablas...");
        await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT, email TEXT UNIQUE, password_hash TEXT, created_at TIMESTAMP DEFAULT NOW())`;
        await sql`CREATE TABLE IF NOT EXISTS password_reset_tokens (user_id INT, token TEXT, expires_at TIMESTAMP)`;
        await sql`CREATE TABLE IF NOT EXISTS templates (id SERIAL PRIMARY KEY, name TEXT, category TEXT, thumbnail_url TEXT, description TEXT, base_elements JSONB, created_at TIMESTAMP DEFAULT NOW())`;
        await sql`CREATE TABLE IF NOT EXISTS saved_activities (id SERIAL PRIMARY KEY, user_id INT, name TEXT, template_id TEXT, elements JSONB, preview_img TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`;
        console.log("✅ Tablas listas.");
    } catch (e) {
        console.error("Error DB init:", e);
    }
}
await initDB();

// 4. La APP Elysia
const app = new Elysia()
    .use(cors({
        origin: ['http://localhost:5173', 'https://dua-conecta-j1pn.vercel.app'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization']
    }))
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!
    }))
    .derive(async ({ jwt, cookie, headers }) => {
        const token = cookie.auth_token?.value || headers.authorization?.slice(7);
        return { profile: token ? await jwt.verify(token) : null };
    })

    // --- RUTAS PÚBLICAS ---
    .get('/', () => 'Backend Online 🚀')
    
    .get('/templates', async () => {
        const templates = await sql`SELECT id, name, category, thumbnail_url, description FROM templates ORDER BY id ASC`;
        return { templates };
    })
    
    .get('/templates/:id', async ({ params: { id }, set }) => {
        const [t] = await sql`SELECT * FROM templates WHERE id = ${id}`;
        if (!t) { set.status = 404; return { error: 'No encontrada' }; }
        return { template: t };
    })

    // --- AUTH ---
    .group('/auth', app => app
        .post('/login', async ({ body, jwt, cookie, set }) => {
            const { email, password } = body as any;
            const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
            if (!user || !(await Bun.password.verify(password, user.password_hash))) {
                set.status = 401; return { error: 'Credenciales inválidas' };
            }
            const token = await jwt.sign({ userId: user.id, name: user.name });
            cookie.auth_token.set({ value: token, httpOnly: true, path: '/', maxAge: 604800, secure: true, sameSite: 'none' });
            return { success: true, user: { name: user.name, email: user.email } };
        })
        .post('/register', async ({ body, set }) => {
            const { name, email, password } = body as any;
            try {
                const hashed = await Bun.password.hash(password);
                await sql`INSERT INTO users (name, email, password_hash) VALUES (${name}, ${email}, ${hashed})`;
                return { success: true };
            } catch { set.status = 400; return { error: 'Error al registrar' }; }
        })
        .get('/me', ({ profile }) => ({ user: profile ? { name: (profile as any).name, id: (profile as any).userId } : null }))
        .post('/logout', ({ cookie }) => { cookie.auth_token.remove(); return { success: true }; })
    )

    // --- API PROTEGIDA ---
    .group('/api', app => app
        .onBeforeHandle(({ profile, set }) => {
            if (!profile) { set.status = 401; return { error: 'No autorizado' }; }
        })
        .get('/activities', async ({ profile }) => {
            const userId = (profile as any).userId;
            // Consulta con JOIN para traer datos de la plantilla
            const activities = await sql`
                SELECT a.id, a.name, a.template_id, a.updated_at, a.preview_img, t.thumbnail_url, t.category
                FROM saved_activities a
                LEFT JOIN templates t ON a.template_id::int = t.id
                WHERE a.user_id = ${userId}
                ORDER BY a.updated_at DESC
            `;
            return { activities };
        })
        .get('/activities/:id', async ({ profile, params, set }) => {
             const userId = (profile as any).userId;
             const [act] = await sql`SELECT * FROM saved_activities WHERE id = ${params.id} AND user_id = ${userId}`;
             if(!act) { set.status=404; return {error:'No existe'}; }
             return { activity: act };
        })
        .post('/activities/save', async ({ profile, body }) => {
            const userId = (profile as any).userId;
            const { name, templateId, elements, previewImg } = body as any;
            const [act] = await sql`INSERT INTO saved_activities (user_id, name, template_id, elements, preview_img) VALUES (${userId}, ${name}, ${templateId}, ${elements}, ${previewImg}) RETURNING id`;
            return { success: true, activityId: act.id };
        })
        .put('/activities/:id', async ({ profile, params, body }) => {
            const userId = (profile as any).userId;
            const { name, elements, previewImg } = body as any;
            await sql`UPDATE saved_activities SET name=${name}, elements=${elements}, preview_img=${previewImg}, updated_at=NOW() WHERE id=${params.id} AND user_id=${userId}`;
            return { success: true };
        })
        .delete('/activities/:id', async ({ profile, params }) => {
            const userId = (profile as any).userId;
            await sql`DELETE FROM saved_activities WHERE id=${params.id} AND user_id=${userId}`;
            return { success: true };
        })
    )
    .listen(process.env.PORT || 3000);

console.log(`🦊 Servidor listo en ${app.server?.hostname}:${app.server?.port}`);