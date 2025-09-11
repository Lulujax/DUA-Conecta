<script lang="ts">
    import { goto } from '$app/navigation';
    import { user } from '$lib/stores/auth';

    function logout() {
        // Limpiamos el store, lo que también limpiará localStorage
        user.set(null);
        // Redirigimos a la página de inicio
        goto('/');
    }
</script>

<svelte:head>
    <title>Panel de Control - DUA-Conecta</title>
</svelte:head>

<div class="dashboard-wrapper">
    <div class="dashboard-content">
        <h1>¡Bienvenido a tu Panel de Control!</h1>
        <p>Aquí podrás gestionar tus estudiantes, plantillas y crear nuevas actividades.</p>
        <button on:click={logout} class="btn-secondary">Cerrar Sesión</button>
    </div>
</div>

<style>
    .dashboard-wrapper {
        padding: 4rem 1.5rem;
        text-align: center;
        animation: fadeInUp 0.5s ease-out;
    }
    .dashboard-content {
        max-width: 800px;
        margin: 0 auto;
    }
    h1 {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--text-dark);
    }
    p {
        font-size: 1.1rem;
        color: var(--text-light);
        margin-bottom: 2rem;
    }
</style>