<script lang="ts">
    import { goto } from '$app/navigation';
    import { user } from '$lib/stores/auth';
    import { api } from '$lib/api';

    let isLoading = false;
    let passwordFieldType = 'password';
    let formError = '';
    let formData = { email: '', password: '' };

    function togglePasswordVisibility() {
        passwordFieldType = passwordFieldType === 'password' ? 'text' : 'password';
    }

    // CORRECCIÓN 1: Ahora recibimos el evento para prevenir la recarga
    async function handleSubmit(event: Event) {
        event.preventDefault(); // Prevenir recarga nativa
        
        isLoading = true;
        formError = '';

        try {
            const result = await api.post('/auth/login', formData);
            user.loginSuccess(result.user);
            await goto('/dashboard');
        } catch (error) {
             if (error instanceof Error) {
                formError = error.message;
            } else {
                formError = "Un error desconocido ocurrió."
            }
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Iniciar Sesión - DUA-Conecta</title>
</svelte:head>

<div class="auth-wrapper">
    <div class="auth-card">
        <a href="/" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <span>Volver al Inicio</span>
        </a>
        <h2>Bienvenido de Nuevo</h2>
        <p class="subtitle">Inicia sesión para continuar creando magia.</p>
        
        <form onsubmit={handleSubmit}>
            <div class="form-group">
                <label for="email">Correo Electrónico</label>
                <input type="email" id="email" name="email" required placeholder="tu@correo.com" bind:value={formData.email} />
            </div>
            <div class="form-group">
                <label for="password">Contraseña</label>
                <div class="password-group">
                    <input type={passwordFieldType} id="password" name="password" required placeholder="••••••••" bind:value={formData.password} />
                    <button type="button" class="password-toggle" onclick={togglePasswordVisibility} aria-label="Mostrar u ocultar contraseña">
                        {#if passwordFieldType === 'password'}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        {/if}
                    </button>
                </div>
            </div>

            <div class="forgot-password-link">
                <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
            </div>

            {#if formError}
                <p class="error-message" style="color: #e53e3e; background: rgba(229, 62, 62, 0.1); padding: 0.5rem; border-radius: 8px; margin-bottom: 1rem;">{formError}</p>
            {/if}
            
            <button type="submit" class="btn-primary" disabled={isLoading}>
                {#if isLoading}
                    <div class="spinner"></div>
                {:else}
                    Iniciar Sesión
                {/if}
            </button>
        </form>
        <div class="switch-link">
            <p>¿No tienes una cuenta? <a href="/register">Regístrate</a></p>
        </div>
    </div>
</div>

<style>
    .auth-card { position: relative; }
</style>