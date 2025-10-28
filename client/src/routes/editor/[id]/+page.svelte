<script lang="ts">
  import { page } from '$app/stores';

  // Esto captura el ID de la plantilla desde la URL, ej: /editor/3
  const templateId = $page.params.id;

  // --- En el futuro ---
  // Aquí cargarías los datos del estudiante y la plantilla
  // usando el 'templateId' para obtener la información.
  
  // Por ahora, usamos datos de ejemplo:
  let estudiante = { nombre: '' }; // El nombre se llenaría desde el formulario
  let monstruoImageUrl = '/images/monstruo-emociones.png'; // <- DEBES PONER LA RUTA A TU IMAGEN

</script>

<svelte:head>
  <title>Editor de Plantilla: Monstruo de las Emociones</title>
</svelte:head>

<div class="editor-background">

  <div class="ficha-wrapper">
    
    <header class="ficha-header">
      <div class="info-campo">
        <label for="nombre">Nombre:</label>
        <span class="linea"></span>
      </div>
      <div class="info-campo">
        <label for="fecha">Fecha:</label>
        <span class="linea"></span>
      </div>
      <div class="info-campo">
        <label for="grado">Grado:</label>
        <span class="linea"></span>
      </div>
    </header>

    <main class="ficha-contenido">
      <h1>El Mounstro de las Emociones</h1>

      <p class="instrucciones">
        El mounstro siente muchas emociones, dice que cada una
        parte de su cuerpo hay una emocion ¿En que parte del
        cuerpo sientes la emocion?
      </p>

      <h3>COLORES Y EMOCIONES:</h3>
      
      <ul class="lista-emociones">
        <li>ROJO - IRA/MOLESTIA</li>
        <li>MORADO - MIEDO</li>
        <li>AZUL - TRISTEZA</li>
        <li>AMARILLO - FELICIDAD</li>
        <li>VERDE - ASCO</li>
      </ul>

      <div class="imagen-container">
        <img src={monstruoImageUrl} alt="Mounstro de las Emociones" />
      </div>
    </main>

    <footer class="ficha-footer">
      <span>¡Gana tu ficha aqui!</span>
      <span class="linea-footer"></span>
    </footer>
  </div>

</div>


<style>
  /* --- Estilos para la Página del Editor --- */
  .editor-background {
    width: 100%;
    min-height: 100vh;
    padding: 4rem 1.5rem;
    background-color: var(--bg-section); /* Usa el color de fondo de tu app.css */
    box-sizing: border-box;
  }

  /* --- Estilos para la Ficha (Formato Documento) --- */
  .ficha-wrapper {
    font-family: Arial, sans-serif; /* Fuente genérica para impresión */
    color: #000000; /* Color de texto negro sólido */
    width: 21cm; /* Ancho de A4 */
    min-height: 29.7cm; /* Alto de A4 (opcional, crecerá) */
    padding: 2cm; /* Márgenes de documento */
    margin: 0 auto; /* Centra la hoja */
    background: #ffffff; /* Fondo blanco */
    border: 1px solid #e0e0e0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    box-sizing: border-box; 
  }

  /* 1. Estilos del Encabezado */
  .ficha-header {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 25px;
    flex-shrink: 0; /* No se encoge */
  }

  .info-campo {
    display: flex;
    align-items: baseline;
    flex-grow: 1; 
    flex-basis: 0;
  }

  .info-campo label {
    font-size: 14px;
    font-weight: bold;
    margin-right: 8px;
    white-space: nowrap; 
  }

  .linea {
    border-bottom: 1.5px solid #333;
    width: 100%;
  }

  /* 2. Estilos del Contenido */
  .ficha-contenido {
    flex-grow: 1; /* Ocupa el espacio restante */
  }

  .ficha-contenido h1 {
    font-size: 28px;
    text-align: center;
    font-weight: bold;
    margin-top: 10px;
    margin-bottom: 20px;
  }

  .instrucciones {
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 20px;
  }

  .ficha-contenido h3 {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  .lista-emociones {
    list-style: none;
    padding-left: 20px; 
    margin-bottom: 30px;
  }

  .lista-emociones li {
    font-size: 16px;
    margin-bottom: 8px;
  }

  .imagen-container {
    text-align: center;
  }

  .imagen-container img {
    max-width: 300px; 
    width: 60%;
    height: auto;
  }

  /* 3. Estilos del Pie de Página */
  .ficha-footer {
    display: flex;
    align-items: baseline;
    justify-content: flex-end; 
    margin-top: auto; /* Empuja el footer al fondo */
    padding-top: 40px; /* Espacio antes del footer */
    flex-shrink: 0; /* No se encoge */
  }

  .ficha-footer span {
    font-size: 14px;
    font-weight: bold;
    margin-right: 8px;
  }

  .linea-footer {
    border-bottom: 1.5px solid #333;
    width: 200px; 
  }
</style>