import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import postgres from 'postgres'
import nodemailer from 'nodemailer'
import { randomBytes } from 'crypto'
import { runSeed } from './seed'; // <--- IMPORTANTE: Importamos la función

// --- CONFIGURACIÓN ---
const isProduction = !!process.env.RENDER || process.env.NODE_ENV === 'production';
const isRemoteDB = !process.env.DATABASE_URL?.includes('localhost');

// Conexión DB Principal (para la API normal)
const sql = postgres(process.env.DATABASE_URL!, { 
    ssl: { rejectUnauthorized: false } // Siempre seguro para Supabase
});

// Configuración Correo
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 587, secure: false,
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
    tls: { rejectUnauthorized: false }
});

const app = new Elysia()
   .use(cors({
        origin: [
            'http://localhost:5173',               
            'https://dua-conecta.vercel.app',
            // Agrega aquí cualquier otro dominio de frontend que tengas
        ], 
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }))
    .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET! }))
    .derive(async ({ jwt, cookie }) => {
        let token = cookie.auth_token?.value;
        if (!token) return { profile: null };
        try { return { profile: await jwt.verify(token) }; } 
        catch (e) { return { profile: null }; }
    })

    .get('/', () => 'Backend DUA-Conecta Online 🚀')
    
    // --- 🚨 RUTA SECRETA DE EMERGENCIA PARA LLENAR DB ---
    .get('/api/semilla-secreta', async () => {
        try {
            console.log("🌱 Iniciando sembrado remoto...");
            await runSeed();
            return "✅ ¡ÉXITO! Base de datos de Supabase reiniciada y cargada correctamente desde Vercel.";
        } catch (error) {
            return `❌ ERROR CRÍTICO AL SEMBRAR: ${error}`;
        }
    })
    // -----------------------------------------------------

    .get('/templates', async () => {
        try {
            const templates = await sql`SELECT id, name, category, thumbnail_url, description FROM templates ORDER BY id ASC`;
            return { templates };
        } catch (e) { return { error: "Error cargando plantillas" }; }
    })
    
    .get('/templates/:id', async ({ params: { id }, set }) => {
        const [t] = await sql`SELECT * FROM templates WHERE id = ${id}`;
        if (!t) { set.status = 404; return { error: 'No encontrada' }; }
        return { template: t };
    })

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
                secure: true, // Siempre true si vamos a Prod
                sameSite: 'none', // Necesario para cross-site cookies
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
            } catch { set.status = 400; return { error: 'Error al registrar.' }; }
        })
        .get('/me', ({ profile }) => ({ user: profile ? { name: (profile as any).name, id: (profile as any).userId } : null }))
        .post('/logout', ({ cookie }) => { 
            cookie.auth_token.remove(); 
            return { success: true }; 
        })
    )
    .listen(process.env.PORT || 3000);

console.log(`🦊 Servidor listo en ${app.server?.hostname}:${app.server?.port}`);