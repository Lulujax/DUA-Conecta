import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'

// --- CONFIGURACIÓN ---
const isProduction = process.env.NODE_ENV === 'production';

// Conexión a Base de Datos
const sql = postgres(process.env.DATABASE_URL!, { 
    ssl: { rejectUnauthorized: false },
    prepare: false 
});

const app = new Elysia()
    // 1. LOGGER DE ENTRADA
    .onRequest(({ request }) => {
        console.log(`🔔 ${request.method} ${request.url}`);
    })
    // 2. LOGGER DE ERRORES
    .onError(({ code, error, set }) => {
        console.error(`💥 ERROR CRÍTICO (${code}):`, error);
        return { error: error.toString() };
    })
    // 3. CORS
   .use(cors({
        origin: true, 
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true, 
    }))
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET || 'secreto-super-seguro-dev'
    }))
    // 4. SESIÓN
    .derive(async ({ jwt, cookie }) => {
        const token = cookie.auth_token?.value;
        if (!token) return { user: null };
        try { 
            const profile = await jwt.verify(token);
            return { user: profile ? profile : null }; 
        } 
        catch (e) { return { user: null }; }
    })

    .get('/', () => ({ status: 'Backend DUA-Conecta Online 🚀' }))

    // --- UTILIDAD PARA BORRAR USUARIO (Ruta temporal) ---
    // Úsala así: http://localhost:3000/api/nuke-user?email=tu@correo.com
    .get('/api/nuke-user', async ({ query }) => {
        if (!query.email) return { error: "Falta el email" };
        try {
            // Normalizamos también aquí por si acaso
            const emailToDelete = String(query.email).toLowerCase().trim();
            await sql`DELETE FROM users WHERE email = ${emailToDelete}`;
            return { success: `Usuario ${emailToDelete} eliminado. ¡Ya puedes registrarte de nuevo!` };
        } catch (e) {
            return { error: String(e) };
        }
    })

    // --- RUTAS DE PLANTILLAS ---
    .get('/templates', async () => {
        try {
            const templates = await sql`
                SELECT id, name, category, thumbnail_url, description, base_elements 
                FROM templates 
                ORDER BY id ASC
            `;
            return { templates };
        } catch (e) {
            console.error("Error cargando lista de plantillas:", e);
            return { error: "Error cargando plantillas" };
        }
    })
    
    .get('/templates/:id', async ({ params: { id }, set }) => {
        try {
            const templateId = parseInt(id);
            if (isNaN(templateId)) { set.status = 400; return { error: "ID inválido" }; }

            const [t] = await sql`SELECT * FROM templates WHERE id = ${templateId}`;
            
            if (!t) { 
                set.status = 404; return { error: 'No encontrada' }; 
            }
            
            // Protección contra datos corruptos en la DB
            if (!t.base_elements) t.base_elements = [];

            return { template: t };
        } catch(e) {
            console.error(`💥 ERROR CARGANDO PLANTILLA ${id}:`, e);
            set.status = 500; return { error: String(e) };
        }
    })

    // --- AUTENTICACIÓN ---
    .group('/auth', app => app
        .post('/register', async ({ body, set }) => {
            const { name, email, password } = body as any;
            
            // MEJORA UX: Convertir a minúsculas y quitar espacios
            const cleanEmail = String(email).toLowerCase().trim();

            try {
                const [existing] = await sql`SELECT id FROM users WHERE email = ${cleanEmail}`;
                if (existing) {
                    set.status = 400; return { error: 'El correo ya existe.' };
                }

                const hashed = await bcrypt.hash(password, 10);
                
                await sql`INSERT INTO users (name, email, password_hash) VALUES (${name}, ${cleanEmail}, ${hashed})`;
                return { success: true };
            } catch (err) { 
                set.status = 500; return { error: `Error registro: ${err}` }; 
            }
        })

        .post('/login', async ({ body, jwt, cookie, set }) => {
            try {
                const { email, password } = body as any;
                
                // MEJORA UX: Normalizamos el input del usuario antes de buscar
                const cleanEmail = String(email).toLowerCase().trim();

                const [user] = await sql`SELECT * FROM users WHERE email = ${cleanEmail}`;
                
                if (!user) {
                    set.status = 401; return { error: 'Usuario no encontrado' };
                }

                const isValid = await bcrypt.compare(password, user.password_hash);
                
                if (!isValid) {
                    set.status = 401; return { error: 'Contraseña incorrecta' };
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
            } catch (err) {
                console.error("Login Error:", err);
                set.status = 500; return { error: `Error login: ${err}` };
            }
        })

        .get('/me', ({ user }) => {
            return { user: user ? { name: (user as any).name, id: (user as any).userId } : null };
        })
        
        .post('/logout', ({ cookie }) => { 
            cookie.auth_token.remove(); 
            return { success: true }; 
        })
    )
    .listen(process.env.PORT || 3000);

console.log(`🚀 Servidor listo en puerto ${process.env.PORT || 3000}`);