import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { jwt } from '@elysiajs/jwt';
import { env } from 'elysia-env';
import postgres from 'postgres';
import { z } from 'zod';

const app = new Elysia()
  .use(env({ JWT_SECRET: t.String() }))
  
  // --- CORRECCIÓN CLAVE: CONFIGURACIÓN DE CORS MÁS ROBUSTA ---
  // Esta configuración le dice explícitamente al servidor que acepte peticiones
  // desde tu aplicación de SvelteKit.
  .use(cors({
    origin: 'http://localhost:5173', // Permite peticiones desde el frontend
    methods: ['GET', 'POST'],          // Permite los métodos que usamos
    allowedHeaders: ['Content-Type']   // Permite la cabecera 'Content-Type' para JSON
  }))

  .use(jwt({
    name: 'jwt',
    secret: (app) => app.env.JWT_SECRET,
  }))
  
  .group('/auth', (app) => 
    app
      .post('/register', async ({ body, set }) => {
        const RegisterSchema = z.object({ name: z.string().min(3), email: z.string().email(), password: z.string().min(8) });
        const validation = RegisterSchema.safeParse(body);
        if (!validation.success) {
          set.status = 400;
          return { error: 'Datos inválidos', details: validation.error.flatten().fieldErrors };
        }
        
        const { name, email, password } = validation.data;

        try {
          const sql = postgres('postgres://postgres:tu_contraseña@localhost:5432/dua_conecta_db');
          const hashedPassword = await Bun.password.hash(password);
          await sql`
            INSERT INTO users (name, email, password_hash)
            VALUES (${name}, ${email}, ${hashedPassword})
          `;
          
          set.status = 201;
          return { success: true, message: '¡Usuario registrado exitosamente!' };

        } catch (error) {
          const sql = postgres();
          if (error instanceof sql.PostgresError && error.code === '23505') {
            set.status = 409;
            return { error: 'El correo electrónico ya está en uso.' };
          }
          console.error("Error en el registro:", error);
          set.status = 500;
          return { error: 'Ocurrió un error en el servidor.' };
        }
      })

      .post('/login', async ({ jwt, body, set }) => {
        const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
        const validation = LoginSchema.safeParse(body);
        if (!validation.success) {
            set.status = 400;
            return { error: "Datos de entrada inválidos." };
        }

        const { email, password } = validation.data;

        try {
            const sql = postgres('postgres://postgres:tu_contraseña@localhost:5432/dua_conecta_db');
            const users = await sql`
                SELECT id, name, email, password_hash FROM users WHERE email = ${email}
            `;

            if (users.length === 0) {
                set.status = 401;
                return { error: "Correo o contraseña incorrectos." };
            }

            const user = users[0];
            const isMatch = await Bun.password.verify(password, user.password_hash);

            if (!isMatch) {
                set.status = 401;
                return { error: "Correo o contraseña incorrectos." };
            }

            const token = await jwt.sign({
              userId: user.id,
              name: user.name,
              exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7),
            });

            set.status = 200;
            return { 
                success: true, 
                message: '¡Inicio de sesión exitoso!',
                token: token,
                user: { name: user.name, email: user.email }
            };

        } catch (error) {
            console.error("Error en el inicio de sesión:", error);
            set.status = 500;
            return { error: "Ocurrió un error en el servidor." };
        }
      })
  )
  
  .get('/', () => '¡El servidor de DUA-Conecta está funcionando! 👋')
  .listen(3000);

console.log(`🦊 Servidor Elysia corriendo en http://${app.server?.hostname}:${app.server?.port}`);