import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import postgres from 'postgres'
import { z } from 'zod'
import { Resend } from 'resend'
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
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
    console.error("❌ ERROR: Faltan variables en .env");
    process.exit(1);
}

// --- 2. DETECCIÓN DE ENTORNO ---
const isRemoteDB = !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1');
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

console.log(`🔌 DB Remota: ${isRemoteDB ? 'SÍ' : 'NO'}`);
console.log(`🌍 Entorno Producción: ${isProduction ? 'SÍ' : 'NO'}`);

// Conexión DB
const sql = postgres(process.env.DATABASE_URL, { 
    ssl: isRemoteDB ? { rejectUnauthorized: false } : false 
});

// --- 3. APP ---
const app = new Elysia()
   .use(cors({
        // *** AQUÍ ESTABA EL PROBLEMA ***
        // Actualizamos la lista de dominios permitidos:
        origin: [
            'http://localhost:5173',               // Tu local
            'https://dua-conecta.vercel.app',      // TU NUEVO DOMINIO
            'https://dua-conecta-j1pn.vercel.app'  // (Opcional: dejamos el viejo por si acaso)
        ], 
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true, // IMPORTANTE para las cookies
    }))
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!
    }))
    .derive(async ({ jwt, cookie, headers }) => {
        let token = cookie.auth_token?.value;
        // Soporte legacy para Bearer token (por si acaso)
        if (!token && headers.authorization?.startsWith('Bearer ')) {
            token = headers.authorization.substring(7);
        }
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
            
            // Cookie segura
            cookie.auth_token.set({
                value: token,
                httpOnly: true,
                secure: isProduction, 
                sameSite: isProduction ? 'none' : 'lax', 
                maxAge: 7 * 86400,
                path: '/'
            });

            return { success: true, user: { name: user.name, email: user.email }, token }; 
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
            // JOIN para traer la imagen de la plantilla original
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
        // --- NUEVA RUTA: BUSCADOR DE IMÁGENES (PIXABAY) ---
        .get('/pixabay', async ({ query, set }) => {
            const q = query.q as string;
            if (!q) { return { hits: [] }; }
            
            const apiKey = process.env.PIXABAY_API_KEY;
            if (!apiKey) { 
                set.status = 500; 
                return { error: "Falta configuración de Pixabay en el servidor." }; 
            }

            try {
                // Pedimos a Pixabay (imágenes seguras para niños: safesearch=true)
                // Buscamos vectores e ilustraciones que encajan mejor con tu estilo escolar
                const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(q)}&lang=es&image_type=all&safesearch=true&per_page=20`;
                
                const response = await fetch(url);
                const data = await response.json();
                return data; // Devolvemos el JSON de Pixabay tal cual
            } catch (error) {
                console.error("Error Pixabay:", error);
                set.status = 500;
                return { error: "Error al conectar con Pixabay" };
            }
        })
    )
    .listen(process.env.PORT || 3000);

console.log(`🦊 Servidor listo en ${app.server?.hostname}:${app.server?.port}`);