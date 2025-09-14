import { Elysia, t } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { env } from '@yolk-oss/elysia-env'
import postgres from 'postgres'
import { z } from 'zod'

// --- 1. CONFIGURACIÓN ÚNICA Y CENTRAL DE LA BASE DE DATOS ---
const sql = postgres('postgres://postgres:1234@localhost:5432/dua_conecta_db')

console.log('PostgreSQL conectado y listo para recibir peticiones.')

const app = new Elysia()
    // --- 2. CORRECCIÓN DEFINITIVA DE CORS ---
    // Colocamos .use(cors()) al principio. Para el desarrollo local, esta configuración 
    // simple es la más robusta, ya que permite el acceso desde cualquier origen.
    .use(cors())
    .use(env({
        JWT_SECRET: t.String()
    }))
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET!
    }))
    .derive(async ({ jwt, headers }) => {
        const auth = headers.authorization;
        if (!auth || !auth.startsWith('Bearer ')) { return { profile: null } }
        const token = auth.substring(7);
        const profile = await jwt.verify(token);
        return { profile };
    })

    // --- GRUPO DE RUTAS PARA AUTENTICACIÓN ---
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
            .post('/forgot-password', async ({ body, set }) => {
                // Lógica de forgot-password...
            })
    )
    .get('/', () => '¡El servidor de DUA-Conecta está funcionando! 👋')
    .listen(3000)

console.log(`🦊 Servidor Elysia corriendo en http://${app.server?.hostname}:${app.server?.port}`)