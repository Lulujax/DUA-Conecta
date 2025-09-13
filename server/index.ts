import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { env } from '@yolk-oss/elysia-env'
import postgres from 'postgres'
import { z } from 'zod'

const sql = postgres('postgres://postgres:1234@localhost:5432/dua_conecta_db')

console.log('PostgreSQL conectado y listo para recibir peticiones.')

const app = new Elysia()
    .use(cors({
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }))
    .use(env({
        JWT_SECRET: t.String()
    }))
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!
    }))
    .derive(async ({ jwt, headers }) => {
        const auth = headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) {
            return { profile: null }
        }
        const token = auth.substring(7);
        const profile = await jwt.verify(token);
        return { profile };
    })
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
                    console.error("Error en el registro:", error)
                    set.status = 500
                    return { error: 'Ocurrió un error en el servidor al registrar.' }
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
                    console.error("Error en el inicio de sesión:", error)
                    set.status = 500
                    return { error: 'Ocurrió un error en el servidor al iniciar sesión.' }
                }
            })
    )
    .group('/api', (app) =>
        app
            .onBeforeHandle(({ profile, set }) => {
                if (!profile) {
                    set.status = 401;
                    return { error: 'No autorizado' };
                }
            })
            .post('/user/change-password', async ({ profile, body, set }) => {
                // @ts-ignore
                const userId = profile.userId;

                const ChangePasswordSchema = z.object({ currentPassword: z.string(), newPassword: z.string().min(8) });
                const validation = ChangePasswordSchema.safeParse(body);
                if (!validation.success) { set.status = 400; return { error: 'Datos inválidos.' } }
                
                const { currentPassword, newPassword } = validation.data;

                try {
                    // --- LOGS DE DEPURACIÓN ---
                    console.log(`--- Depurando Cambio de Contraseña para Usuario ID: ${userId} ---`);
                    console.log(`Contraseña actual recibida: "${currentPassword}"`);

                    const users = await sql`SELECT password_hash FROM users WHERE id = ${userId}`;
                    if (users.length === 0) { set.status = 404; return { error: 'Usuario no encontrado.' } }

                    const user = users[0];
                    console.log(`Hash guardado en la BD: "${user.password_hash}"`);

                    const isMatch = await Bun.password.verify(currentPassword, user.password_hash);
                    console.log(`¿Las contraseñas coinciden?: ${isMatch}`); // Esto nos dirá si la verificación es exitosa

                    if (!isMatch) {
                        set.status = 401;
                        return { error: 'La contraseña actual es incorrecta.' }
                    }

                    const newHashedPassword = await Bun.password.hash(newPassword);
                    await sql`UPDATE users SET password_hash = ${newHashedPassword} WHERE id = ${userId}`;

                    console.log(`Usuario [${userId}] cambió la contraseña con éxito.`);
                    set.status = 200;
                    return { success: true, message: 'Contraseña actualizada con éxito.' };

                } catch (error) {
                    console.error("Error al cambiar contraseña:", error);
                    set.status = 500;
                    return { error: 'Ocurrió un error en el servidor.' };
                }
            })
    )
    .get('/', () => '¡El servidor de DUA-Conecta está funcionando! 👋')
    .listen(3000)

console.log(`🦊 Servidor Elysia corriendo en http://${app.server?.hostname}:${app.server?.port}`)