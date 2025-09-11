<script lang="ts">
    import { goto } from '$app/navigation';

    // --- ESTADO DEL COMPONENTE ---
    let isLoading = false;
    let passwordFieldType = 'password';
    let confirmPasswordFieldType = 'password';
    let formError = ''; // Variable para guardar mensajes de error
    let formData = {
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    };

    // --- FUNCIONES ---
    function togglePasswordVisibility() {
        passwordFieldType = passwordFieldType === 'password' ? 'text' : 'password';
    }
    
    function toggleConfirmPasswordVisibility() {
        confirmPasswordFieldType = confirmPasswordFieldType === 'password' ? 'text' : 'password';
    }

    // --- LÓGICA DE ENVÍO DEL FORMULARIO ---
    async function handleSubmit() {
        isLoading = true;
        formError = ''; // Resetea el error en cada intento

        // 1. Validación simple en el frontend
        if (formData.password !== formData.confirmPassword) {
            formError = 'Las contraseñas no coinciden.';
            isLoading = false;
            return; // Detiene el envío
        }

        try {
            // 2. Enviamos los datos al backend usando fetch
            const response = await fetch('http://localhost:3000/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const result = await response.json();

            // 3. Manejamos la respuesta del servidor
            if (!response.ok) {
                // Si el servidor responde con un error (ej: email ya existe), lo mostramos
                throw new Error(result.error || 'Ocurrió un error al registrar el usuario.');
            }

            // 4. Si todo salió bien, redirigimos al dashboard
            await goto('/dashboard');

        } catch (error) {
            // Si hay un error en la comunicación o del servidor, lo mostramos
            formError = error.message;
        } finally {
            // Pase lo que pase, detenemos la animación de carga
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Registro - DUA-Conecta</title>
</svelte:head>

<div class="auth-wrapper">
    <div class="auth-card">
         <a href="/" class="back-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <span>Volver al Inicio</span>
        </a>

        <h2>Crea tu Cuenta</h2>
        <p class="subtitle">Únete a la comunidad y empieza a transformar la educación.</p>
        
        <form on:submit|preventDefault={handleSubmit}>
            <div class="form-group">
                <label for="name">Nombre Completo</label>
                <input type="text" id="name" name="name" required placeholder="Tu Nombre y Apellido" bind:value={formData.name} />
            </div>
            <div class="form-group">
                <label for="email">Correo Electrónico</label>
                <input type="email" id="email" name="email" required placeholder="tu@correo.com" bind:value={formData.email} />
            </div>
            <div class="form-group">
                <label for="password">Contraseña</label>
                <div class="password-group">
                    <input type={passwordFieldType} id="password" name="password" required placeholder="Mínimo 8 caracteres" bind:value={formData.password} />
                     <button type="button" class="password-toggle" on:click={togglePasswordVisibility} aria-label="Mostrar u ocultar contraseña">
                        {#if passwordFieldType === 'password'}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        {/if}
                    </button>
                </div>
            </div>
             <div class="form-group">
                <label for="confirm-password">Confirmar Contraseña</label>
                <div class="password-group">
                    <input type={confirmPasswordFieldType} id="confirm-password" name="confirm-password" required placeholder="Repite tu contraseña" bind:value={formData.confirmPassword} />
                     <button type="button" class="password-toggle" on:click={toggleConfirmPasswordVisibility} aria-label="Mostrar u ocultar contraseña">
                        {#if confirmPasswordFieldType === 'password'}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        {:else}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                        {/if}
                    </button>
                </div>
            </div>

            {#if formError}
                <p class="error-message">{formError}</p>
            {/if}

            <button type="submit" class="btn-primary" disabled={isLoading}>
                {#if isLoading}
                    <div class="spinner"></div>
                {:else}
                    Crear Cuenta
                {/if}
            </button>
        </form>

        <div class="switch-link">
            <p>¿Ya tienes una cuenta? <a href="/login">Inicia Sesión</a></p>
        </div>
    </div>
</div>

<style>
    .auth-card {
        position: relative;
    }
</style>