<script lang="ts">
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { PUBLIC_API_URL } from '$env/static/public';

    let newPassword = '';
    let confirmPassword = '';
    let message = '';
    let isSuccess = false;
    let isLoading = false;

    // Capturamos el token de la URL (ej: ?token=abc123...)
    const token = $page.url.searchParams.get('token');

    async function handleReset() {
        if (!token) {
            message = "Error: El enlace no es válido o no tiene token.";
            return;
        }
        if (newPassword.length < 8) {
            message = "La contraseña debe tener al menos 8 caracteres.";
            return;
        }
        if (newPassword !== confirmPassword) {
            message = "Las contraseñas no coinciden.";
            return;
        }

        isLoading = true;
        message = '';

        try {
            const response = await fetch(`${PUBLIC_API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al restablecer.');
            }

            isSuccess = true;
            message = "¡Contraseña actualizada! Redirigiendo...";
            setTimeout(() => goto('/login'), 3000);

        } catch (error: any) {
            isSuccess = false;
            message = error.message || "Error desconocido.";
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Nueva Contraseña - DUA-Conecta</title>
</svelte:head>

<div class="auth-wrapper">
    <div class="auth-card">
        <h2>Restablecer Contraseña</h2>
        <p class="subtitle">Ingresa tu nueva contraseña a continuación.</p>

        {#if !token}
            <p class="error-message">Enlace inválido. Por favor solicita uno nuevo.</p>
            <a href="/forgot-password" class="btn-secondary">Solicitar enlace</a>
        {:else}
            <form on:submit|preventDefault={handleReset}>
                <div class="form-group">
                    <label for="new-pass">Nueva Contraseña</label>
                    <input type="password" id="new-pass" placeholder="Mínimo 8 caracteres" required bind:value={newPassword} />
                </div>
                <div class="form-group">
                    <label for="confirm-pass">Confirmar Contraseña</label>
                    <input type="password" id="confirm-pass" placeholder="Repite la contraseña" required bind:value={confirmPassword} />
                </div>

                {#if message}
                    <div class="message" class:success={isSuccess} class:error={!isSuccess}>
                        {message}
                    </div>
                {/if}

                <button type="submit" class="btn-primary" disabled={isLoading || isSuccess}>
                    {isLoading ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
            </form>
        {/if}
    </div>
</div>

<style>
    /* Reutilizamos estilos de auth para consistencia */
    .auth-wrapper { display: flex; justify-content: center; align-items: center; min-height: 80vh; padding: 1.5rem; }
    .auth-card { background: var(--bg-card); padding: 2.5rem; border-radius: 24px; width: 100%; max-width: 450px; text-align: center; border: 1px solid var(--border-color); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    h2 { font-size: 1.8rem; margin-bottom: 0.5rem; color: var(--text-dark); }
    .subtitle { color: var(--text-light); margin-bottom: 2rem; }
    .form-group { text-align: left; margin-bottom: 1rem; }
    label { display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-dark); }
    input { width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-section); }
    .btn-primary { width: 100%; padding: 0.9rem; border-radius: 50px; background: var(--primary-color); color: white; border: none; font-weight: 700; cursor: pointer; margin-top: 1rem; }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-secondary { display: inline-block; text-decoration: none; color: var(--primary-color); font-weight: bold; margin-top: 1rem; }
    
    .message { padding: 0.8rem; border-radius: 8px; margin-top: 1rem; font-size: 0.9rem; font-weight: 600; }
    .message.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .message.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .error-message { color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; }
</style>