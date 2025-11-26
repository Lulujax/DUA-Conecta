import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import postgres from 'postgres'
import nodemailer from 'nodemailer'
import { randomBytes } from 'crypto'

// --- 1. CARGAR VARIABLES DE ENTORNO ---
const envFile = Bun.file('.env');
if (await envFile.exists()) {
    const text = await envFile.text();
    for (const line of text.split('\n')) {
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            let value = match[2] ? match[2].trim() : '';
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            process.env[match[1]] = value;
        }
    }
}

// Validaciones críticas
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.error("❌ ERROR: Faltan variables en .env (Revisa SMTP_EMAIL y SMTP_PASSWORD)");
    process.exit(1);
}

// --- 2. CONFIGURACIÓN ---
const isRemoteDB = !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1');
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

console.log(`🔌 DB Remota: ${isRemoteDB ? 'SÍ' : 'NO'}`);
console.log(`📧 Sistema de Correo: Gmail SMTP (${process.env.SMTP_EMAIL})`);

// Conexión DB
const sql = postgres(process.env.DATABASE_URL, { 
    ssl: isRemoteDB ? { rejectUnauthorized: false } : false 
});

// Configuración del Transporte de Correo (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

// Helper para enviar correos
async function sendEmail(to: string, subject: string, html: string) {
    try {
        await transporter.sendMail({
            from: `"Soporte DUA-Conecta" <${process.env.SMTP_EMAIL}>`,
            to,
            subject,
            html
        });
        console.log(`✅ Correo enviado a ${to}`);
        return true;
    } catch (error) {
        console.error("❌ Error enviando correo:", error);
        return false;
    }
}

// --- 3. APP ---
const app = new Elysia()
   .use(cors({
        origin: [
            'http://localhost:5173',               
            'http://127.0.0.1:5173',
            'https://dua-conecta.vercel.app',      
            'https://dua-conecta-j1pn.vercel.app'
        ], 
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }))
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!
    }))
    .derive(async ({ jwt, cookie }) => {
        let token = cookie.auth_token?.value;
        if (!token) return { profile: null };
        try {
            const profile = await jwt.verify(token);
            return { profile };
        } catch (e) {
            return { profile: null };
        }
    })

    // --- RUTAS PÚBLICAS ---
    .get('/', () => 'Backend Online 🚀')
    
    .get('/templates', async () => {
        try {
            const templates = await sql`SELECT id, name, category, thumbnail_url, description FROM templates ORDER BY id ASC`;
            return { templates };
        } catch (e) {
            console.error("Error DB templates:", e);
            return { error: "Error cargando plantillas" };
        }
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
        .post('/register', async ({ body, set }) => {
            const { name, email, password } = body as any;
            try {
                const hashed = await Bun.password.hash(password);
                await sql`INSERT INTO users (name, email, password_hash) VALUES (${name}, ${email}, ${hashed})`;
                return { success: true };
            } catch { set.status = 400; return { error: 'Error al registrar. ¿El correo ya existe?' }; }
        })
        .get('/me', ({ profile }) => ({ user: profile ? { name: (profile as any).name, id: (profile as any).userId } : null }))
        .post('/logout', ({ cookie }) => { cookie.auth_token.remove(); return { success: true }; })
        
        // --- RECUPERACIÓN DE CONTRASEÑA (GMAIL) ---
        .post('/forgot-password', async ({ body, set }) => {
            const { email } = body as any;
            const [user] = await sql`SELECT id, name FROM users WHERE email = ${email}`;
            
            // Respondemos éxito siempre por seguridad
            if (!user) return { message: 'Si el correo existe, recibirás un enlace.' };

            // Generar token
            const token = randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 3600000); // 1 hora

            // Guardar en DB (Tabla password_resets)
            try {
                await sql`
                    INSERT INTO password_resets (user_id, token, expires_at)
                    VALUES (${user.id}, ${token}, ${expires})
                    ON CONFLICT (user_id) DO UPDATE SET token = ${token}, expires_at = ${expires}
                `;
            } catch (err) {
                // Si la tabla no existe, intentamos crearla al vuelo (auto-fix)
                await sql`
                    CREATE TABLE IF NOT EXISTS password_resets (
                        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                        token TEXT NOT NULL,
                        expires_at TIMESTAMP NOT NULL
                    );
                `;
                // Reintentar inserción
                await sql`
                    INSERT INTO password_resets (user_id, token, expires_at)
                    VALUES (${user.id}, ${token}, ${expires})
                    ON CONFLICT (user_id) DO UPDATE SET token = ${token}, expires_at = ${expires}
                `;
            }

            // Usamos FRONTEND_URL del .env (en local será localhost:5173)
            const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
            
            const html = `
                <div style="font-family: sans-serif; color: #333;">
                    <h2>Hola ${user.name},</h2>
                    <p>Has solicitado restablecer tu contraseña en DUA-Conecta.</p>
                    <p>Haz clic en el siguiente botón para continuar:</p>
                    <a href="${link}" style="display: inline-block; background:#A084E8; color:white; padding:12px 24px; text-decoration:none; border-radius:50px; font-weight:bold;">Restablecer Contraseña</a>
                    <p style="margin-top:20px; font-size: 0.9em; color: #666;">Este enlace expira en 1 hora.</p>
                </div>
            `;

            const sent = await sendEmail(email, 'Recuperar Contraseña - DUA Conecta', html);
            
            if (!sent) {
                set.status = 500;
                return { error: "Error técnico enviando el correo." };
            }

            return { message: 'Si el correo existe, recibirás un enlace.' };
        })

        .post('/reset-password', async ({ body, set }) => {
            const { token, newPassword } = body as any;

            const [reset] = await sql`
                SELECT user_id FROM password_resets 
                WHERE token = ${token} AND expires_at > NOW()
            `;

            if (!reset) {
                set.status = 400;
                return { error: 'El enlace es inválido o ha expirado.' };
            }

            if (!newPassword || newPassword.length < 8) {
                set.status = 400;
                return { error: 'La contraseña debe tener 8 caracteres.' };
            }

            const hashed = await Bun.password.hash(newPassword);
            
            await sql`UPDATE users SET password_hash = ${hashed} WHERE id = ${reset.user_id}`;
            await sql`DELETE FROM password_resets WHERE user_id = ${reset.user_id}`;

            return { success: true, message: 'Contraseña actualizada. Inicia sesión.' };
        })
    )

    // --- API PROTEGIDA ---
    .group('/api', app => app
        .onBeforeHandle(({ profile, set }) => {
            if (!profile) { set.status = 401; return { error: 'No autorizado' }; }
        })
        .get('/activities', async ({ profile }) => {
            const userId = (profile as any).userId;
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
             if(!act) { set.status = 404; return {error:'No existe'}; }
             return { activity: act };
        })
        .post('/activities/save', async ({ profile, body }) => {
            const userId = (profile as any).userId;
            const { name, templateId, elements, previewImg } = body as any;
            const [act] = await sql`INSERT INTO saved_activities (user_id, name, template_id, elements, preview_img, created_at, updated_at) VALUES (${userId}, ${name}, ${templateId}, ${elements}, ${previewImg}, NOW(), NOW()) RETURNING id`;
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
        .post('/user/change-password', async ({ profile, body, set }) => {
            const { currentPassword, newPassword } = body as any;
            const userId = (profile as any).userId;
            const [user] = await sql`SELECT id, password_hash FROM users WHERE id = ${userId}`;
            if (!user || !(await Bun.password.verify(currentPassword, user.password_hash))) {
                set.status = 401; return { error: 'Contraseña actual incorrecta.' };
            }
            if (!newPassword || newPassword.length < 8) {
                set.status = 400; return { error: 'Mínimo 8 caracteres.' };
            }
            const hashed = await Bun.password.hash(newPassword);
            await sql`UPDATE users SET password_hash = ${hashed} WHERE id = ${userId}`;
            return { success: true, message: 'Contraseña actualizada.' };
        })
        .get('/pixabay', async ({ query, set }) => {
            const q = query.q as string;
            if (!q) { return { hits: [] }; }
            const apiKey = process.env.PIXABAY_API_KEY;
            if (!apiKey) { set.status = 500; return { error: "Falta API Key." }; }
            try {
                const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(q)}&lang=es&image_type=all&safesearch=true&per_page=20`;
                const response = await fetch(url);
                return await response.json();
            } catch (error) {
                set.status = 500; return { error: "Error externo." };
            }
        })
    )
    .listen(process.env.PORT || 3000);

console.log(`🦊 Servidor listo en ${app.server?.hostname}:${app.server?.port}`);