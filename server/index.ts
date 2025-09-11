import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import postgres from 'postgres';
import { z } from 'zod';

// --- 1. CONFIGURACIÓN DE LA BASE DE DATOS ---
const sql = postgres('postgres://postgres:tu_contraseña@localhost:5432/dua_conecta_db', {
  // Opciones de conexión
});

console.log('Conectado a la base de datos PostgreSQL.');

// --- 2. DEFINICIÓN DE ESQUEMAS DE VALIDACIÓN CON ZOD ---
const RegisterSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  email: z.string().email("El correo electrónico no es válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

// NUEVO: Esquema para la validación del login
const LoginSchema = z.object({
  email: z.string().email("El correo electrónico no es válido."),
  password: z.string().min(1, "La contraseña es requerida."),
});

const app = new Elysia()
  .use(cors())
  
  // --- 3. GRUPO DE RUTAS PARA AUTENTICACIÓN ---
  .group('/auth', (app) => 
    app
      // --- ENDPOINT PARA EL REGISTRO DE USUARIOS ---
      .post('/register', async ({ body, set }) => {
        const validation = RegisterSchema.safeParse(body);
        if (!validation.success) {
          set.status = 400;
          return { error: 'Datos inválidos', details: validation.error.flatten().fieldErrors };
        }
        
        const { name, email, password } = validation.data;

        try {
          const hashedPassword = await Bun.password.hash(password);
          await sql`
            INSERT INTO users (name, email, password_hash)
            VALUES (${name}, ${email}, ${hashedPassword})
          `;
          
          console.log(`Usuario registrado exitosamente: ${email}`);
          set.status = 201;
          return { success: true, message: '¡Usuario registrado exitosamente!' };

        } catch (error) {
          if (error instanceof postgres.PostgresError && error.code === '23505') {
            set.status = 409;
            return { error: 'El correo electrónico ya está en uso.' };
          }
          console.error("Error en el registro:", error);
          set.status = 500;
          return { error: 'Ocurrió un error en el servidor.' };
        }
      })

      // --- NUEVO: ENDPOINT PARA EL LOGIN DE USUARIOS ---
      .post('/login', async ({ body, set }) => {
        // a. Validar los datos de entrada
        const validation = LoginSchema.safeParse(body);
        if (!validation.success) {
            set.status = 400; // Bad Request
            return { error: "Datos de entrada inválidos." };
        }

        const { email, password } = validation.data;

        try {
            // b. Buscar al usuario por su correo electrónico en la base de datos
            const users = await sql`
                SELECT id, name, password_hash FROM users WHERE email = ${email}
            `;

            // c. Si no se encuentra ningún usuario, las credenciales son incorrectas
            if (users.length === 0) {
                set.status = 401; // Unauthorized
                return { error: "Correo o contraseña incorrectos." };
            }

            const user = users[0];

            // d. Verificar que la contraseña enviada coincida con la encriptada en la BD
            const isMatch = await Bun.password.verify(password, user.password_hash);

            if (!isMatch) {
                set.status = 401; // Unauthorized
                return { error: "Correo o contraseña incorrectos." };
            }

            // e. Si todo coincide, el inicio de sesión es exitoso
            // NOTA: Más adelante, aquí generaremos un token de sesión (JWT) para mantener al usuario conectado.
            console.log(`Inicio de sesión exitoso para: ${email}`);
            set.status = 200; // OK
            return { 
                success: true, 
                message: '¡Inicio de sesión exitoso!', 
                user: { id: user.id, name: user.name } 
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

console.log(
  `🦊 Servidor Elysia corriendo en http://${app.server?.hostname}:${app.server?.port}`
);