import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'

// --- CONFIGURACIÓN ---
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
const BREVO_API_KEY = process.env.BREVO_API_KEY; 
const SENDER_EMAIL = process.env.SENDER_EMAIL || "tu_email@gmail.com"; 

// Determinar si estamos en Producción (Render) o Desarrollo (Local)
const isProduction = process.env.NODE_ENV === 'production';

// Conexión DB
const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false }, prepare: false });

// --- FUNCIÓN ENVÍO CORREO (Brevo HTTP) ---
async function sendEmailBrevo(to: string, subject: string, htmlContent: string) {
    if (!BREVO_API_KEY) { console.error("Falta BREVO_API_KEY"); return false; }
    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'accept': 'application/json', 'api-key': BREVO_API_KEY, 'content-type': 'application/json' },
            body: JSON.stringify({ sender: { email: SENDER_EMAIL, name: "Soporte DUA" }, to: [{ email: to }], subject: subject, htmlContent: htmlContent })
        });
        return response.ok;
    } catch (error) { console.error("Error Brevo:", error); return false; }
}

// MIGRACIÓN
(async () => {
    try {
        await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW(), reset_token TEXT, reset_expires TIMESTAMP)`;
        await sql`CREATE TABLE IF NOT EXISTS templates (id SERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT, thumbnail_url TEXT, description TEXT, base_elements JSONB DEFAULT '[]', created_at TIMESTAMP DEFAULT NOW())`;
        await sql`CREATE TABLE IF NOT EXISTS activities (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW(), template_id INTEGER, elements JSONB DEFAULT '[]', preview_img TEXT, updated_at TIMESTAMP DEFAULT NOW())`;
        // Columnas
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS template_id INTEGER`;
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'`;
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS preview_img TEXT`;
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP`;
        console.log("✅ DB Lista");
    } catch (e) { console.error("Error DB", e); }
})();

const app = new Elysia()
    .onError(({ code, error, set }) => {
        const msg = error.toString();
        if (msg.includes('misma')) { set.status = 400; return { error: "La contraseña es igual a la actual." }; }
        if (msg.includes('inválido') || msg.includes('expirado')) { set.status = 401; return { error: "Enlace inválido o expirado." }; }
        return { error: msg };
    })
    // CORS: Fundamental para que el frontend pueda leer la cookie
    .use(cors({ 
        origin: true, // Acepta cualquier origen (útil para dev y prod)
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], 
        allowedHeaders: ['Content-Type', 'Authorization'], 
        credentials: true // OBLIGATORIO para cookies
    }))
    .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'secret' }))
    .derive(async ({ jwt, cookie }) => {
        const token = cookie.auth_token?.value;
        if (!token) return { user: null };
        try { const p = await jwt.verify(token); return { user: p || null }; } catch { return { user: null }; }
    })
    
    // --- PEXELS ---
    .group('/api/external', app => app
        .get('/images', async ({ query }) => {
            try {
                const q = query.q || 'education';
                const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(String(q))}&per_page=20&locale=es-ES`, { headers: { Authorization: PEXELS_API_KEY } });
                const d:any = await r.json();
                return { success: true, images: d.photos?.map((p:any) => ({ id: p.id, url: p.src.large2x, thumbnail: p.src.medium, width: p.width, height: p.height })) || [] };
            } catch { return { success: false, images: [] }; }
        })
    )

    // --- AUTH ---
    .group('/auth', app => app
        .post('/login', async ({ body, jwt, cookie, set }) => {
            const { email, password } = body as any;
            const [u] = await sql`SELECT * FROM users WHERE email = ${String(email).toLowerCase().trim()}`;
            
            if (!u || !(await bcrypt.compare(String(password).trim(), u.password_hash))) { 
                set.status = 401; 
                return { error: 'Credenciales inválidas' }; 
            }
            
            // --- CONFIGURACIÓN DE COOKIE INTELIGENTE ---
            cookie.auth_token.set({ 
                value: await jwt.sign({ userId: u.id, name: u.name, email: u.email }), 
                httpOnly: true, 
                path: '/',
                // Si es Producción -> Secure TRUE. Si es Local -> Secure FALSE
                secure: isProduction,      
                // Si es Producción -> 'none' (cross-site). Si es Local -> 'lax'
                sameSite: isProduction ? 'none' : 'lax',  
                maxAge: 60 * 60 * 24 * 7 // 7 días
            });
            
            return { success: true, user: { name: u.name, email: u.email } };
        })
        .post('/register', async ({ body, set }) => {
            try {
                const { name, email, password } = body as any;
                const hashed = await bcrypt.hash(String(password).trim(), 10);
                await sql`INSERT INTO users (name, email, password_hash) VALUES (${name}, ${String(email).toLowerCase().trim()}, ${hashed})`;
                return { success: true };
            } catch { set.status = 400; return { error: "El correo ya está registrado." }; }
        })
        .post('/forgot-password', async ({ body, set }) => {
            const { email } = body as any;
            const cleanEmail = String(email).toLowerCase().trim();
            const [u] = await sql`SELECT id, name FROM users WHERE email = ${cleanEmail}`;
            if (!u) throw new Error("Usuario no encontrado");

            const token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
            await sql`UPDATE users SET reset_token = ${token}, reset_expires = NOW() + INTERVAL '30 minutes' WHERE id = ${u.id}`;
            
            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&email=${cleanEmail}`;

            // Intento de envío
            const enviado = await sendEmailBrevo(cleanEmail, 'Restablecer contraseña', `<a href="${resetLink}">Recuperar aquí</a>`);

            if (!enviado) {
                console.log("⚠️ Falló envío correo. Link manual:", resetLink);
                // No retornamos error para no asustar al usuario si falla el servicio de correo gratuito
            }
            return { success: true };
        })
        .post('/reset-password-confirm', async ({ body }) => {
            const { email, code, newPassword } = body as any;
            const [u] = await sql`SELECT * FROM users WHERE email = ${String(email).toLowerCase().trim()} AND reset_token = ${code} AND reset_expires > NOW()`;
            if (!u) throw new Error("Enlace inválido o expirado");
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
        // Logout: importante limpiar la cookie con los mismos parámetros
        .post('/logout', ({ cookie }) => { 
            cookie.auth_token.remove({ 
                path: '/', 
                sameSite: isProduction ? 'none' : 'lax', 
                secure: isProduction 
            }); 
            return { success: true }; 
        })
        .get('/me', ({ user }) => ({ user }))
    )
    
    // --- RUTAS DE ACTIVIDADES ---
    .group('/api/activities', app => app
         .get('/', async ({ user }) => { if(!user) return {activities:[]}; try { return {activities: await sql`SELECT * FROM activities WHERE user_id = ${(user as any).userId} ORDER BY updated_at DESC`}} catch {return {activities:[]}}})
         .post('/save', async ({ body, user, set }) => {
            if(!user) { set.status=401; return {error:'Login requerido'} }
            const { name, templateId, elements, previewImg } = body as any;
            try {
                const tId = parseInt(templateId) || null;
                const [n] = await sql`INSERT INTO activities (user_id, template_id, name, elements, preview_img) VALUES (${(user as any).userId}, ${tId}, ${name}, ${JSON.stringify(elements)}::jsonb, ${previewImg}) RETURNING id`;
                return { success: true, activityId: n.id };
            } catch(e) { set.status=500; return {error:'Error guardar'} }
         })
         .get('/:id', async ({params:{id}, user}) => {
             if(!user) return {error:'No autorizado'};
             const [a] = await sql`SELECT * FROM activities WHERE id=${id} AND user_id=${(user as any).userId}`;
             return { activity: a || null };
         })
         .put('/:id', async ({params:{id}, body, user, set}) => {
             if(!user) { set.status=401; return {error:'No'} };
             const { name, elements, previewImg } = body as any;
             const [u] = await sql`UPDATE activities SET name=${name}, elements=${JSON.stringify(elements)}::jsonb, preview_img=${previewImg}, updated_at=NOW() WHERE id=${id} AND user_id=${(user as any).userId} RETURNING id`;
             if (!u) { set.status=404; return {error: 'No encontrado'}; }
             return { success: true };
         })
         .delete('/:id', async ({params:{id}, user}) => {
             if(!user) return {error:'No'};
             await sql`DELETE FROM activities WHERE id=${id} AND user_id=${(user as any).userId}`;
             return { success: true };
         })
    )
    .get('/templates', async () => ({ templates: await sql`SELECT * FROM templates ORDER BY id ASC` }))
    .get('/templates/:id', async ({params:{id}}) => ({ template: (await sql`SELECT * FROM templates WHERE id=${parseInt(id)}`)[0] }))
    .listen(process.env.PORT || 3000);

console.log(`🚀 Servidor listo en puerto ${process.env.PORT || 3000} | Producción: ${isProduction}`);