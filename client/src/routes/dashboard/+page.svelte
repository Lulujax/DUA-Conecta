<script lang="ts">
    import { user } from '$lib/stores/auth';

    let userName = '';
    // Nos suscribimos al store para obtener el nombre del usuario
    user.subscribe(value => {
        if (value && value.name) {
            // Tomamos solo el primer nombre para el saludo
            userName = value.name.split(' ')[0];
        }
    });
</script>

<svelte:head>
    <title>Panel de Control - DUA-Conecta</title>
</svelte:head>

<main>
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

        <a href="/dashboard/ideas" class="dashboard-card">
            <div class="card-icon">💡</div>
            <h3>Guía de Ideas</h3>
            <p>Estrategias prácticas y adaptaciones para tu aula diversa.</p>
        </a>

        <a href="/dashboard/perfil" class="dashboard-card">
            <div class="card-icon">👤</div>
            <h3>Gestionar mi Perfil</h3>
            <p>Actualiza tu nombre o cambia tu contraseña de forma segura.</p>
        </a>
    </div>
</main>

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
    
    @media (min-width: 768px) {
        .dashboard-grid {
            /* Ajustamos para que quepan bien las 4 tarjetas */
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }
    }
</style>