<script lang="ts">
    import { onMount } from 'svelte';
    import { user } from '$lib/stores/auth';
    // --- IMPORTACIÓN CORREGIDA ---
    import { PUBLIC_API_URL } from '$env/static/public';

    // Inicializamos con un array vacío.
    let savedActivities: Array<any> = [];
    let isLoading = true;
    let fetchError: string |
null = null;
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
            fetchError = "No estás autenticado. Por favor, inicia sesión.";
            return;
        }

        try {
            // --- FETCH CORREGIDO ---
            const response = await fetch(`${PUBLIC_API_URL}/api/activities`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
  
                 }
            });
            // --- MANEJO DE ERRORES MEJORADO ---
             if (!response.headers.get('content-type')?.includes('application/json')) {
                 throw new Error(`Respuesta inesperada del servidor. Código: ${response.status}`);
            }
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Ocurrió un error al cargar las actividades.');
            }

            savedActivities = result.activities;
        } catch (error) {
            console.error(error);
            if (error instanceof SyntaxError) {
                 fetchError = "Error: Respuesta inesperada del servidor.";
            } else if (error instanceof Error) {
                 fetchError = error.message;
            } else {
                 fetchError = 'Error desconocido al conectar con el servidor.';
            }
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

    // *** NUEVA FUNCIÓN (Goal 3b): Eliminar una actividad ***
    async function deleteActivity(activityId: number) {
        // 1. Confirmación
        if (!confirm('¿Estás seguro de que quieres eliminar esta actividad? Esta acción no se puede deshacer.')) {
            return;
        }

        // 2. Obtener token
        const currentUser = $user;
        if (!currentUser || !currentUser.token) {
            fetchError = "No estás autenticado.";
            alert(fetchError);
            return;
        }

        try {
            // 3. Llamar al endpoint DELETE
            const response = await fetch(`${PUBLIC_API_URL}/api/activities/${activityId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'No se pudo eliminar la actividad.');
            }

            // 4. Éxito: Eliminar de la lista local para actualizar la UI
            savedActivities = savedActivities.filter(activity => activity.id !== activityId);
            // alert('Actividad eliminada con éxito.'); // Opcional: la UI se actualiza sola

        } catch (error) {
            if (error instanceof Error) {
                fetchError = error.message;
            } else {
                fetchError = 'Error desconocido al eliminar.';
            }
            alert(fetchError); // Notificar al usuario del error
        }
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
            <p>¡No te preocupes!
 Empieza por explorar nuestra increíble colección de plantillas y personaliza tu primera actividad.</p>
            <a href="/dashboard/plantillas" class="btn-primary">Explorar Plantillas</a>
        </div>
    {:else}
        <div class="activities-grid">
            {#each savedActivities as activity (activity.id)}
                <div class="activity-card-wrapper">
                    <a href="/editor/{activity.template_id}?activityId={activity.id}&name={encodeURIComponent(activity.name)}" class="activity-card">
                        <div class="card-icon">📚</div>
                        <div class="card-content">
                            <h3>{activity.name}</h3>
                            <p>Modificada el: {formatDate(activity.updated_at)}</p>
                            <span class="edit-link">Editar →</span>
                        </div>
                    </a>
                    <button 
                        on:click|stopPropagation|preventDefault={() => deleteActivity(activity.id)} 
                        class="delete-button" 
                        title="Eliminar actividad"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
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

    /* *** NUEVOS ESTILOS (Goal 3b) *** */
    .activity-card-wrapper {
        position: relative;
        display: flex;
        transition: all 0.3s ease;
    }
    
    .activity-card-wrapper:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 20px rgba(160, 132, 232, 0.1);
    }

    .activity-card {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 1.5rem;
        text-decoration: none;
        color: var(--text-dark);
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-grow: 1; /* El enlace ocupa el espacio */
        transition: border-color 0.3s ease;
    }

    .activity-card-wrapper:hover .activity-card {
         border-color: var(--primary-color);
    }
    
    .delete-button {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        background-color: transparent;
        border: 1px solid transparent;
        color: var(--text-light);
        cursor: pointer;
        padding: 0.35rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        z-index: 2; /* Asegura que esté sobre el contenido */
    }

    .delete-button:hover {
        color: #e53e3e; /* Rojo error */
        background-color: rgba(229, 62, 62, 0.1);
    }
    
    .activity-card .card-content {
        /* Añadimos espacio a la derecha para que el texto no quede debajo del botón */
        padding-right: 2.5rem; 
    }
    /* *** FIN DE NUEVOS ESTILOS *** */


    .activity-card h3 {
        margin: 0 0 0.25rem 0;
        font-size: 1.2rem;
        font-weight: 700;
        /* Para evitar que el texto largo se salga */
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 250px; /* Ajusta según sea necesario */
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