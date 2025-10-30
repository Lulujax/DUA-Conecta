<script lang="ts">
    import { PUBLIC_API_URL } from '$env/static/public';
    let isLoading = false;
    let emailSent = false;
    let formError = '';
    let email = '';

    async function handleSubmit() {
        isLoading = true;
        formError = '';

        try {
            const response = await fetch('${PUBLIC_API_URL}/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ocurrió un error en el servidor.');
            }

            // --- LÓGICA DE CIBERSEGURIDAD ---
            // Al terminar, SIEMPRE mostramos el mensaje de éxito,
            // sin importar si el correo existía o no.
            emailSent = true;

        } catch (error) {
            // Incluso si hay un error, por seguridad podríamos optar por mostrar el mensaje de éxito.
            // O mostrar un error genérico si la API está caída.
            emailSent = true; // Por ahora, mostramos éxito incluso si falla para no dar pistas.
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Recuperar Contraseña - DUA-Conecta</title>
</svelte:head>

<div class="auth-wrapper">
    <div class="auth-card">
        <a href="/login" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <span>Volver a Iniciar Sesión</span>
        </a>

        {#if emailSent}
            <div class="success-state">
                <div class="success-icon">📧</div>
                <h2>Revisa tu Correo</h2>
                <p class="subtitle">Si existe una cuenta asociada a <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña en los próximos minutos.</p>
            </div>
        {:else}
            <div>
                <h2>¿Olvidaste tu Contraseña?</h2>
                <p class="subtitle">No te preocupes. Ingresa tu correo electrónico y te enviaremos un enlace para recuperarla.</p>
                
                <form on:submit|preventDefault={handleSubmit}>
                    <div class="form-group">
                        <label for="email">Correo Electrónico</label>
                        <input type="email" id="email" name="email" required placeholder="tu@correo.com" bind:value={email} />
                    </div>
                    
                    {#if formError}
                        <p class="error-message">{formError}</p>
                    {/if}

                    <button type="submit" class="btn-primary" disabled={isLoading}>
                        {#if isLoading}
                            <div class="spinner"></div>
                        {:else}
                            Enviar Enlace de Recuperación
                        {/if}
                    </button>
                </form>
            </div>
        {/if}
    </div>
</div>

<style>
    .auth-card {
        position: relative;
    }
    .success-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    .error-message {
      color: #e53e3e;
      background-color: rgba(229, 62, 62, 0.1);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 1rem;
      text-align: center;
    }
</style>