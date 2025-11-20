<script lang="ts">
    import { onMount } from 'svelte';
    import { api } from '$lib/api';
    import { toast } from '$lib/stores/toast.svelte';
    import { fade, fly } from 'svelte/transition';

    // ESTADO: Empezamos vacío esperando datos del servidor
    let allTemplates: Array<any> = [];
    let isLoading = true;
    let selectedCategory = 'Todas';
    let searchQuery = '';

    // FILTROS: Incluimos 'Inglés'
    const filterCategories = ['Todas', 'Conducta', 'Matemáticas', 'Lectoescritura', 'Inglés'];

    // CARGA DE DATOS REALES
    onMount(async () => {
        try {
            // Petición al backend (que ahora lee de la DB llena por seed.ts)
            const response = await api.get('/templates');
            if (response.templates) {
                allTemplates = response.templates;
            }
        } catch (error) {
            console.error(error);
            toast.error('No se pudo cargar la biblioteca.');
        } finally {
            isLoading = false;
        }
    });

    // LÓGICA DE FILTRADO
    $: filteredTemplates = allTemplates.filter(t => {
        const matchesCategory = selectedCategory === 'Todas' || t.category === selectedCategory;
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    function setFilter(category: string) {
        selectedCategory = category;
    }
</script>

<svelte:head>
    <title>Biblioteca de Plantillas - DUA-Conecta</title>
</svelte:head>

<main>
  <div class="library-header">
      <h1>Biblioteca de Plantillas</h1>
      <p>Encuentra, personaliza y crea actividades increíbles en segundos.</p>
  </div>

  <div class="search-and-filters">
      <div class="search-bar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Buscar plantillas..." bind:value={searchQuery} />
      </div>
      
       <div class="filters">
            {#each filterCategories as category}
                <button class:active={selectedCategory === category} onclick={() => setFilter(category)}>
                    {category}
                </button>
            {/each}
        </div>
  </div>

  {#if isLoading}
      <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando biblioteca...</p>
      </div>
  {:else if filteredTemplates.length === 0}
      <div class="empty-state-wrapper section visible" in:fade>
          <div class="empty-state-icon">🧐</div>
          <h2>No se encontraron resultados</h2>
          <p>Intenta con otra categoría o término de búsqueda.</p>
      </div>
  {:else}
      <div class="template-grid">
          {#each filteredTemplates as template, i (template.id)}
              <a href="/editor/{template.id}" class="template-card" in:fly={{ y: 20, duration: 400, delay: i * 50 }}>
                  <div class="thumbnail">
                      {#if template.thumbnail_url}
                          <img src={template.thumbnail_url} alt={template.name} class="thumbnail-image" loading="lazy" />
                      {:else}
                        <span class="thumbnail-placeholder">{template.name}</span>
                      {/if}
                      
                      <div class="hover-overlay">
                          <p>{template.description || "Sin descripción disponible."}</p>
                          <span class="btn-use">Usar Plantilla</span>
                      </div>
                  </div>
                  <div class="card-content">
                      <h4>{template.name}</h4>
                      <p>{template.category}</p>
                  </div>
              </a>
          {/each}
      </div>
  {/if}
</main>

<style>
    main { max-width: 1200px; margin: 0 auto; padding: 4rem 1.5rem; }
    .library-header { text-align: center; margin-bottom: 3rem; }
    .library-header h1 { font-size: 2.8rem; font-weight: 800; color: var(--text-dark); margin-bottom: 0.5rem; }
    .library-header p { font-size: 1.1rem; color: var(--text-light); }
    .search-and-filters { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 3rem; }
    @media (min-width: 768px) { .search-and-filters { flex-direction: row; align-items: center; } }
    .search-bar { position: relative; flex-grow: 1; }
    .search-bar input { width: 100%; padding: 1rem 1rem 1rem 3rem; border-radius: 50px; border: 1px solid var(--border-color); background-color: var(--bg-card); font-size: 1rem; color: var(--text-dark); }
    .search-bar svg { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-light); }
    .filters { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .filters button { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 50px; padding: 0.6rem 1.2rem; font-weight: 600; color: var(--text-light); cursor: pointer; transition: all 0.3s ease; }
    .filters button:hover { border-color: var(--primary-color); color: var(--primary-color); }
    .filters button.active { background-color: var(--primary-color); color: var(--text-on-primary); border-color: var(--primary-color); }
    .template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; }
    .template-card { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 20px; overflow: hidden; text-decoration: none; color: var(--text-dark); transition: all 0.3s ease; display: block; }
    .template-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(160, 132, 232, 0.15); }
    .thumbnail { width: 100%; aspect-ratio: 4 / 3; background-color: var(--bg-section); display: flex; align-items: center; justify-content: center; padding: 1rem; box-sizing: border-box; overflow: hidden; position: relative; }
    .thumbnail-image { width: 100%; height: 100%; object-fit: contain; transition: transform 0.4s ease; }
    .template-card:hover .thumbnail-image { transform: scale(1.05); }
    .thumbnail-placeholder { font-size: 0.9rem; font-weight: 600; color: var(--text-light); }
    .card-content { padding: 1.5rem; }
    .card-content h4 { margin: 0 0 0.5rem 0; font-size: 1.2rem; font-weight: 700; }
    .card-content p { margin: 0; color: var(--text-light); font-size: 0.9rem; }
    .loading-state { text-align: center; padding: 4rem; }
    .spinner { width: 30px; height: 30px; border: 4px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem auto; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state-wrapper { text-align: center; padding: 4rem; border: 1px dashed var(--border-color); border-radius: 20px; background-color: var(--bg-card); }
    .empty-state-icon { font-size: 3rem; margin-bottom: 1rem; }
    
    /* Hover Styles */
    .hover-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(61, 36, 108, 0.9); color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1.5rem; box-sizing: border-box; opacity: 0; transition: opacity 0.3s ease; text-align: center; }
    .template-card:hover .hover-overlay { opacity: 1; }
    .hover-overlay p { font-size: 0.9rem; line-height: 1.4; margin-bottom: 1rem; }
    .btn-use { background: var(--primary-color); padding: 0.5rem 1rem; border-radius: 20px; font-weight: 700; font-size: 0.8rem; }
</style>