<script lang="ts">
    import { PUBLIC_API_URL } from '$env/static/public';

    // --- ESTADO DEL COMPONENTE ---
    let isLoading = false;
    let formMessage = ''; // Mensaje de éxito o error
    let messageType = 'error'; // 'success' o 'error'
    let formData = {
        email: ''
    };

    // --- LÓGICA DE ENVÍO DEL FORMULARIO ---
    async function handleSubmit() {
        isLoading = true;
        formMessage = ''; // Resetea el mensaje en cada intento
        messageType = 'error';

        try {
            // 2. Enviamos los datos al backend
            const response = await fetch(`${PUBLIC_API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                }),
            });

            // 3. Manejamos la respuesta del servidor
            if (!response.headers.get('content-type')?.includes('application/json')) {
                throw new Error(`Respuesta inesperada del servidor. Código: ${response.status}`);
            }
            
            const result = await response.json();

            if (!response.ok) {
                // Si el servidor responde con un error, lo mostramos
                throw new Error(result.error || 'Ocurrió un error al procesar la solicitud.');
            }

            // 4. Si todo salió bien, mostramos el mensaje de éxito
            messageType = 'success';
            formMessage = result.message; // "Si el correo existe, recibirás un enlace."
            formData.email = ''; // Limpiamos el campo

        } catch (error) {
            // Si hay un error en la comunicación o del servidor, lo mostramos
            messageType = 'error';
            if (error instanceof SyntaxError) {
                formMessage = "Error: Respuesta inesperada del servidor.";
            } else if (error instanceof Error) {
                formMessage = error.message;
            } else {
                formMessage = "Un error desconocido ocurrió."
            }
        } finally {
            // Pase lo que pase, detenemos la animación de carga
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Recuperar Contraseña - DUA-Conecta</title>
</svelte:head>

<div class="auth-wrapper">
    <div class="auth-card">
         <a href="/" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <span>Volver al Inicio</span>
        </a>

        <h2>Recuperar Contraseña</h2>
         <p class="subtitle">Ingresa tu correo y te enviaremos un enlace para reestablecerla.</p>
        
        <form on:submit|preventDefault={handleSubmit}>
            <div class="form-group">
                <label for="email">Correo Electrónico</label>
                <input type="email" id="email" name="email" required placeholder="tu@correo.com" bind:value={formData.email} />
            </div>

            {#if formMessage}
                 <p class="form-message {messageType}">{formMessage}</p>
            {/if}

            <button type="submit" class="btn-primary" disabled={isLoading}>
                {#if isLoading}
                    <div class="spinner"></div>
                {:else}
                   Enviar Enlace
                {/if}
            </button>
        </form>

        <div class="switch-link">
            <p>¿Recordaste tu contraseña? <a href="/login">Inicia Sesión</a></p>
        </div>
    </div>
</div>

<style>
    .auth-card {
        position: relative;
    }

    /* Estos estilos ya están en 'app.css' gracias a la página de perfil, 
      pero los pongo aquí por si acaso para asegurar que se vean bien.
    */
    .form-message {
        padding: 0.75rem 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        margin-top: 1rem;
        text-align: center;
    }
    .form-message.success {
        color: #38a169;
        background-color: rgba(56, 161, 105, 0.1);
    }
    .form-message.error {
        color: #e53e3e;
        background-color: rgba(229, 62, 62, 0.1);
    }
</style>