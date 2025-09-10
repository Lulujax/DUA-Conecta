<script lang="ts">
  import { onMount } from 'svelte';

  // 1. Preparamos una variable para guardar el mensaje del servidor.
  let messageFromServer = "Conectando al servidor...";

  // 2. onMount es una función especial que se ejecuta
  //    justo cuando la página se carga en el navegador.
  onMount(async () => {
    try {
      // 3. Hacemos la "llamada" a nuestro backend en el puerto 3000.
      const response = await fetch('http://localhost:3000');
      const data = await response.text(); // Convertimos la respuesta a texto.
      
      // 4. Actualizamos la variable con la respuesta.
      messageFromServer = data;
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      messageFromServer = "Error: No se pudo conectar al servidor.";
    }
  });
</script>

<main>
  <h1>Aplicación DUA-Conecta</h1>
  <h3>Prueba de Comunicación Frontend - Backend</h3>
  <p>Respuesta del servidor:</p>
  <div class="message-box">
    <strong>{messageFromServer}</strong>
  </div>
</main>

<style>
  main {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    text-align: center;
    max-width: 600px;
    margin: 4em auto;
  }
  .message-box {
    border: 2px solid #ff3e00;
    padding: 1.5em;
    border-radius: 8px;
    margin-top: 1em;
    background-color: #fff8f5;
    font-size: 1.2em;
  }
</style>