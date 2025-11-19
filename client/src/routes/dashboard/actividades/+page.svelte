<script lang="ts">
    import { onMount } from 'svelte';
    import { api } from '$lib/api';
    import { toast } from '$lib/stores/toast.svelte';
    import { fade, fly } from 'svelte/transition';

    let activities: any[] = [];
    let isLoading = true;

    onMount(async () => {
        try {
            const response = await api.get('/api/activities');
            activities = response.activities;
        } catch (error) {
            console.error(error);
            toast.error("No se pudieron cargar tus actividades.");
        } finally {
            isLoading = false;
        }
    });

    async function handleDelete(id: number) {
        if(!confirm("¿Estás seguro? Esta acción no se puede deshacer.")) return;
        try {
            await api.delete(`/api/activities/${id}`);
            activities = activities.filter(a => a.id !== id);
            toast.success("Actividad eliminada correctamente.");
        } catch (e) {
            toast.error("Error al eliminar.");
        }
    }
</script>

<svelte:head>
    <title>Mis Actividades - DUA-Conecta</title>
</svelte:head>

<div class="page-container">
    <header class="page-header">
        <h1>Mis Actividades</h1>
        <p>Tu colección de recursos personalizados listos para usar.</p>
    </header>

    {#if isLoading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Recuperando tu trabajo...</p>
        </div>
    {:else if activities.length === 0}
        <div class="empty-state" in:fade>
            <div class="empty-icon">🎨</div>
            <h3>Tu galería está vacía</h3>
            <p>Aún no has guardado ninguna actividad personalizada.</p>
            <a href="/dashboard/plantillas" class="btn-primary-large">Explorar Plantillas</a>
        </div>
    {:else}
        <div class="activities-grid">
            {#each activities as activity, i (activity.id)}
                <div class="activity-card" in:fly={{ y: 20, duration: 400, delay: i * 50 }}>
                    <div class="card-image">
                        {#if activity.preview_img}
                            <img 
                                src={activity.preview_img} 
                                alt={activity.name} 
                                loading="lazy" 
                                style="object-fit: cover; object-position: top;"
                            />
                        {:else if activity.thumbnail_url}
                            <img 
                                src={activity.thumbnail_url} 
                                alt={activity.name} 
                                loading="lazy" 
                            />
                        {:else}
                            <div class="placeholder-img"><span>{activity.name[0]}</span></div>
                        {/if}
                        
                        <div class="overlay-actions">
                            <a href="/editor/{activity.template_id}?activityId={activity.id}&name={encodeURIComponent(activity.name)}" class="btn-icon edit" title="Editar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                            </a>
                            <button class="btn-icon delete" onclick={() => handleDelete(activity.id)} title="Eliminar">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                        {#if activity.category}
                            <span class="category-badge">{activity.category}</span>
                        {/if}
                    </div>
                    <div class="card-body">
                        <h3 title={activity.name}>{activity.name}</h3>
                        <div class="meta-info">
                            <span class="date">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                {new Date(activity.updated_at).toLocaleDateString()}
                            </span>
                        </div>
                        <a href="/editor/{activity.template_id}?activityId={activity.id}&name={encodeURIComponent(activity.name)}" class="btn-open">Continuar Editando</a>
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style>
    .page-container { max-width: 1200px; margin: 0 auto; padding: 4rem 1.5rem; }
    .page-header { text-align: center; margin-bottom: 4rem; }
    .page-header h1 { font-size: 2.5rem; font-weight: 800; color: var(--text-dark); margin-bottom: 0.5rem; }
    .page-header p { font-size: 1.1rem; color: var(--text-light); }
    .loading-state, .empty-state { text-align: center; padding: 6rem 2rem; background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border-color); }
    .spinner { width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1.5rem; }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .btn-primary-large { display: inline-block; background: var(--primary-color); color: white; padding: 1rem 2rem; border-radius: 50px; text-decoration: none; font-weight: 700; margin-top: 1.5rem; transition: transform 0.2s; }
    .btn-primary-large:hover { transform: scale(1.05); }
    .activities-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; }
    .activity-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; transition: transform 0.3s ease, box-shadow 0.3s ease; display: flex; flex-direction: column; position: relative; }
    .activity-card:hover { transform: translateY(-5px); box-shadow: 0 15px 30px rgba(0,0,0,0.1); border-color: var(--primary-color); }
    .card-image { position: relative; aspect-ratio: 16/10; background: var(--bg-section); overflow: hidden; }
    .card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
    .activity-card:hover .card-image img { transform: scale(1.05); }
    .placeholder-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; color: var(--border-color); }
    .overlay-actions { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; gap: 1rem; opacity: 0; transition: opacity 0.2s ease; backdrop-filter: blur(2px); }
    .activity-card:hover .overlay-actions { opacity: 1; }
    .btn-icon { background: white; border: none; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-dark); cursor: pointer; transition: transform 0.2s, background 0.2s; }
    .btn-icon:hover { transform: scale(1.1); }
    .btn-icon.delete { color: #ef4444; }
    .btn-icon.delete:hover { background: #fee2e2; }
    .category-badge { position: absolute; bottom: 10px; left: 10px; background: rgba(255,255,255,0.9); color: var(--text-dark); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .card-body { padding: 1.5rem; flex-grow: 1; display: flex; flex-direction: column; }
    h3 { margin: 0 0 0.5rem 0; font-size: 1.2rem; font-weight: 700; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .meta-info { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .date { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: var(--text-light); }
    .btn-open { margin-top: auto; text-align: center; background: var(--bg-section); color: var(--text-dark); text-decoration: none; padding: 0.8rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; }
    .btn-open:hover { background: var(--primary-color); color: white; }
    @keyframes spin { to { transform: rotate(360deg); } }
</style>