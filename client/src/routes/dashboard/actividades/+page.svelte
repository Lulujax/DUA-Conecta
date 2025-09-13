<script lang="ts">
    // En el futuro, aquí cargaremos las actividades guardadas del usuario.
    // Por ahora, simulamos que la lista está vacía para mostrar el "estado vacío".
    let savedActivities = [];
</script>

<svelte:head>
    <title>Mis Actividades - DUA-Conecta</title>
</svelte:head>

<main>
    <div class="library-header">
        <h1>Mis Actividades Guardadas</h1>
        <p>Aquí encontrarás todas las actividades que has personalizado y guardado.</p>
    </div>

    {#if savedActivities.length === 0}
        <div class="empty-state-wrapper section visible">
            <div class="empty-state-icon">📂</div>
            <h2>Tu biblioteca de actividades está vacía</h2>
            <p>¡No te preocupes! Empieza por explorar nuestra increíble colección de plantillas y personaliza tu primera actividad.</p>
            <a href="/dashboard/plantillas" class="btn-primary">Explorar Plantillas</a>
        </div>
    {:else}
        <p>Aquí se mostrarán tus actividades...</p>
    {/if}
</main>

<style>
    main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 4rem 1.5rem;
        animation: fadeInUp 0.5s ease-out;
    }
</style>