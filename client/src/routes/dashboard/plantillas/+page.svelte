<script lang="ts">
    // No se necesita lógica aquí por ahora
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
          <button class="active">Todas</button>
          <button>Matemáticas</button>
          <button>Lectoescritura</button>
          <button>Sociales</button>
      </div>
  </div>

  <div class="template-grid">
      <a href="/editor/1" class="template-card">
          <div class="thumbnail">
             <span>(Miniatura Monstruo Emociones)</span>
          </div>
          <div class="card-content">
              <h4>El Monstruo de las Emociones</h4>
              <p>Habilidades Sociales</p>
          </div>
      </a>
      
      <a href="/editor/2" class="template-card">
          <div class="thumbnail">
             <img src="/thumbnail-lupa.jpg" alt="Miniatura Emociones con Lupa" class="thumbnail-image" />
          </div>
          <div class="card-content">
              <h4>Emociones con Lupa</h4>
              <p>Habilidades Sociales</p>
          </div>
      </a>

      <a href="/editor/3" class="template-card">
          <div class="thumbnail">
             <img src="/thumbnail-ayuda.jpg" alt="Miniatura ¿Como te ayudo?" class="thumbnail-image" />
          </div>
          <div class="card-content">
              <h4>¿Cómo te ayudo?</h4>
              <p>Resolución de Conflictos</p>
          </div>
      </a>
      </div>
</main>

<style>
     main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 4rem 1.5rem;
    }

    /* --- ESTILOS PARA LAS NUEVAS IMÁGENES DE MINIATURA --- */
    .thumbnail {
        /* (Estilos existentes de app.css) */
        overflow: hidden; /* Asegura que la imagen no se salga */
    }
    .thumbnail-image {
        width: 100%;
        height: 100%;
        object-fit: cover; /* Cubre el área sin distorsionar */
        object-position: top center; /* Se enfoca en la parte de arriba */
        transition: transform 0.4s ease;
    }
    .template-card:hover .thumbnail-image {
        transform: scale(1.05); /* Sutil efecto de zoom */
    }
    
    /* (El resto de estilos se cargan desde app.css) */
</style>