import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import postgres from 'postgres'

// --- CONFIGURACIÓN ---
const isProduction = process.env.NODE_ENV === 'production';

// Conexión a Base de Datos (Supabase)
// Agregamos 'prepare: false' para evitar problemas con Transaction Poolers
const sql = postgres(process.env.DATABASE_URL!, { 
    ssl: { rejectUnauthorized: false },
    prepare: false 
});

const app = new Elysia()
    // 1. LOGGER DE ENTRADA (El Chismoso)
    .onRequest(({ request }) => {
        console.log(`🔔 PETICIÓN ENTRANTE: ${request.method} ${request.url}`);
    })
    // 2. LOGGER DE ERRORES GLOBAL
    .onError(({ code, error }) => {
        console.error(`💥 ERROR CRÍTICO (${code}):`, error);
    })

   .use(cors({
        origin: true, // Aceptamos a todos para probar
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }))
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET || 'secreto-super-seguro-dev'
    }))
    .derive(async ({ jwt, cookie }) => {
        let token = cookie.auth_token?.value;
        if (!token) return { profile: null };
        try { return { profile: await jwt.verify(token) }; } 
        catch (e) { return { profile: null }; }
    })

    .get('/', () => 'Backend DUA-Conecta Online 🚀')

    // RUTA DE PRUEBA DE DB (Úsala para ver si la DB responde)
    .get('/api/test-db', async () => {
        try {
            console.log("🔍 Probando conexión a DB...");
            const [result] = await sql`SELECT version()`;
            console.log("✅ DB Responde:", result);
            return { status: "OK", version: result.version };
        } catch (error) {
            console.error("❌ Error conectando a DB:", error);
            return { status: "ERROR", detail: error };
        }
    })

    .get('/templates', async () => {
        console.log("📂 Solicitando plantillas...");
        try {
            const templates = await sql`SELECT id, name, category, thumbnail_url, description FROM templates ORDER BY id ASC`;
            return { templates };
        } catch (e) {
            console.error("❌ Error cargando plantillas:", e);
            return { error: "Error cargando plantillas" };
        }
    })
    
    .get('/templates/:id', async ({ params: { id }, set }) => {
        const [t] = await sql`SELECT * FROM templates WHERE id = ${id}`;
        if (!t) { set.status = 404; return { error: 'No encontrada' }; }
        return { template: t };
    })

    .group('/auth', app => app
        .post('/register', async ({ body, set }) => {
            const { name, email, password } = body as any;
            console.log(`📝 Intento de registro: ${email}`); 

            try {
                // Verificar si ya existe
                const [existing] = await sql`SELECT id FROM users WHERE email = ${email}`;
                if (existing) {
                    console.log("⚠️ El usuario ya existe");
                    set.status = 400;
                    return { error: 'El correo ya está registrado.' };
                }

                console.log("🔑 Hasheando contraseña...");
                const hashed = await Bun.password.hash(password);
                
                console.log("💾 Guardando en DB...");
                await sql`INSERT INTO users (name, email, password_hash) VALUES (${name}, ${email}, ${hashed})`;
                
                console.log("✅ Registro exitoso");
                return { success: true };
            } catch (err) { 
                console.error("❌ ERROR EN REGISTER:", err); // <--- ESTO SALDRÁ EN RENDER
                set.status = 500; 
                return { error: `Error interno: ${err}` }; 
            }
        })

        .post('/login', async ({ body, jwt, cookie, set }) => {
            console.log("👤 Intento de Login...");
            try {
                const { email, password } = body as any;
                console.log(`🔍 Buscando usuario: ${email}`);

                const [user] = await sql`SELECT * FROM users WHERE email = ${email}`;
                
                if (!user) {
                    console.log("🚫 Usuario no encontrado");
                    set.status = 401; return { error: 'Credenciales inválidas' };
                }

                console.log("🔐 Verificando password...");
                const isValid = await Bun.password.verify(password, user.password_hash);
                
                if (!isValid) {
                    console.log("🚫 Password incorrecto");
                    set.status = 401; return { error: 'Credenciales inválidas' };
                }
                
                console.log("✅ Login correcto. Generando token...");
                const token = await jwt.sign({ userId: user.id, name: user.name });
                
                cookie.auth_token.set({
                    value: token,
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    maxAge: 7 * 86400,
                    path: '/'
                });

                return { success: true, user: { name: user.name, email: user.email } }; 
            } catch (err) {
                console.error("❌ ERROR EN LOGIN:", err); // <--- ESTO SALDRÁ EN RENDER
                set.status = 500;
                return { error: `Error login: ${err}` };
            }
        })

        .get('/me', ({ profile }) => ({ user: profile ? { name: (profile as any).name, id: (profile as any).userId } : null }))
        
        .post('/logout', ({ cookie }) => { 
            cookie.auth_token.remove(); 
            return { success: true }; 
        })
    )
    .listen(process.env.PORT || 3000);

console.log(`🚀 Servidor CHISMOSO listo en el puerto ${process.env.PORT || 3000}`);