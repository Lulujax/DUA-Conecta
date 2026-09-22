# 🧑‍🏫 DUA-CONECTA: Recurso Digital para la Inclusión Educativa 🚀

> Una plataforma web que traduce los principios del **Diseño Universal para el Aprendizaje (DUA)** en actividades imprimibles, personalizadas y listas para el aula.

-----

## 🌟 Introducción y Propósito

**DUA-Conecta** surge como una solución tecnológica directa a uno de los desafíos más persistentes en la educación: la falta de herramientas sistemáticas y personalizadas para la **atención de estudiantes con Necesidades Educativas Especiales (NEE)**.

[cite\_start]El proyecto aborda la brecha operativa donde el profesorado carece de recursos ágiles para implementar adaptaciones curriculares, generando una sobrecarga en los departamentos de orientación[cite: 773, 774]. Nuestro objetivo es **empoderar a los docentes** para que creen material didáctico significativo y altamente motivador en minutos.

## 💡 Fundamento Científico y Pedagógico

[cite\_start]Este recurso digital está cimentado en la investigación titulada **"Diseño Universal para el Aprendizaje: Recurso Digital para la Atención de Estudiantes con Necesidades Educativas Especiales en el Liceo de Tecnología Industrial"**[cite: 726, 742], una tesis de grado que validó la necesidad de una herramienta de este tipo.

El diseño se basa en tres pilares teóricos fundamentales:

1.  [cite\_start]**Diseño Universal para el Aprendizaje (DUA):** Se garantiza que la información se ofrece mediante **múltiples formatos de Representación** (ej. pictogramas, guías visuales) y que el estudiante puede demostrar su aprendizaje a través de múltiples medios de **Acción y Expresión**[cite: 788, 1082].
2.  [cite\_start]**Teoría Cognitivo-Conductual (TCC):** Implementación de estrategias de **Autorregulación** y **Autoinstrucciones** (modelo de Meichenbaum) para ayudar a los estudiantes a gestionar la impulsividad y a abordar tareas académicas complejas paso a paso[cite: 892, 901, 1083].
3.  [cite\_start]**Teoría Conductista (B.F. Skinner):** Uso de la **Economía de Fichas** y el **Reforzamiento Positivo** para el manejo conductual y la promoción de habilidades adaptativas y sociales de forma sistemática[cite: 911, 913, 1084].

## ✨ Características Principales

  * **Editor Visual:** Interfaz intuitiva (*Drag-and-Drop*) en Svelte para personalizar plantillas prediseñadas.
  * **Generación de PDF de Alta Calidad:** Exporta materiales listos para imprimir y usar en el aula mediante `html2canvas` y `jspdf`.
  * **Banco de Plantillas:** Recursos enfocados en Conducta, Matemáticas, Lectoescritura, y Habilidades Socioemocionales.

-----

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Frontend (UI)** | **SvelteKit + Svelte 5** | Interfaz de usuario reactiva y rápida. |
| **Backend (API)** | **Express 5 + postgres.js** | API REST con TypeScript ejecutada con Bun. |
| **Base de Datos** | **PostgreSQL** | Almacenamiento seguro y robusto de actividades y plantillas. |
| **PDF / Emails** | **html2canvas + jsPDF / nodemailer (SMTP)** | Export a PDF listo para imprimir y recuperación de contraseña. |
| **Dev Tools** | **Bun Runtime** | Entorno de ejecución y gestor de paquetes unificado. |

## ✍️ Creadores

Este proyecto fue conceptualizado, fundamentado y desarrollado por:

  * **Fundamento Pedagógico & Tesis (DUA):** Nohemy Carreo (Terapista Psicosocial)
  * **Desarrollo Full-Stack & Ingeniería:** Luis Peña (Desarrollador de Software)

-----

## 💻 Puesta en Marcha (Para Desarrolladores)

El proyecto utiliza una arquitectura monolítica con **Bun** como gestor de paquetes y runtime.

### 1\. Requisitos

  * [Bun](https://bun.sh/) (v1.x o superior)
  * PostgreSQL (instancia local o remota)

### 2\. Configuración del Entorno (`.env`)

Copia los archivos de ejemplo y rellena tus valores:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`** (variables mínimas para desarrollo):

```env
DATABASE_URL="postgres://usuario:contraseña@host:puerto/nombre_db"
JWT_SECRET="TuSecretoMuyLargoYSeguro"
# En desarrollo, FRONTEND_URL se puede omitir (usa localhost:5173 por defecto)
```

**`client/.env`** (variables mínimas para desarrollo):

```env
# En desarrollo local, puedes usar localhost o dejarlo sin definir
VITE_API_URL=http://localhost:3000
```

> Consulta `server/.env.example` y `client/.env.example` para la lista completa de variables.

### 3\. Instalación e Inicialización

Ejecuta estos comandos desde la carpeta raíz del proyecto (`dua-conecta/`):

1.  **Instalar dependencias** (hay un `package.json` por carpeta):

    ```bash
    bun install                    # raíz (solo deps de PDF)
    cd client && bun install
    cd ../server && bun install
    ```

2.  **Inicializar la base de datos (con datos de ejemplo):**
    *Asegúrate de que tu DB esté corriendo y la `DATABASE_URL` sea correcta.* El seed lee `server/.env` desde el directorio de trabajo, así que se ejecuta desde `server/`:

    ```bash
    cd server
    bun run seed.ts
    ```

3.  **Ejecutar el servidor (API y Auth):** *también desde `server/`, porque Bun carga el `.env` desde el directorio de trabajo.*

    ```bash
    cd server
    bun run --watch index.ts
    ```

4.  **Ejecutar el Frontend (SvelteKit):**

    ```bash
    cd client
    bun run dev
    ```

> **Nota:** el servidor **no arranca** sin una `JWT_SECRET` válida en `server/.env` (mínimo 20 caracteres; nunca uses el valor por defecto).

El frontend estará disponible en `http://localhost:5173/` y el backend en el puerto configurado (ej. `http://localhost:3000`).

-----

## 🚀 Despliegue en Producción (Vercel + Render)

La infraestructura de despliegue ya está versionada en el repo:

- `server/Dockerfile` + `server/render.yaml` → backend en Render (imagen `oven/bun:1`, health check `/health`).
- `client/vercel.json` → frontend en Vercel (preset SvelteKit; el build usa npm, `package-lock.json`).
- El cliente usa `@sveltejs/adapter-auto`, que en el build de Vercel instala automáticamente `adapter-vercel`.

### Backend en Render

1. Sube los cambios a GitHub.
2. En [Render](https://render.com): **New + → Blueprint**. Apunta al repo `Lulujax/DUA-Conecta` y al archivo `server/render.yaml`. Render preguntará por los secretos (`sync: false`) del grupo `dua-conecta-api-env`:

| Variable | Descripción |
| :--- | :--- |
| `DATABASE_URL` | URL de conexión a PostgreSQL (Supabase u otro host) |
| `JWT_SECRET` | Secreto JWT ≥ 20 caracteres (obligatorio; el server no arranca sin él) |
| `FRONTEND_URL` | URL pública del frontend en Vercel (ej. `https://dua-conecta.vercel.app`) — clave para CORS y enlaces de recuperación |
| `PIXABAY_API_KEY` | API Key de Pixabay (opcional, ≥ 10 caracteres) |
| `PEXELS_API_KEY` | API Key de Pexels (opcional) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | SMTP para "recuperar contraseña" (ej. Gmail con contraseña de aplicación) |

3. Tras el primer despliegue, **siembra las plantillas** en la DB de producción desde la pestaña **Shell** del servicio: `bun run seed.ts`.

### Frontend en Vercel

1. Importa el repo `Lulujax/DUA-Conecta` en [Vercel](https://vercel.com).
2. Root Directory: `client` · Framework Preset: SvelteKit (`vercel.json`).
3. Añade las **Environment Variables** (ambas obligatorias):

| Variable | Valor |
| :--- | :--- |
| `VITE_API_URL` | URL pública del backend en Render (ej. `https://dua-conecta-api.onrender.com`) |
| `PUBLIC_API_URL` | La misma URL del backend |

> `PUBLIC_API_URL` se usa en el loader de `/dashboard/plantillas` vía `$env/static/public`; sin ella el build falla.