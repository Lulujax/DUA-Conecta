<script lang="ts">
    import { user } from '$lib/stores/auth';
    import { api } from '$lib/api';
    import { toast } from '$lib/stores/toast.svelte';
    import PasswordStrength from '$lib/components/ui/PasswordStrength.svelte';

    let currentPassword = $state('');
    let newPassword = $state('');
    let isNewPasswordValid = $state(false);
    let isSavingPass = $state(false);

    async function handleChangePassword(e: Event) {
        e.preventDefault();
        
        // 1. Validación local visual
        if (!isNewPasswordValid) {
            toast.error("La contraseña nueva debe tener la barra en verde.");
            return;
        }

        // 2. Validación rápida de igualdad (Frontend)
        if (currentPassword === newPassword) {
            toast.error("⚠️ La nueva contraseña NO puede ser igual a la actual.");
            return;
        }

        isSavingPass = true;
        try {
            const res = await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });

            // 3. Manejo de Respuestas del Servidor
            if (res.success) {
                toast.success("✅ ¡Contraseña cambiada con éxito!");
                currentPassword = '';
                newPassword = '';
            } else {
                // Manejo específico de errores
                if (res.code === 'misma') {
                    toast.error("⚠️ Error: Estás poniendo la misma contraseña de antes.");
                } else if (res.code === 'incorrecta') {
                    toast.error("❌ Error: La contraseña actual no es correcta.");
                } else {
                    toast.error(res.error || "Error desconocido al actualizar.");
                }
            }
        } catch (err: any) {
            // Error de red o 500
            toast.error("Error de conexión con el servidor.");
        } finally {
            isSavingPass = false;
        }
    }
</script>

<svelte:head>
    <title>Mi Perfil - DUA-Conecta</title>
</svelte:head>

<div class="profile-container">
    <header class="header">
        <h1>Mi Perfil</h1>
        <p>Administra tu información personal y seguridad.</p>
    </header>

    <div class="grid-layout">
        <div class="card info-card">
            <div class="avatar-circle">
                {$user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2>{$user?.name || 'Usuario'}</h2>
            
            {#if $user?.email}
                <p class="email">{$user.email}</p>
            {:else}
                <p class="email loading">Cargando correo...</p>
            {/if}
            
            <div class="badge">Cuenta Gratuita</div>
        </div>

        <div class="card security-card">
            <h3>🔐 Seguridad de la Cuenta</h3>
            <p class="card-desc">Actualiza tu contraseña para mantener tu cuenta segura.</p>
            
            <form onsubmit={handleChangePassword} class="security-form">
                <div class="form-group">
                    <label for="currentPass">Contraseña Actual</label>
                    <input 
                        type="password" 
                        id="currentPass" 
                        bind:value={currentPassword} 
                        placeholder="Tu contraseña actual" 
                        required 
                    />
                </div>

                <div class="form-group">
                    <label for="newPass">Nueva Contraseña</label>
                    <PasswordStrength bind:password={newPassword} bind:isValid={isNewPasswordValid} />
                </div>

                <button type="submit" class="btn-save" disabled={isSavingPass || !isNewPasswordValid || !currentPassword}>
                    {#if isSavingPass}
                        Guardando...
                    {:else}
                        Actualizar Contraseña
                    {/if}
                </button>
            </form>
        </div>
    </div>
</div>

<style>
    .profile-container { max-width: 1000px; margin: 0 auto; padding: 3rem 1.5rem; }
    .header { text-align: center; margin-bottom: 3rem; }
    h1 { font-size: 2.5rem; font-weight: 800; color: var(--text-dark); margin-bottom: 0.5rem; }
    .header p { color: var(--text-light); font-size: 1.1rem; }

    .grid-layout { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; align-items: start; }
    .card { background: white; border: 1px solid var(--border-color); border-radius: 20px; padding: 2rem; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
    
    .info-card { text-align: center; display: flex; flex-direction: column; align-items: center; }
    .avatar-circle { width: 100px; height: 100px; background: linear-gradient(135deg, #A084E8, #8b6fd0); color: white; font-size: 3rem; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; box-shadow: 0 10px 20px rgba(160, 132, 232, 0.3); }
    .info-card h2 { font-size: 1.5rem; color: var(--text-dark); margin-bottom: 0.2rem; }
    .email { color: var(--text-light); margin-bottom: 1rem; font-weight: 500; }
    .email.loading { color: #9ca3af; font-style: italic; }
    .badge { background: #f3f4f6; color: var(--text-dark); padding: 6px 16px; border-radius: 50px; font-size: 0.85rem; font-weight: 600; border: 1px solid #e5e7eb; }

    .security-card h3 { font-size: 1.25rem; font-weight: 700; color: var(--text-dark); margin-bottom: 0.5rem; }
    .card-desc { color: var(--text-light); font-size: 0.95rem; margin-bottom: 2rem; line-height: 1.5; }
    
    .form-group { margin-bottom: 1.5rem; }
    label { display: block; font-weight: 600; color: var(--text-dark); margin-bottom: 0.5rem; font-size: 0.9rem; }
    
    input[type="password"] { width: 100%; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 1rem; transition: all 0.2s; box-sizing: border-box; }
    input:focus { border-color: var(--primary-color); outline: none; box-shadow: 0 0 0 3px rgba(160, 132, 232, 0.2); }

    .btn-save { width: 100%; background: var(--primary-color); color: white; border: none; padding: 14px; border-radius: 10px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s; }
    .btn-save:hover:not(:disabled) { background: #8b6fd0; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(160, 132, 232, 0.2); }
    .btn-save:disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; }

    @media (max-width: 768px) {
        .grid-layout { grid-template-columns: 1fr; }
        .info-card { margin-bottom: 1rem; }
    }
</style>