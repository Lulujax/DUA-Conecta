<script lang="ts">
    // --- 1. ESTADO DE LA PÁGINA ---
    
    // Lista maestra con todas las plantillas
    const allTemplates = [
        {
            id: 1,
            href: '/editor/1',
            title: 'El Monstruo de las Emociones',
            category: 'Conducta',
            thumbnailSrc: '/thumbnail-monstruo.jpg',
            alt: 'Miniatura Monstruo Emociones'
        },
        {
            id: 2,
            href: '/editor/2',
            title: 'Emociones con Lupa',
            category: 'Conducta',
            thumbnailSrc: '/thumbnail-lupa.jpg',
            alt: 'Miniatura Emociones con Lupa'
        },
        {
            id: 3,
            href: '/editor/3',
            title: '¿Cómo te ayudo?',
            category: 'Conducta',
            thumbnailSrc: '/thumbnail-ayuda.jpg',
            alt: 'Miniatura ¿Como te ayudo?'
        },
        {
            id: 4,
            href: '/editor/4',
            title: 'El Dado de las Historias',
            category: 'Lectoescritura',
            thumbnailSrc: '/thumbnail-dado.jpg', 
            alt: 'Miniatura Dado de Historias'
        },
        // --- *** PLANTILLA 5 AÑADIDA (Paso 3.2) *** ---
        {
            id: 5,
            href: '/editor/5',
            title: 'BINGO de Palabras',
            category: 'Lectoescritura',
            thumbnailSrc: '/thumbnail-bingo.jpg', // La miniatura que subiste
            alt: 'Miniatura BINGO de Palabras'
        }
        // --- *** FIN DE LA PLANTILLA 5 *** ---
    ];

    // Categorías para los botones de filtro
    const filterCategories = ['Todas', 'Conducta', 'Matemáticas', 'Lectoescritura'];

    // --- 2. LÓGICA DE FILTRADO ---
    
    let selectedCategory = $state('Todas');

    let filteredTemplates = $derived(
        selectedCategory === 'Todas'
            ? allTemplates
            : allTemplates.filter(t => t.category === selectedCategory)
    );

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
          <input type="text" placeholder="Buscar plantillas por nombre, tema, habilidad..." />
      </div>
        
       <div class="filters">
            {#each filterCategories as category (category)}
                <button 
                    class:active={selectedCategory === category}
                    on:click={() => setFilter(category)}
                >
                    {category}
                </button>
            {/each}
        </div>
  </div>

  <div class="template-grid">
      {#each filteredTemplates as template (template.id)}
          <a href={template.href} class="template-card">
              <div class="thumbnail">
                  {#if template.thumbnailSrc}
                      <img 
                          src={template.thumbnailSrc} 
                          alt={template.alt} 
                          class="thumbnail-image" 
                      />
                  {:else}
                    <span class="thumbnail-placeholder">{template.title}</span>
                  {/if}
              </div>
              <div class="card-content">
                  <h4>{template.title}</h4>
                  <p>{template.category}</p>
              </div>
          </a>
      {/each}
  </div>

  {#if filteredTemplates.length === 0}
      <div class="empty-state-wrapper section visible" style="animation: none;">
          <div class="empty-state-icon">🧐</div>
          <h2>No se encontraron plantillas</h2>
          <p>
              Actualmente no hay plantillas en la categoría <strong>"{selectedCategory}"</strong>.
              <br>
              ¡Vuelve pronto!
          </p>
      </div>
  {/if}

</main>

<style>
     main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 4rem 1.5rem;
    }

    .filters {
        display: flex;
        flex-wrap: wrap; 
        gap: 0.75rem; /* Espacio entre botones */
    }

    .thumbnail {
        overflow: hidden; 
        background-color: var(--bg-section);
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        /* --- AÑADIDO PARA LOS PLACEHOLDERS --- */
        padding: 1rem;
        aspect-ratio: 4 / 3; /* Asegura que todos tengan el mismo alto */
        box-sizing: border-box;
    }
    .thumbnail-placeholder {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--text-light);
    }
    .thumbnail-image {
        width: 100%;
        height: 100%;
        object-fit: cover; 
        object-position: top center; 
        transition: transform 0.4s ease;
    }
    .template-card:hover .thumbnail-image {
        transform: scale(1.05); 
    }
</style>