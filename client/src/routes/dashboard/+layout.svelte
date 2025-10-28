<script lang="ts">
    import { goto } from '$app/navigation';
    import { user } from '$lib/stores/auth';
    import { browser } from '$app/environment';
    import { page } from '$app/stores'; // Necesario para $effect

    /** @type {{children: import('svelte').Snippet}} */
    let { children } = $props();

    // --- LÓGICA DE PROTECCIÓN CORREGIDA (AHORA AQUÍ) ---
    // Este $effect protege SOLO las rutas dentro de /dashboard/...
    $effect(() => {
        if (browser) {
            const { pathname } = $page.url;
            const currentUser = $user;

            // Si el usuario NO está logueado Y está en alguna página del dashboard...
            if (!currentUser && pathname.startsWith('/dashboard')) {
                // ...lo enviamos al login.
                goto('/login');
            }
        }
    });


    function logout() {
        user.set(null);
        // Usamos window.location para asegurar la recarga y redirección al home público
        if (browser) {
            window.location.href = '/';
        }
    }
</script>

<!-- Solo mostramos el contenido si el usuario existe (evita errores) -->
{#if $user}
    <div class="page-wrapper">
      <header class="header">
        <a href="/dashboard" class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shapes"><path d="M8.3 10a.7.7 0 0 1-.7.7 1.6 1.6 0 0 0-1.6 1.6.7.7 0 0 1-.7.7H4a.7.7 0 0 1-.7-.7 3 3 0 0 1 3-3 .7.7 0 0 1 .7.7Z"/><path d="M20.7 10a.7.7 0 0 1 .7.7 3 3 0 0 1-3 3 .7.7 0 0 1-.7-.7V12a.7.7 0 0 1 .7-.7 1.6 1.6 0 0 0 1.6-1.6.7.7 0 0 1 .7-.7Z"/><path d="M12.7 4a.7.7 0 0 1 .7.7 1.6 1.6 0 0 0 1.6 1.6.7.7 0 0 1 .7.7v1.4a.7.7 0 0 1-.7.7 3 3 0 0 1-3-3 .7.7 0 0 1 .7-.7Z"/><path d="m12 12-1.4 1.4a3 3 0 0 1-4.2 0 3 3 0 0 1 0-4.2L12 12Z"/></svg>
            <span>DUA-Conecta</span>
        </a>
        <nav class="navigation">
          <a href="/dashboard">Inicio</a>
          <a href="/dashboard/plantillas">Plantillas</a>
          <a href="/dashboard/actividades">Mis Actividades</a>
          <a href="/dashboard/perfil">Mi Perfil</a>
        </nav>
        <div class="auth-buttons">
          <button on:click={logout} class="btn-secondary">Cerrar Sesión</button>
        </div>
      </header>

      {@render children()}
    </div>
{/if}

<style>
    .header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; max-width: 1200px; margin: 0 auto; position: sticky; top: 0; z-index: 1000; }
    .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--header-bg); backdrop-filter: blur(10px); z-index: -1; border-bottom: 1px solid var(--border-color); }
    .logo { display: flex; align-items: center; font-weight: 600; font-size: 1.25rem; text-decoration: none; color: var(--text-dark); }
    .navigation { display: none; }
    
    @media (min-width: 768px) {
        .navigation { display: flex; gap: 2rem; }
        .navigation a { color: var(--text-light); text-decoration: none; font-weight: 600; transition: color 0.3s ease; }
        .navigation a:hover { color: var(--primary-color); }
    }
</style>
