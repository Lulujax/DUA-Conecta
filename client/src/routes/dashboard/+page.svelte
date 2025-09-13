<script lang="ts">
    import { goto } from '$app/navigation';
    import { user } from '$lib/stores/auth';

    let userName = '';
    // Nos suscribimos al store para obtener el nombre del usuario
    user.subscribe(value => {
        if (value) {
            // Tomamos solo el primer nombre para el saludo
            userName = value.name.split(' ')[0];
        }
    });

    function logout() {
        // Limpiamos el store, lo que también borra de localStorage
        user.set(null);
        // Redirigimos a la página de inicio
        goto('/');
    }
</script>

<svelte:head>
    <title>Panel de Control - DUA-Conecta</title>
</svelte:head>

<div class="page-wrapper">
  <header class="header">
    <div class="logo">
        <a href="/" style="display: flex; align-items: center; text-decoration: none; color: var(--text-dark);">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shapes"><path d="M8.3 10a.7.7 0 0 1-.7.7 1.6 1.6 0 0 0-1.6 1.6.7.7 0 0 1-.7.7H4a.7.7 0 0 1-.7-.7 3 3 0 0 1 3-3 .7.7 0 0 1 .7.7Z"/><path d="M20.7 10a.7.7 0 0 1 .7.7 3 3 0 0 1-3 3 .7.7 0 0 1-.7-.7V12a.7.7 0 0 1 .7-.7 1.6 1.6 0 0 0 1.6-1.6.7.7 0 0 1 .7-.7Z"/><path d="M12.7 4a.7.7 0 0 1 .7.7 1.6 1.6 0 0 0 1.6 1.6.7.7 0 0 1 .7.7v1.4a.7.7 0 0 1-.7.7 3 3 0 0 1-3-3 .7.7 0 0 1 .7-.7Z"/><path d="m12 12-1.4 1.4a3 3 0 0 1-4.2 0 3 3 0 0 1 0-4.2L12 12Z"/></svg>
            <span style="margin-left: 0.5rem;">DUA-Conecta</span>
        </a>
    </div>
    <nav class="navigation">
      <a href="/dashboard/plantillas">Explorar Plantillas</a>
      <a href="/dashboard/perfil">Mi Perfil</a>
    </nav>
    <div class="auth-buttons">
      <button on:click={logout} class="btn-secondary">Cerrar Sesión</button>
    </div>
  </header>

  <main class="dashboard-main">
    <div class="dashboard-header">
        <h1>¡Hola, {userName}!</h1>
        <p class="subtitle">¿Qué te gustaría hacer hoy?</p>
    </div>

    <div class="dashboard-grid">
        <a href="/dashboard/plantillas" class="dashboard-card">
            <div class="card-icon">🎨</div>
            <h3>Explorar Plantillas</h3>
            <p>Busca en la biblioteca y encuentra la actividad perfecta para tu clase.</p>
        </a>
        <a href="/dashboard/actividades" class="dashboard-card">
            <div class="card-icon">📚</div>
            <h3>Mis Actividades</h3>
            <p>Accede a todas las actividades que has personalizado y guardado.</p>
        </a>
        <a href="/dashboard/perfil" class="dashboard-card">
            <div class="card-icon">👤</div>
            <h3>Gestionar mi Perfil</h3>
            <p>Actualiza tu nombre o cambia tu contraseña de forma segura.</p>
        </a>
    </div>
  </main>
</div>

<style>
    main {
        max-width: 1100px;
        margin: 0 auto;
        padding: 4rem 1.5rem;
        animation: fadeInUp 0.5s ease-out;
    }
    .dashboard-header {
        text-align: center;
        margin-bottom: 4rem;
    }
    h1 {
        font-size: 2.8rem;
        font-weight: 800;
        color: var(--text-dark);
        margin: 0;
    }
    .subtitle {
        font-size: 1.2rem;
        color: var(--text-light);
        margin-top: 0.5rem;
    }
    .dashboard-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
    .dashboard-card {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 20px;
        padding: 2rem;
        text-decoration: none;
        color: var(--text-dark);
        transition: all 0.3s ease;
    }
    .dashboard-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px rgba(160, 132, 232, 0.1);
        border-color: var(--primary-color);
    }
    .card-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
    }
    .dashboard-card h3 {
        font-size: 1.5rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
    }
    .dashboard-card p {
        color: var(--text-light);
        line-height: 1.6;
        margin: 0;
    }
    
    /* Estilos para el header del dashboard */
    .header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; max-width: 1100px; margin: 0 auto; position: sticky; top: 0; z-index: 1000; }
    .header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--header-bg); backdrop-filter: blur(10px); z-index: -1; border-bottom: 1px solid var(--border-color); }
    .logo { display: flex; align-items: center; font-weight: 600; font-size: 1.25rem; }
    .navigation { display: none; }
    .auth-buttons { display: flex; gap: 0.75rem; }
    
    @media (min-width: 768px) {
        .navigation { display: flex; gap: 1.5rem; }
        .navigation a { color: var(--text-light); text-decoration: none; font-weight: 600; transition: color 0.3s ease; }
        .navigation a:hover { color: var(--primary-color); }
        .dashboard-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }
</style>