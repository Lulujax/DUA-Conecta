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
| **Backend (API)** | **Bun + ElysiaJS** | Servidor ligero, de alto rendimiento con TypeScript. |
| **Base de Datos** | **PostgreSQL** | Almacenamiento seguro y robusto de actividades y plantillas. |
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

1.  **Instalar dependencias:**

    ```bash
    bun install
    ```

2.  **Inicializar la base de datos (con datos de ejemplo):**
    *Asegúrate de que tu DB esté corriendo y la `DATABASE_URL` sea correcta.*

    ```bash
    bun run server/seed.ts
    ```

3.  **Ejecutar el servidor (API y Auth):**

    ```bash
    bun run server/index.ts --watch 
    ```

4.  **Ejecutar el Frontend (SvelteKit):**

    ```bash
    cd client
    bun run dev
    ```

El frontend estará disponible en `http://localhost:5173/` y el backend en el puerto configurado (ej. `http://localhost:3000`).

-----

## 🚀 Despliegue en Producción (Vercel + Render)

### Backend en Render

1. Crea un nuevo **Web Service** en [Render](https://render.com) apuntando al repo.
2. Configura:
   - **Root Directory:** `server`
   - **Build Command:** `npm install` (o `bun install`)
   - **Start Command:** `node --experimental-strip-types index.ts` (o `bun run index.ts`)
3. Añade las siguientes **Environment Variables** en Render:

| Variable | Descripción |
| :--- | :--- |
| `DATABASE_URL` | URL de conexión a Supabase/PostgreSQL |
| `JWT_SECRET` | Secreto largo y aleatorio para JWT |
| `FRONTEND_URL` | URL pública del frontend en Vercel (ej. `https://tu-app.vercel.app`) |
| `PIXABAY_API_KEY` | API Key de Pixabay (opcional) |
| `RESEND_API_KEY` | API Key de Resend para emails (opcional) |

> `FRONTEND_URL` es la clave para que el CORS permita peticiones desde Vercel.

### Frontend en Vercel

1. Importa el proyecto en [Vercel](https://vercel.com) y configura:
   - **Root Directory:** `client`
   - **Framework Preset:** SvelteKit
2. Añade las siguientes **Environment Variables** en Vercel:

| Variable | Valor |
| :--- | :--- |
| `PUBLIC_API_URL` | URL pública de tu backend en Render (ej. `https://dua-conecta-backend.onrender.com`) |
| `VITE_API_URL` | La misma URL que `PUBLIC_API_URL` |

> ⚠️ **Importante:** Ambas variables deben apuntar al mismo backend. `PUBLIC_API_URL` es necesario para las funciones de carga SSR de SvelteKit y `VITE_API_URL` sirve como fallback. Si sólo configuras una, algunas partes del frontend podrían seguir usando una URL antigua.

3. Redespliega el proyecto para que tome las nuevas variables.