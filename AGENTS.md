# AGENTS.md

Spanish-language app (DUA-Conecta, printable classroom activities editor). Two independent packages, **not** a workspaces monorepo — install separately.

## Layout
- Monorepo with two independent packages, **not** a workspaces monorepo — install separately.
- `client/` — SvelteKit 2 + Svelte 5, editor de canvas propio (DOM/CSS, **sin fabric.js** — quitado).
- `server/` — Express 5 + postgres.js (tagged-template SQL) + JWT + nodemailer.
- Root `package.json` only pins `html2canvas`/`jspdf` (duplicated in `client/`); ignore it.
- No tests, no lint, no CI. The only verification available is `bun run check` in `client/` (svelte-check via `jsconfig.json`).

## Commands (Bun is the package manager/runtime)
- Server (dev): from `server/` run `bun run --watch index.ts`. **It must be started from `server/`, never the repo root** — Bun loads `.env` from the cwd, so a root run fails with `DATABASE_URL no está definida`. Port 3000 unless `PORT` is set.
- Client dev: `cd client && bun run dev` → http://localhost:5173
- Typecheck client: `cd client && bun run check`
- Seed templates: `cd server && bun run seed.ts` (seed reads `.env` from its cwd; needs a reachable `DATABASE_URL`).

## Backend gotchas
- **The only backend entrypoint is `server/index.ts`** — `server/src/server.ts` (a stale in-memory prototype with axios/Resend) was deleted; don't recreate a second backend there.
- **Security:** the server exits at boot if `JWT_SECRET` is missing, <20 chars, or the old fallback `CLAVE_SECRETA_DE_FALLBACK`. Never reintroduce a fallback. `express-rate-limit` guards all routes (global 600/15min) with stricter limits on `/auth/register`, `/auth/login`, `/auth/reset-password-confirm` (20/15min) and `/auth/forgot-password` (5/h). Login returns one generic error (no user enumeration); register validates name/email/password length ≥8 server-side. `server/.env.example` must contain only placeholders — never real credentials.
- Schema is auto-created at boot by `ensureSchema()` (`CREATE TABLE IF NOT EXISTS` for users, activities, templates, projects, password_resets). No migration tool; table changes go there.
- Use `sql`...\`SELECT ...\` with `sql.json(obj)` for JSONB params.
- `server/index.ts` connects with `ssl: 'require'` for remote, but auto-detects `localhost`/`127.0.0.1` in `DATABASE_URL` and disables SSL (same convention as `seed.ts`).
- **Seed/schema are aligned:** the `templates` column is `base_elements` everywhere (`ensureSchema` in `index.ts`, `seed.ts`, and the client reads `template.base_elements`). Keep it that way. The "Plantillas cargadas" count prints `templates.length` dynamically (19).
- Auth: JWT Bearer token; `requireAuth` reads `Authorization: Bearer <token>`. Image search (`/api/search-images` y alias `/api/pixabay`) usa un helper común `fetchImageHits`: Pixabay primero, **fallback a Pexels** si Pixabay falla o devuelve 0 resultados (ambos keys opcionales, pero si ninguno está configurado devuelve 500). Ambos providers se normalizan al mismo shape `{ webformatURL, previewURL, tags }`.
- **Activities create/update coalesce optional fields to `?? null`** (`previewImg`, `templateId`, `category`, `thumbnailUrl`) — postgres.js throws `UNDEFINED_VALUE` if any param is `undefined`, and the client only ever sends `{ name, templateId, elements, previewImg }`.
- **Image proxy** `GET /api/image-proxy?url=...` (requireAuth) re-serves Pixabay/Pexels images with `Access-Control-Allow-Origin: *` so html2canvas PDF export doesn't hit a tainted canvas. Host allowlist only (`pixabay.com`, `pexels.com` + subdomains) to avoid SSRF.

## Client gotchas
- Env: `VITE_API_URL` and `PUBLIC_API_URL` (set BOTH identically; see `client/.env.example`). `src/lib/api.ts` uses `PUBLIC_API_URL || VITE_API_URL || localhost`; `+page.ts` loaders use `$env/static/public`. **`PUBLIC_API_URL` missing makes the build fail** (`$env/static/public` throws) — set it in Vercel.
- `$lib/api` auto-attaches the stored JWT (`localStorage` keys `auth_token`, `user_profile`) and returns `{ error, status, _status }` instead of throwing — check `res.error`, don't try/catch for HTTP errors. `status` and `_status` are the same value; both exist so old callers keep working.
- Editor route `editor/[templateId]`: `/api/activities/:id` returns 404 `{error}` when the activity doesn't exist **or belongs to another user** — the page shows "La actividad no existe o no tienes acceso a ella." (no blank editor). Any other activity-fetch error falls back to the template's `base_elements`.
- **Accessibility (keep `bun run check` at 0 errors AND 0 warnings):** toolbars use `role="toolbar"` + `tabindex="0"` + `onkeydown`; modal backdrop is `role="dialog" tabindex="-1"` with Escape-to-close, card is `role="presentation"`; icon-only buttons always carry `title` + matching `aria-label`; color input `<label>`s are associated via `for`/`id` (no listeners on the label — attach `onmousedown` to the input instead); `contenteditable` in Draggable has `role="textbox" aria-multiline` + `tabindex`; drag/rotate/resize handles have `role="button"` + `aria-label`; no `autofocus`, no `href="javascript:..."` (use `/` + `history.back()` fallback). `stopToolbarClick` must be typed `(event: Event)` (shared by click/mousedown/keydown).
- Template/element model: JSON objects `{ type, x, y, width, height, z, fontSize, color, fontFamily, ... }` stored as JSONB, rendered by fabric; `seed.ts` defines the canonical ES/EN template pairs.
- **Uploaded images persist as `data:` URLs inside the element JSONB** (no blob: URLs — `editor.store.svelte.ts` `addImage` uses `FileReader.readAsDataURL`). Uploads are **downscaled to max 1600px** (canvas, JPEG 0.85, PNG preserves alpha) before inserting so photos don't bloat JSONB or hit Express's 10MB body limit; don't remove that resize step. Images from the drawer use remote Pixabay/Pexels URLs (served via image-proxy on PDF export).
- PDF export (`src/lib/editor/pdfService.ts`): html2canvas scale 3 → PNG → jsPDF in **Letter (carta)** format. The A4-ratio canvas is fitted into the letter page preserving aspect ratio and centered (no distortion/clipping). It **swaps external `<img src>` to the backend image-proxy before capturing and restores them after** — don't remove that swap or exports with Pixabay images break. Canvas container stays 700×990 (A4) because seeded templates were authored to that viewport.
- **XSS guard**: `$lib/sanitize.ts` provides `sanitizeRichText` (rich text, applied to contenteditable content in `Draggable.svelte`) and `safeColor` (SVG shape colors). Never inject raw `element.content` via `innerHTML`/`{@html}` — always go through it.
- Static template assets (thumbnails, `mano_*.png`, dice icons) live in `client/static` and are referenced by root path (e.g. `/mano_1.png`).
- `client/.npmrc` sets `engine-strict=true`.

## Deploy (LIVE)
- Backend → Render. `server/Dockerfile` (imagen `oven/bun:1`, `CMD bun run index.ts`) + `server/render.yaml` (Blueprint: web service docker, rootDir `server`, health `/health`, env group `dua-conecta-api-env` con todo `sync: false`). El server exige `DATABASE_URL` y `JWT_SECRET`; si `NODE_ENV=production` y `FRONTEND_URL` es localhost, imprime una advertencia. Tras el primer deploy, sembrar plantillas en la DB de producción desde la pestaña Shell de Render: `bun run seed.ts`.
- Frontend → Vercel. `client/vercel.json` (framework sveltekit, build/install con npm; los scripts de `package.json` son npm-compatibles, sin `bun run`). `@sveltejs/adapter-auto` detecta `VERCEL` e instala `adapter-vercel@5` automáticamente en el build. Variables obligatorias en Vercel: `VITE_API_URL` y `PUBLIC_API_URL` (misma URL del backend).
- CORS: dinámico con `ALLOWED_ORIGINS` (lista separada por comas; opcional) y regex para previews de Vercel (`*.dua-conecta.vercel.app`). `FRONTEND_URL` en Render debe ser la URL de Vercel (también se usa en el enlace de "recuperar contraseña").
- Secrets de producción pendientes de rotar (estuvieron en git history): contraseña de aplicación Gmail del SMTP, `PIXABAY_API_KEY`, `PEXELS_API_KEY`, `DATABASE_URL` de Supabase. Los `.env` reales nunca se commitearon (`.gitignore`), y `server/.env.example` ya solo tiene placeholders.

## Conventions
- All UI copy, server messages, comments, and commit messages are in Spanish — keep new user-facing strings/errors in Spanish.