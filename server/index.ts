import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors'; // <-- 1. IMPORTA EL PLUGIN

const app = new Elysia()
  .use(cors()) // <-- 2. DILE A ELYSIA QUE LO USE
  .get('/', () => '¡Hola desde el servidor! 👋')
  .listen(3000);

console.log(
  `🦊 Servidor Elysia corriendo en http://${app.server?.hostname}:${app.server?.port}`
);