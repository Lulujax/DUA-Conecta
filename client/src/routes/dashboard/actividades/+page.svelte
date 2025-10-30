<script lang="ts">
    import { onMount } from 'svelte';
    import { user } from '$lib/stores/auth';
    import { PUBLIC_API_URL } from '$env/static/public';
    // Inicializamos con un array vacío.
    let savedActivities: Array<any> = [];
    let isLoading = true;
    let fetchError: string | null = null;

    onMount(() => {
        fetchActivities();
    });

    /**
     * 1. Fetches saved activities from the protected API route.
     * 2. Uses the user token for authorization.
     */
    async function fetchActivities() {
        isLoading = true;
        fetchError = null;
        
        const currentUser = $user;
        if (!currentUser || !currentUser.token) {
            isLoading = false;
            return;
        }

        try {
            const response = await fetch('${PUBLIC_API_URL}/api/activities', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ocurrió un error al cargar las actividades.');
            }

            savedActivities = result.activities;

        } catch (error) {
            console.error(error);
            fetchError = (error instanceof Error) ? error.message : 'Error desconocido al conectar con el servidor.';
        } finally {
            isLoading = false;
        }
    }

    /** Helper para formatear la fecha */
    function formatDate(dateString: string) {
        if (!dateString) return 'N/A';
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }
</script>

<svelte:head>
    <title>Mis Actividades - DUA-Conecta</title>
</svelte:head>

<main>
    <div class="library-header">
        <h1>Mis Actividades Guardadas</h1>
        <p>Aquí encontrarás todas las actividades que has personalizado y guardado.</p>
    </div>

    {#if isLoading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando tus actividades...</p>
        </div>
    {:else if fetchError}
        <div class="empty-state-wrapper section visible" style="background-color: var(--accent-2-light); border-color: var(--accent-2-dark); color: var(--accent-2-dark); animation: none;">
            <div class="empty-state-icon">❌</div>
            <h2>Error al Cargar</h2>
            <p>No pudimos cargar tus actividades: {fetchError}</p>
            <button on:click={fetchActivities} class="btn-primary" style="background-color: var(--accent-2-dark);">Intentar de Nuevo</button>
        </div>
    {:else if savedActivities.length === 0}
        <div class="empty-state-wrapper section visible">
            <div class="empty-state-icon">📂</div>
            <h2>Tu biblioteca de actividades está vacía</h2>
            <p>¡No te preocupes! Empieza por explorar nuestra increíble colección de plantillas y personaliza tu primera actividad.</p>
            <a href="/dashboard/plantillas" class="btn-primary">Explorar Plantillas</a>
        </div>
    {:else}
        <div class="activities-grid">
            {#each savedActivities as activity (activity.id)}
                <a href="/editor/{activity.template_id}?activityId={activity.id}" class="activity-card">
                    <div class="card-icon">📚</div>
                    <div class="card-content">
                        <h3>{activity.name}</h3>
                        <p>Guardada el: {formatDate(activity.updated_at)}</p>
                        <span class="edit-link">Editar →</span>
                    </div>
                </a>
            {/each}
        </div>
    {/if}
</main>

<style>
    main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 4rem 1.5rem;
        animation: fadeInUp 0.5s ease-out;
    }
    
    .activities-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-top: 3rem;
    }

    .activity-card {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        text-decoration: none;
        color: var(--text-dark);
        transition: all 0.3s ease;
        display: flex;
        gap: 1rem;
        align-items: center;
    }

    .activity-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(160, 132, 232, 0.1);
        border-color: var(--primary-color);
    }

    .activity-card h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.2rem;
        font-weight: 700;
    }

    .activity-card p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-light);
    }

    .activity-card .card-icon {
        font-size: 1.8rem;
        color: var(--primary-color);
        flex-shrink: 0;
    }

    .edit-link {
        font-size: 0.8rem;
        color: var(--primary-color);
        font-weight: 600;
        margin-top: 0.5rem;
        display: block;
    }
    
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 1.5rem;
        text-align: center;
    }
    .loading-state p {
        color: var(--text-light);
    }
    .spinner {
        width: 30px;
        height: 30px;
        border: 4px solid var(--border-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }
</style>