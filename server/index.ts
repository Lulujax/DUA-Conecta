import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'

// --- CLAVE PEXELS INTEGRADA ---
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "FkomuRcVuCwLLqNyPJb66W4ed38f0PsWvr3DXIdwB5Mr8a5qOC6qa4ai";

// 1. CONEXIÓN DB
const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false }, prepare: false });

// 2. CONFIGURACIÓN CORREO (MODO AUTOMÁTICO 'SERVICE')
// Esta configuración le dice a Nodemailer que use los presets internos de Google
// evitando problemas manuales de puertos o certificados.
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: { 
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS 
    }
});

// 3. MIGRACIÓN AUTOMÁTICA
(async () => {
    try {
        console.log("🛠️ Verificando tablas...");
        await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW(), reset_token TEXT, reset_expires TIMESTAMP)`;
        await sql`CREATE TABLE IF NOT EXISTS templates (id SERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT, thumbnail_url TEXT, description TEXT, base_elements JSONB DEFAULT '[]', created_at TIMESTAMP DEFAULT NOW())`;
        await sql`CREATE TABLE IF NOT EXISTS activities (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW(), template_id INTEGER, elements JSONB DEFAULT '[]', preview_img TEXT, updated_at TIMESTAMP DEFAULT NOW())`;
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS template_id INTEGER`;
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'`;
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS preview_img TEXT`;
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP`;
        console.log("✅ Tablas listas.");
    } catch (err) { console.error("⚠️ Error DB Init:", err); }
})();

const app = new Elysia()
    .onError(({ code, error, set }) => {
        const msg = error.toString();
        if (msg.includes('misma')) { set.status = 400; return { error: "⚠️ La nueva contraseña es igual a la actual." }; }
        if (msg.includes('inválido') || msg.includes('expirado')) { set.status = 401; return { error: "El enlace es inválido o ha expirado." }; }
        if (msg.includes('no encontrado')) { set.status = 404; return { error: "Usuario no encontrado." }; }
        return { error: msg };
    })
    // CORS PARA VERCEL
   .use(cors({ 
        origin: true, 
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
        allowedHeaders: ['Content-Type', 'Authorization'], 
        credentials: true 
    }))
    .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'secret' }))
    .derive(async ({ jwt, cookie }) => {
        const token = cookie.auth_token?.value;
        if (!token) return { user: null };
        try { const p = await jwt.verify(token); return { user: p || null }; } catch { return { user: null }; }
    })

    // --- PEXELS ---
    .group('/api/external', app => app
        .get('/images', async ({ query, set }) => {
            const q = query.q ? String(query.q) : 'school';
            const page = query.page ? String(query.page) : '1';

            try {
                const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=20&page=${page}&locale=es-ES`, {
                    headers: { Authorization: PEXELS_API_KEY }
                });

                if (!response.ok) throw new Error(`Pexels: ${response.statusText}`);
                const data: any = await response.json();
                
                const images = data.photos.map((p: any) => ({
                    id: p.id,
                    url: p.src.large2x || p.src.large,
                    thumbnail: p.src.medium,
                    alt: p.alt || 'Imagen',
                    width: p.width,
                    height: p.height
                }));

                return { success: true, images };
            } catch (error) {
                console.error("Error imágenes:", error);
                return { success: false, images: [] };
            }
        })
    )

    // --- ACTIVIDADES ---
    .group('/api/activities', app => app
        .get('/', async ({ user }) => { if (!user) return { activities: [] }; try { return { activities: await sql`SELECT * FROM activities WHERE user_id = ${(user as any).userId} ORDER BY updated_at DESC` }; } catch { return { activities: [] }; } })
        .post('/save', async ({ body, user, set }) => {
            if (!user) { set.status = 401; return { error: 'Login requerido' }; }
            const { name, templateId, elements, previewImg } = body as any;
            try {
                let tId = parseInt(templateId); if (isNaN(tId)) tId = null;
                const safeElements = JSON.stringify(elements || []);
                const [newActivity] = await sql`INSERT INTO activities (user_id, template_id, name, elements, preview_img) VALUES (${(user as any).userId}, ${tId}, ${name}, ${safeElements}::jsonb, ${previewImg}) RETURNING id`;
                return { success: true, activityId: newActivity.id, message: "¡Guardado!" };
            } catch (e) { set.status = 500; return { error: "Error al guardar" }; }
        })
        .put('/:id', async ({ params: { id }, body, user, set }) => {
            if (!user) { set.status = 401; return { error: 'No autorizado' }; }
            const { name, elements, previewImg } = body as any;
            try {
                const safeElements = JSON.stringify(elements || []);
                const [updated] = await sql`UPDATE activities SET name = ${name}, elements = ${safeElements}::jsonb, preview_img = ${previewImg}, updated_at = NOW() WHERE id = ${id} AND user_id = ${(user as any).userId} RETURNING id`;
                if (!updated) { set.status = 404; return { error: "No encontrado" }; }
                return { success: true };
            } catch (e) { set.status = 500; return { error: String(e) }; }
        })
        .get('/:id', async ({ params: { id }, user }) => {
            if (!user) return { error: 'No autorizado' };
            const [act] = await sql`SELECT * FROM activities WHERE id = ${id} AND user_id = ${(user as any).userId}`;
            return { activity: act || null };
        })
        .delete('/:id', async ({ params: { id }, user }) => {
            if (!user) return { error: 'No' };
            await sql`DELETE FROM activities WHERE id = ${id} AND user_id = ${(user as any).userId}`;
            return { success: true };
        })
    )
    .get('/templates', async () => { try { return { templates: await sql`SELECT * FROM templates ORDER BY id ASC` }; } catch { return { templates: [] }; } })
    .get('/templates/:id', async ({ params: { id } }) => { const t = await sql`SELECT * FROM templates WHERE id = ${parseInt(id)}`; return { template: t[0] || null }; })

    // --- AUTH ---
    .group('/auth', app => app
        .post('/login', async ({ body, jwt, cookie, set }) => {
            const { email, password } = body as any;
            const [u] = await sql`SELECT * FROM users WHERE email = ${String(email).toLowerCase().trim()}`;
            if (!u || !(await bcrypt.compare(String(password).trim(), u.password_hash))) { set.status = 401; return { error: 'Credenciales inválidas' }; }
            
            cookie.auth_token.set({ 
                value: await jwt.sign({ userId: u.id, name: u.name, email: u.email }), 
                httpOnly: true, 
                path: '/',
                secure: true,      // HTTPS Production
                sameSite: 'none',  // Cross-Site Vercel/Render
                maxAge: 60 * 60 * 24 * 7 
            });
            
            return { success: true, user: { name: u.name, email: u.email } };
        })
        .post('/register', async ({ body, set }) => {
            try {
                const { name, email, password } = body as any;
                const hashed = await bcrypt.hash(String(password).trim(), 10);
                await sql`INSERT INTO users (name, email, password_hash) VALUES (${name}, ${String(email).toLowerCase().trim()}, ${hashed})`;
                return { success: true };
            } catch (e) { set.status = 400; return { error: "Registrado" }; }
        })
        .post('/forgot-password', async ({ body }) => {
            console.log("📨 Recuperando contraseña...");
            const { email } = body as any;
            const cleanEmail = String(email).toLowerCase().trim();
            const [u] = await sql`SELECT id, name FROM users WHERE email = ${cleanEmail}`;
            if (!u) throw new Error("Usuario no encontrado");

            const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            await sql`UPDATE users SET reset_token = ${token}, reset_expires = NOW() + INTERVAL '30 minutes' WHERE id = ${u.id}`;
            
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const resetLink = `${baseUrl}/reset-password?token=${token}&email=${cleanEmail}`;

            try {
                await transporter.sendMail({
                    from: '"Soporte DUA-Conecta" <no-reply@duaconecta.com>',
                    to: cleanEmail,
                    subject: '🔒 Restablecer contraseña',
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; border: 1px solid #eee; border-radius: 8px;">
                            <h2 style="color: #A084E8;">Recuperar Acceso</h2>
                            <p>Hola <strong>${u.name}</strong>,</p>
                            <a href="${resetLink}" style="background-color: #A084E8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Restablecer Contraseña</a>
                        </div>
                    `
                });
                console.log("✅ Enviado a:", cleanEmail);
                return { success: true };
            } catch (error: any) { 
                console.error("💥 Error SMTP:", error);
                throw new Error("Error conectando con Gmail."); 
            }
        })
        .post('/reset-password-confirm', async ({ body }) => {
            const { email, code, newPassword } = body as any;
            const [u] = await sql`SELECT * FROM users WHERE email = ${String(email).toLowerCase().trim()} AND reset_token = ${code} AND reset_expires > NOW()`;
            if (!u) throw new Error("El enlace es inválido o ha expirado.");
            if (await bcrypt.compare(String(newPassword).trim(), u.password_hash)) throw new Error("misma");
            const hashed = await bcrypt.hash(String(newPassword).trim(), 10);
            await sql`UPDATE users SET password_hash = ${hashed}, reset_token = NULL, reset_expires = NULL WHERE id = ${u.id}`;
            return { success: true };
        })
        .post('/change-password', async ({ body, user, set }) => {
            if (!user) return { error: "No autorizado" };
            const { currentPassword, newPassword } = body as any;
            const [u] = await sql`SELECT * FROM users WHERE id = ${(user as any).userId}`;
            if (!u) return { error: "Usuario no encontrado" };
            if (!(await bcrypt.compare(String(currentPassword).trim(), u.password_hash))) { set.status = 401; return { success: false, code: 'incorrecta' }; }
            if (await bcrypt.compare(String(newPassword).trim(), u.password_hash)) { set.status = 400; return { success: false, code: 'misma' }; }
            const hashed = await bcrypt.hash(String(newPassword).trim(), 10);
            await sql`UPDATE users SET password_hash = ${hashed} WHERE id = ${u.id}`;
            return { success: true };
        })
        .get('/me', ({ user }) => ({ user }))
        .post('/logout', ({ cookie }) => { 
            cookie.auth_token.remove({ path: '/', sameSite: 'none', secure: true }); 
            return { success: true }; 
        })
    )
    .listen(process.env.PORT || 3000);

console.log(`🚀 Servidor activo en puerto ${process.env.PORT || 3000}`);