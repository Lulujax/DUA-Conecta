import { Elysia } from 'elysia';

// 1. Creamos una nueva aplicación de servidor con Elysia.
const app = new Elysia()
  // 2. Le decimos qué hacer cuando alguien visite la página principal.
  .get('/', () => '¡Hola desde el servidor! 👋')
  // 3. Le decimos que se ponga a escuchar en el "puerto" 3000.
  .listen(3000);

// 4. Mostramos un mensaje en nuestra terminal para saber que ya está funcionando.
console.log(
  `🦊 Servidor Elysia corriendo en http://${app.server?.hostname}:${app.server?.port}`
);

// bun run --watch index.ts