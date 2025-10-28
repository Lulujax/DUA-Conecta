<script lang="ts">
    // Ya no necesitamos la lista de plantillas falsas aquí.
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
      <!-- Mostramos solo la tarjeta de nuestra plantilla real -->
      <a href="/editor/1" class="template-card">
          <div class="thumbnail">
              <span>(Miniatura Monstruo Emociones)</span>
          </div>
          <div class="card-content">
              <h4>El Monstruo de las Emociones</h4>
              <p>Habilidades Sociales</p>
          </div>
      </a>
      <!-- En el futuro, aquí iteraremos sobre las plantillas que vengan del backend -->
  </div>
</main>

<style>
    main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 4rem 1.5rem;
    }
</style>


