<script lang="ts">
  import { page } from '$app/stores';

  // Esto captura el ID de la plantilla desde la URL, ej: /editor/1
  const templateId = $page.params.templateId;

  // --- En el futuro ---
  // Aquí cargarías los datos del estudiante
  // let estudiante = { nombre: '' };

  // Asegúrate de que esta imagen exista en 'client/static/images/'
  let monstruoImageUrl = '/images/monstruo-emociones.png'; // <- AJUSTA ESTA RUTA SI ES NECESARIO

</script>

<svelte:head>
  <title>Plantilla: Monstruo de las Emociones</title>
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
        <img src={monstruoImageUrl} alt="Mounstro de las Emociones para colorear" />
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
    background-color: var(--bg-section); /* Color de fondo general */
    box-sizing: border-box;
    display: flex; /* Añadido para centrar */
    justify-content: center; /* Añadido para centrar */
    align-items: flex-start; /* Alinea la hoja arriba */
  }

  /* --- Estilos para la Ficha (Formato Documento A4) --- */
  .ficha-wrapper {
    font-family: Arial, sans-serif; /* Fuente estándar para documentos */
    color: #000000;
    width: 21cm;
    min-height: 29.7cm; /* Para asegurar el tamaño A4 mínimo */
    padding: 2cm; /* Márgenes */
    background: #ffffff;
    border: 1px solid #dcdcdc; /* Borde sutil */
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1); /* Sombra suave */
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  /* 1. Estilos del Encabezado */
  .ficha-header {
    display: flex;
    justify-content: space-between;
    gap: 1.5cm; /* Espacio entre campos */
    margin-bottom: 1cm; /* Espacio debajo del header */
    flex-shrink: 0;
  }

  .info-campo {
    display: flex;
    align-items: baseline; /* Alinea texto y línea */
    flex-grow: 1;
    flex-basis: 0; /* Distribución equitativa */
    min-width: 0; /* Evita desbordamiento en flex */
  }

  .info-campo label {
    font-size: 11pt; /* Tamaño típico de documento */
    font-weight: bold;
    margin-right: 5px;
    white-space: nowrap;
  }

  .linea {
    border-bottom: 1px solid #333; /* Línea más fina */
    width: 100%;
  }

  /* 2. Estilos del Contenido */
  .ficha-contenido {
    flex-grow: 1; /* Ocupa el espacio central */
  }

  .ficha-contenido h1 {
    font-size: 18pt; /* Tamaño de título */
    text-align: center;
    font-weight: bold;
    margin-top: 0; /* Quitar margen superior */
    margin-bottom: 0.8cm;
  }

  .instrucciones {
    font-size: 11pt;
    line-height: 1.4;
    margin-bottom: 0.8cm;
  }

  .ficha-contenido h3 {
    font-size: 11pt;
    font-weight: bold;
    margin-bottom: 0.4cm;
  }

  .lista-emociones {
    list-style: none; /* Sin viñetas */
    padding-left: 0.5cm;
    margin-bottom: 1cm;
  }

  .lista-emociones li {
    font-size: 11pt;
    margin-bottom: 0.3cm;
  }

  .imagen-container {
    text-align: center;
    margin-top: 1cm; /* Espacio sobre la imagen */
  }

  .imagen-container img {
    max-width: 8cm; /* Tamaño máximo de la imagen */
    width: 100%; /* Escala si es más pequeña */
    height: auto;
    display: block; /* Evita espacio extra debajo */
    margin: 0 auto; /* Centra la imagen */
  }

  /* 3. Estilos del Pie de Página */
  .ficha-footer {
    display: flex;
    align-items: baseline;
    justify-content: flex-end; /* Alinea a la derecha */
    margin-top: auto; /* Empuja al final de la página */
    padding-top: 1cm; /* Espacio antes del footer */
    flex-shrink: 0;
  }

  .ficha-footer span {
    font-size: 11pt;
    font-weight: bold;
    margin-right: 5px;
  }

  .linea-footer {
    border-bottom: 1px solid #333;
    width: 5cm; /* Ancho específico para la línea del footer */
  }
</style>