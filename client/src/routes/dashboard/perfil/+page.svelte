<script lang="ts">
    import { user } from '$lib/stores/auth';
    import { PUBLIC_API_URL } from '$env/static/public';
    let currentUser = { name: '', email: '', token: '' };
    user.subscribe(value => {
        if (value) {
            currentUser = value;
        }
    });

    let isLoading = false;
    // --- Estas variables controlan el mensaje que ve el usuario ---
    let formMessage = '';
    let messageType = 'success'; // puede ser 'success' o 'error'
    
    let oldPasswordFieldType = 'password';
    let newPasswordFieldType = 'password';
    let formData = {
        currentPassword: '',
        newPassword: ''
    };

    function toggleOldPassword() { oldPasswordFieldType = oldPasswordFieldType === 'password' ? 'text' : 'password'; }
    function toggleNewPassword() { newPasswordFieldType = newPasswordFieldType === 'password' ? 'text' : 'password'; }

    async function handleChangePassword() {
        isLoading = true;
        formMessage = ''; // Limpiamos el mensaje anterior

        try {
            const response = await fetch('${PUBLIC_API_URL}/api/user/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ocurrió un error.');
            }

            // <-- ASÍ FUNCIONA (1/3): Si la respuesta es exitosa, preparamos el mensaje.
            messageType = 'success';
            formMessage = result.message; // Guardamos el mensaje "Contraseña actualizada con éxito."
            
            // Limpiamos los campos del formulario
            formData.currentPassword = '';
            formData.newPassword = '';

        } catch (error) {
            // Si hay un error, también lo mostramos
            messageType = 'error';
            formMessage = error.message;
        } finally {
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Mi Perfil - DUA-Conecta</title>
</svelte:head>

<main>
    <div class="library-header">
        <h1>Gestiona tu Perfil</h1>
        <p>Aquí puedes ver tus datos y mantener tu cuenta segura.</p>
    </div>

    <div class="profile-card">
        <h3>Información de la Cuenta</h3>
        <div class="info-group">
            <label>Nombre Completo</label>
            <p>{currentUser.name}</p>
        </div>
        <div class="info-group">
            <label>Correo Electrónico</label>
            <p>{currentUser.email}</p>
        </div>
    </div>

    <div class="profile-card">
        <h3>Cambiar Contraseña</h3>
        <form on:submit|preventDefault={handleChangePassword}>
            <div class="form-group">
                <label for="current-password">Contraseña Actual</label>
                <div class="password-group">
                    <input type={oldPasswordFieldType} id="current-password" required placeholder="••••••••" bind:value={formData.currentPassword} />
                    <button type="button" class="password-toggle" on:click={toggleOldPassword}>
                        {#if oldPasswordFieldType === 'password'}<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>{/if}
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label for="new-password">Nueva Contraseña</label>
                <div class="password-group">
                    <input type={newPasswordFieldType} id="new-password" required placeholder="Mínimo 8 caracteres" bind:value={formData.newPassword} />
                    <button type="button" class="password-toggle" on:click={toggleNewPassword}>
                         {#if newPasswordFieldType === 'password'}<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>{/if}
                    </button>
                </div>
            </div>
            
            {#if formMessage}
                <p class="form-message {messageType}">{formMessage}</p>
            {/if}

            <button type="submit" class="btn-primary" disabled={isLoading}>
                {#if isLoading}
                    <div class="spinner"></div>
                {:else}
                    Actualizar Contraseña
                {/if}
            </button>
        </form>
    </div>
</main>

<style>
    main { max-width: 1200px; margin: 0 auto; padding: 4rem 1.5rem; }
    /* <-- ASÍ FUNCIONA (3/3): Estos estilos le dan el color verde al mensaje de éxito. */
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