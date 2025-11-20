<script lang="ts">
    import { goto } from '$app/navigation';
    import { PUBLIC_API_URL } from '$env/static/public';

    let isLoading = false;
    let passwordFieldType = 'password';
    let confirmPasswordFieldType = 'password';
    let formError = '';
    
    // NUEVO: Estado del checkbox legal
    let acceptedTerms = false;

    let formData = {
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    };

    function togglePasswordVisibility() {
        passwordFieldType = passwordFieldType === 'password' ? 'text' : 'password';
    }
    
    function toggleConfirmPasswordVisibility() {
        confirmPasswordFieldType = confirmPasswordFieldType === 'password' ? 'text' : 'password';
    }

    async function handleSubmit() {
        // VALIDACIÓN PREVIA
        if (!acceptedTerms) {
            formError = 'Debes aceptar los Términos y Condiciones para continuar.';
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            formError = 'Las contraseñas no coinciden.';
            return;
        }

        isLoading = true;
        formError = '';

        try {
            const response = await fetch(`${PUBLIC_API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            if (!response.headers.get('content-type')?.includes('application/json')) {
                throw new Error(`Respuesta inesperada. Código: ${response.status}`);
            }
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al registrar.');
            }

            alert('¡Registro exitoso! Por favor, inicia sesión.');
            await goto('/login');

        } catch (error) {
            if (error instanceof Error) {
                formError = error.message;
            } else {
                formError = "Error desconocido."
            }
        } finally {
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
                     <button type="button" class="password-toggle" on:click={togglePasswordVisibility}>
                        {#if passwordFieldType === 'password'}<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>{/if}
                    </button>
                </div>
            </div>
             <div class="form-group">
                <label for="confirm-password">Confirmar Contraseña</label>
                <div class="password-group">
                    <input type={confirmPasswordFieldType} id="confirm-password" name="confirm-password" required placeholder="Repite tu contraseña" bind:value={formData.confirmPassword} />
                     <button type="button" class="password-toggle" on:click={toggleConfirmPasswordVisibility}>
                         {#if confirmPasswordFieldType === 'password'}<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>{/if}
                    </button>
                </div>
            </div>

            <div class="terms-group">
                <input type="checkbox" id="terms" bind:checked={acceptedTerms} />
                <label for="terms">
                    He leído y acepto los <a href="/legal/terminos" target="_blank">Términos</a> y la <a href="/legal/privacidad" target="_blank">Política de Privacidad</a>.
                </label>
            </div>

            {#if formError}
                 <p class="error-message">{formError}</p>
            {/if}

            <button type="submit" class="btn-primary" disabled={isLoading || !acceptedTerms}>
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
    .auth-card { position: relative; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 24px; padding: 2.5rem; width: 100%; max-width: 450px; text-align: center; box-shadow: 0 10px 30px rgba(160,132,232,.1); }
    .auth-wrapper { display: flex; justify-content: center; align-items: flex-start; padding: 6rem 1.5rem; min-height: 80vh; }
    .back-link { position: absolute; top: 1.5rem; left: 1.5rem; display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: var(--text-light); font-weight: 600; font-size: .9rem; transition: color .3s ease; }
    .back-link:hover { color: var(--primary-color); }
    h2 { font-size: 2rem; font-weight: 800; color: var(--text-dark); margin: 0 0 .5rem 0; }
    .subtitle { color: var(--text-light); margin-bottom: 2.5rem; }
    .form-group { text-align: left; margin-bottom: 1.5rem; }
    .form-group label { display: block; font-weight: 600; margin-bottom: .5rem; font-size: .9rem; color: var(--text-dark); }
    .form-group input { width: 100%; padding: .9rem 1rem; border-radius: 12px; border: 1px solid var(--border-color); background-color: var(--bg-section); font-size: 1rem; color: var(--text-dark); }
    .password-group { position: relative; }
    .password-group input { padding-right: 3rem; }
    .password-toggle { position: absolute; top: 50%; right: .5rem; transform: translateY(-50%); background: 0 0; border: none; cursor: pointer; color: var(--text-light); }
    .btn-primary { width: 100%; padding: .9rem; font-size: 1rem; margin-top: 1rem; border-radius: 50px; background: linear-gradient(45deg, var(--primary-color), var(--primary-hover)); color: white; border: none; font-weight: 700; cursor: pointer; transition: opacity 0.3s; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .error-message { color: #e53e3e; background: rgba(229, 62, 62, 0.1); padding: 0.5rem; border-radius: 8px; margin-bottom: 1rem; }
    .switch-link { margin-top: 2rem; font-size: .9rem; color: var(--text-light); }
    .switch-link a { color: var(--primary-color); font-weight: 600; text-decoration: none; }

    /* Estilos del Checkbox Legal */
    .terms-group { display: flex; align-items: flex-start; gap: 0.8rem; text-align: left; margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--text-light); }
    .terms-group input { margin-top: 0.25rem; cursor: pointer; width: 16px; height: 16px; accent-color: var(--primary-color); }
    .terms-group a { color: var(--primary-color); text-decoration: underline; }
</style>