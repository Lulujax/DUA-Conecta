<script lang="ts">
    import { goto } from '$app/navigation';
    import { user } from '$lib/stores/auth';

    let isLoading = false;
    let passwordFieldType = 'password';
    let formError = '';
    let formData = { email: '', password: '' };

    function togglePasswordVisibility() {
        passwordFieldType = passwordFieldType === 'password' ? 'text' : 'password';
    }

    async function handleSubmit() {
        isLoading = true;
        formError = '';

        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ocurrió un error al iniciar sesión.');
            }

            // <-- CAMBIO CLAVE: Guardamos el token y los datos del usuario
            user.set({
                token: result.token,
                name: result.user.name,
                email: result.user.email
            });

            await goto('/dashboard');

        } catch (error) {
            formError = error.message;
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
        <form on:submit|preventDefault={handleSubmit}>
            <div class="form-group">
                <label for="email">Correo Electrónico</label>
                <input type="email" id="email" name="email" required placeholder="tu@correo.com" bind:value={formData.email} />
            </div>
            <div class="form-group">
                <label for="password">Contraseña</label>
                <div class="password-group">
                    <input type={passwordFieldType} id="password" name="password" required placeholder="••••••••" bind:value={formData.password} />
                    <button type="button" class="password-toggle" on:click={togglePasswordVisibility} aria-label="Mostrar u ocultar contraseña">
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
                <p class="error-message">{formError}</p>
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