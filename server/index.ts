import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import postgres from 'postgres'
import { z } from 'zod'
import { Resend } from 'resend'
import { randomBytes } from 'crypto'

// --- FIX DE ARRANQUE LOCAL ---
// 1. Validamos que las variables de entorno CRÍTICAS existan
if (!process.env.JWT_SECRET) {
    throw new Error("ERROR CRÍTICO: Tu archivo server/.env no tiene la variable JWT_SECRET. El servidor no puede arrancar.");
}

// 2. Validamos de forma NO CRÍTICA la clave de Resend
if (!process.env.RESEND_API_KEY) {
    console.warn("\n**************************************************");
    console.warn("ADVERTENCIA: RESEND_API_KEY no está definida en server/.env.");
    console.warn("El servidor funcionará, pero el envío de correos (como 'olvidé mi contraseña') fallará.");
    console.warn("**************************************************\n");
}

// 3. Inicializamos Resend de forma segura (o un objeto falso si no hay clave)
const resend = process.env.RESEND_API_KEY
    ? new Resend(process.env.RESEND_API_KEY)
    : { emails: { send: async () => { 
        console.error("ERROR: Se intentó enviar un email pero RESEND_API_KEY no está configurada.");
        return { error: { message: "Servicio de email no configurado" } }; 
    }}};
// --- FIN DEL FIX DE ARRANQUE ---


const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:1234@localhost:5432/dua_conecta_db'

// FIX: Desactiva SSL automáticamente si la conexión es a 'localhost'
const isLocalConnection = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');

console.log(`Conectando a PostgreSQL... (SSL ${isLocalConnection ? 'desactivado para local' : 'activado para producción'})`);

// Configuración de la base de datos con el SSL condicional
const sql = postgres(DATABASE_URL, {
  ssl: isLocalConnection ? false : 'require' // SSL solo si NO es local
})

console.log('PostgreSQL conectado y listo.')


const app = new Elysia()
   .use(cors({
        origin: ['http://localhost:5173', 'https://dua-conecta-j1pn.vercel.app'], 
        methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }))
    .use(jwt({ // Configuración JWT
        name: 'jwt',
        secret: process.env.JWT_SECRET
    }))
    .derive(async ({ jwt, headers }) => { // Derivación para verificar token
        const auth = headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) { return { profile: null } }
        const token = auth.substring(7);
        try {
            const profile = await jwt.verify(token);
            return { profile };
        } catch (error) {
            console.warn("Verificación de JWT fallida:", (error as Error).message) // Log si el token es inválido
            return { profile: null }
        }
    })

    // Grupo Auth (público)
    .group('/auth', (app) =>
        app
            .post('/register', async ({ body, set }) => {
                const RegisterSchema = z.object({ name: z.string().min(3), email: z.string().email(), password: z.string().min(8) })
                const validation = RegisterSchema.safeParse(body)
                if (!validation.success) { set.status = 400; return { error: 'Datos inválidos' } }
                const { name, email, password } = validation.data
                try {
                    const hashedPassword = await Bun.password.hash(password)
                    await sql`INSERT INTO users (name, email, password_hash) VALUES (${name}, ${email}, ${hashedPassword})`
                    set.status = 201
                    return { success: true, message: '¡Usuario registrado exitosamente!' }
                } catch (error) {
                    if (error instanceof postgres.PostgresError && error.code === '23505') {
                        set.status = 409
                        return { error: 'El correo electrónico ya está en uso.' }
                    }
                    console.error("Error en /auth/register:", error)
                    set.status = 500; return { error: 'Error interno del servidor.' }
                }
            })
            .post('/login', async ({ jwt, body, set }) => {
                 const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })
                 const validation = LoginSchema.safeParse(body)
                 if (!validation.success) { set.status = 400; return { error: 'Datos de entrada inválidos.' } }
                 const { email, password } = validation.data
                 try {
                     const users = await sql`SELECT id, name, email, password_hash FROM users WHERE email = ${email}`
                     if (users.length === 0) { set.status = 401; return { error: 'Correo o contraseña incorrectos.' } }
                     const user = users[0]
                     const isMatch = await Bun.password.verify(password, user.password_hash)
                     if (!isMatch) { set.status = 401; return { error: 'Correo o contraseña incorrectos.' } }
                     const token = await jwt.sign({ userId: user.id, name: user.name, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) })
                     set.status = 200
                     return { success: true, message: '¡Inicio de sesión exitoso!', token: token, user: { name: user.name, email: user.email } }
                 } catch (error) {
                     console.error("Error en /auth/login:", error)
                     set.status = 500; return { error: 'Error interno del servidor.' }
                 }
            })
            .post('/forgot-password', async ({ body, set }) => {
                const ForgotPasswordSchema = z.object({ email: z.string().email("Correo no válido.") });
                const validation = ForgotPasswordSchema.safeParse(body);
                if (!validation.success) { set.status = 400; return { error: 'Correo no válido.' } }
                const { email } = validation.data;
                try {
                    const users = await sql`SELECT id FROM users WHERE email = ${email}`;
                    if (users.length > 0) {
                        const user = users[0];
                        const token = randomBytes(32).toString('hex');
                        const expiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 min
                        await sql`INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (${user.id}, ${token}, ${expiresAt})`
                        const resetLink = `http://localhost:5173/reset-password?token=${token}`;
                        
                        // Intenta enviar el email
                        const { error } = await resend.emails.send({
                            from: 'onboarding@resend.dev', to: email,
                            subject: 'Recuperación de Contraseña - DUA-Conecta',
                            html: `<p>Haz clic <a href="${resetLink}">aquí</a> para resetear. Expira en 15 min.</p>`
                        });

                        if(error) {
                            console.error("Error al enviar email de reseteo:", error.message);
                            // No le decimos al usuario que falló, por seguridad.
                        }
                    }
                    set.status = 200; return { success: true, message: 'Si el correo existe, recibirás un enlace.' };
                } catch (error) {
                    console.error("Error en /auth/forgot-password:", error);
                    set.status = 500; return { error: 'Error interno al procesar la solicitud.' };
                }
            })
            .post('/reset-password', async ({ body, set }) => {
                 const ResetPasswordSchema = z.object({ token: z.string().min(1), password: z.string().min(8) });
                 const validation = ResetPasswordSchema.safeParse(body);
                 if (!validation.success) { set.status = 400; return { error: 'Datos inválidos.' } }
                 const { token, password } = validation.data;
                 try {
                     const tokens = await sql`SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ${token}`;
                     if (tokens.length === 0) { set.status = 400; return { error: 'Token inválido.' } }
                     const resetRequest = tokens[0];
                     if (new Date() > resetRequest.expires_at) {
                         await sql`DELETE FROM password_reset_tokens WHERE token = ${token}`;
                         set.status = 400; return { error: 'Token expirado.' };
                     }
                     const newHashedPassword = await Bun.password.hash(password);
                     await sql`UPDATE users SET password_hash = ${newHashedPassword} WHERE id = ${resetRequest.user_id}`;
                     await sql`DELETE FROM password_reset_tokens WHERE token = ${token}`;
                     set.status = 200; return { success: true, message: 'Contraseña actualizada.' };
                 } catch (error) {
                     console.error("Error en /auth/reset-password:", error);
                     set.status = 500; return { error: 'Error interno del servidor.' }
                 }
            })
    )

    // Grupo API (protegido)
    .group('/api', (app) => app
        .onBeforeHandle(({ profile, set }) => { // Guardia de seguridad
            if (!profile) {
                set.status = 401;
                return { error: 'No autorizado' };
            }
        })
        .post('/user/change-password', async ({ profile, body, set }) => {
            const userId = (profile as any).userId;
            const ChangePasswordSchema = z.object({ currentPassword: z.string(), newPassword: z.string().min(8) });
            const validation = ChangePasswordSchema.safeParse(body);
            if (!validation.success) { set.status = 400; return { error: 'Datos inválidos.' } }
            const { currentPassword, newPassword } = validation.data;
            try {
                const users = await sql`SELECT password_hash FROM users WHERE id = ${userId}`;
                if (users.length === 0) { set.status = 404; return { error: 'Usuario no encontrado.' } }
                const user = users[0];
                const isMatch = await Bun.password.verify(currentPassword, user.password_hash);
                if (!isMatch) { set.status = 401; return { error: 'La contraseña actual es incorrecta.' } }
                const newHashedPassword = await Bun.password.hash(newPassword);
                await sql`UPDATE users SET password_hash = ${newHashedPassword} WHERE id = ${userId}`;
                set.status = 200; return { success: true, message: 'Contraseña actualizada.' };
            } catch (error) {
                console.error("Error en /api/user/change-password:", error);
                set.status = 500; return { error: 'Error interno del servidor.' };
            }
        })
        // --- RUTA PARA CREAR/GUARDAR NUEVA ACTIVIDAD ---
        .post('/activities/save', async ({ profile, body, set }) => {
            const userId = (profile as any).userId;
            const ActivitySchema = z.object({
                name: z.string().min(1, "El nombre de la actividad es requerido."),
                templateId: z.string().min(1),
                elements: z.array(z.any()), 
            });

            const validation = ActivitySchema.safeParse(body);
            if (!validation.success) { 
                set.status = 400; 
                return { error: 'Datos de actividad inválidos.', details: validation.error.issues }; 
            }
            
            const { name, templateId, elements } = validation.data;
            
            try {
                // Insertamos y retornamos el ID de la nueva actividad
                const [newActivity] = await sql`
                    INSERT INTO saved_activities (user_id, name, template_id, elements)
                    VALUES (${userId}, ${name}, ${templateId}, ${elements})
                    RETURNING id
                `;
                
                set.status = 201; 
                return { success: true, message: '¡Actividad guardada con éxito!', activityId: newActivity.id };
            } catch (error) {
                console.error("Error al guardar actividad:", error);
                set.status = 500; 
                return { error: 'Error interno del servidor al guardar la actividad.' };
            }
        })
        // --- RUTA PARA OBTENER ACTIVIDADES GUARDADAS (LISTA) ---
        .get('/activities', async ({ profile, set }) => {
            const userId = (profile as any).userId;
            try {
                const activities = await sql`
                    SELECT id, name, template_id, created_at, updated_at
                    FROM saved_activities
                    WHERE user_id = ${userId}
                    ORDER BY updated_at DESC
                `;
                set.status = 200;
                return { success: true, activities };
            } catch (error) {
                console.error("Error al obtener actividades:", error);
                set.status = 500;
                return { error: 'Error interno del servidor al obtener actividades.' };
            }
        })
        // --- RUTA PARA OBTENER UNA SOLA ACTIVIDAD (PARA EDICIÓN) ---
        .get('/activities/:id', async ({ profile, params, set }) => {
            const userId = (profile as any).userId;
            const activityId = parseInt(params.id);
            if (isNaN(activityId)) { set.status = 400; return { error: 'ID de actividad inválido.' } }

            try {
                const [activity] = await sql`
                    SELECT id, name, template_id, elements
                    FROM saved_activities
                    WHERE id = ${activityId} AND user_id = ${userId}
                `;
                
                if (!activity) { set.status = 404; return { error: 'Actividad no encontrada o no pertenece al usuario.' } }

                set.status = 200;
                // Devolvemos el objeto activity que incluye el array 'elements' (JSONB)
                return { success: true, activity }; 
            } catch (error) {
                console.error("Error al obtener actividad para edición:", error);
                set.status = 500;
                return { error: 'Error interno del servidor al cargar la actividad.' };
            }
        })
        // --- RUTA PARA ACTUALIZAR UNA SOLA ACTIVIDAD ---
        .put('/activities/:id', async ({ profile, params, body, set }) => {
            const userId = (profile as any).userId;
            const activityId = parseInt(params.id);
            if (isNaN(activityId)) { set.status = 400; return { error: 'ID de actividad inválido.' } }
            
            const UpdateSchema = z.object({
                name: z.string().min(1, "El nombre es requerido."),
                templateId: z.string().min(1),
                elements: z.array(z.any()), 
            });
            const validation = UpdateSchema.safeParse(body);
            if (!validation.success) { set.status = 400; return { error: 'Datos de actividad inválidos.' } }
            const { name, elements, templateId } = validation.data;

            try {
                const [updatedActivity] = await sql`
                    UPDATE saved_activities
                    SET name = ${name}, 
                        elements = ${elements},
                        template_id = ${templateId},
                        updated_at = NOW()
                    WHERE id = ${activityId} AND user_id = ${userId}
                    RETURNING id
                `;

                if (!updatedActivity) { set.status = 404; return { error: 'Actividad no encontrada para actualizar.' } }

                set.status = 200;
                return { success: true, message: 'Actividad actualizada con éxito.' };
            } catch (error) {
                console.error("Error al actualizar actividad:", error);
                set.status = 500;
                return { error: 'Error interno del servidor al actualizar la actividad.' };
            }
        })
    )

    .get('/', () => '¡El servidor de DUA-Conecta está funcionando! 👋')
    .listen(process.env.PORT || 3000);

console.log(`🦊 Servidor Elysia corriendo en http://${app.server?.hostname}:${app.server?.port}`);