import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'

const isProduction = process.env.NODE_ENV === 'production';
const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false }, prepare: false });

// --- MIGRACIÓN A PRUEBA DE BALAS ---
(async () => {
    try {
        console.log("🛠️ Verificando integridad de la Base de Datos...");
        
        // 1. Crear tablas base si no existen
        await sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())`;
        await sql`CREATE TABLE IF NOT EXISTS templates (id SERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT, thumbnail_url TEXT, description TEXT, base_elements JSONB DEFAULT '[]', created_at TIMESTAMP DEFAULT NOW())`;
        await sql`CREATE TABLE IF NOT EXISTS activities (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())`;

        // 2. FORZAR COLUMNAS FALTANTES (Esto arregla el error 500 si la tabla ya existía vieja)
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS template_id INTEGER`;
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS elements JSONB DEFAULT '[]'`;
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS preview_img TEXT`;
        await sql`ALTER TABLE activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`;

        console.log("✅ Base de datos actualizada y lista.");
    } catch (err) { 
        console.error("⚠️ Error en migración:", err); 
    }
})();

const app = new Elysia()
    .onError(({ code, error }) => {
        console.error(`💥 ERROR SERVER (${code}):`, error);
        return { error: error.toString() };
    })
   .use(cors({ origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: true }))
    .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'secret' }))
    .derive(async ({ jwt, cookie }) => {
        const token = cookie.auth_token?.value;
        if (!token) return { user: null };
        try { const p = await jwt.verify(token); return { user: p || null }; } catch { return { user: null }; }
    })

    // --- RUTAS DE ACTIVIDADES ---
    .group('/api/activities', app => app
        .get('/', async ({ user, set }) => {
            if (!user) { set.status = 401; return { error: 'No autorizado' }; }
            try {
                // Obtenemos las actividades. Si falla, devolvemos array vacío.
                const activities = await sql`SELECT * FROM activities WHERE user_id = ${(user as any).userId} ORDER BY updated_at DESC`;
                return { activities };
            } catch (e) { 
                console.error("Error al listar:", e);
                return { activities: [] }; 
            }
        })

        .post('/save', async ({ body, user, set }) => {
            if (!user) { set.status = 401; return { error: 'Debes iniciar sesión' }; }
            
            // Log para que veas qué llega
            console.log("📝 Guardando actividad:", body);

            const { name, templateId, elements, previewImg } = body as any;

            try {
                // Limpieza de datos crítica
                let tId = parseInt(templateId);
                if (isNaN(tId)) tId = null; // Si no es número, enviamos NULL (evita crash)
                
                const safeElements = JSON.stringify(elements || []);

                const [newActivity] = await sql`
                    INSERT INTO activities (user_id, template_id, name, elements, preview_img)
                    VALUES (${(user as any).userId}, ${tId}, ${name}, ${safeElements}::jsonb, ${previewImg})
                    RETURNING id
                `;
                return { success: true, activityId: newActivity.id, message: "¡Guardado exitoso!" };
            } catch (e) {
                console.error("❌ Error CRÍTICO al guardar:", e);
                set.status = 500; return { error: "Error de base de datos. Revisa la consola del servidor." };
            }
        })

        .put('/:id', async ({ params: { id }, body, user, set }) => {
            if (!user) { set.status = 401; return { error: 'No autorizado' }; }
            const { name, elements, previewImg } = body as any;
            try {
                const safeElements = JSON.stringify(elements || []);
                const [updated] = await sql`
                    UPDATE activities 
                    SET name = ${name}, elements = ${safeElements}::jsonb, preview_img = ${previewImg}, updated_at = NOW()
                    WHERE id = ${id} AND user_id = ${(user as any).userId}
                    RETURNING id
                `;
                if (!updated) { set.status = 404; return { error: "No encontrada" }; }
                return { success: true };
            } catch (e) {
                set.status = 500; return { error: String(e) };
            }
        })

        .get('/:id', async ({ params: { id }, user, set }) => {
            if (!user) { set.status = 401; return { error: 'No autorizado' }; }
            const [act] = await sql`SELECT * FROM activities WHERE id = ${id} AND user_id = ${(user as any).userId}`;
            return { activity: act || null };
        })

        .delete('/:id', async ({ params: { id }, user }) => {
            if (!user) return { error: 'No' };
            await sql`DELETE FROM activities WHERE id = ${id} AND user_id = ${(user as any).userId}`;
            return { success: true };
        })
    )
    
    // --- AUTH & TEMPLATES ---
    .get('/templates', async () => {
        try { return { templates: await sql`SELECT * FROM templates ORDER BY id ASC` }; } catch { return { templates: [] }; }
    })
    .get('/templates/:id', async ({ params: { id }, set }) => {
        const tId = parseInt(id);
        if(isNaN(tId)) return { template: null };
        const [t] = await sql`SELECT * FROM templates WHERE id = ${tId}`;
        return { template: t || null };
    })
    .group('/auth', app => app
        .post('/login', async ({ body, jwt, cookie, set }) => {
            const { email, password } = body as any;
            const [u] = await sql`SELECT * FROM users WHERE email = ${String(email).toLowerCase().trim()}`;
            if (!u || !(await bcrypt.compare(password, u.password_hash))) { set.status = 401; return { error: 'Credenciales inválidas' }; }
            cookie.auth_token.set({ value: await jwt.sign({ userId: u.id, name: u.name }), httpOnly: true, path: '/' });
            return { success: true, user: { name: u.name } };
        })
        .post('/register', async ({ body }) => {
            const { name, email, password } = body as any;
            const hashed = await bcrypt.hash(password, 10);
            await sql`INSERT INTO users (name, email, password_hash) VALUES (${name}, ${String(email).toLowerCase().trim()}, ${hashed})`;
            return { success: true };
        })
        .get('/me', ({ user }) => ({ user }))
        .post('/logout', ({ cookie }) => { cookie.auth_token.remove(); return { success: true }; })
    )
    .listen(process.env.PORT || 3000);

console.log(`🚀 Servidor listo en http://localhost:${process.env.PORT || 3000}`);