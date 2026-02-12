<script lang="ts">
    import { goto } from '$app/navigation';
    import { api } from '$lib/api';
    import { toast } from '$lib/stores/toast.svelte';
    import PasswordStrength from '$lib/components/ui/PasswordStrength.svelte';

    let name = $state('');
    let email = $state('');
    
    // Contraseñas
    let password = $state('');
    let confirmPassword = $state('');
    
    // Visibilidad
    let showPass = $state(false);
    let showConfirm = $state(false);

    // Validaciones
    let isPasswordValid = $state(false);
    let termsAccepted = $state(false);
    let isLoading = $state(false);

    async function handleRegister(e: Event) {
        e.preventDefault();
        
        if (!termsAccepted) { toast.error("Acepta los términos y condiciones."); return; }
        if (password !== confirmPassword) { toast.error("Las contraseñas no coinciden."); return; }
        if (!isPasswordValid) { toast.error("La contraseña es muy débil."); return; }
        
        isLoading = true;
        try {
            const res = await api.post('/auth/register', { name, email, password });
            if (res.success) {
                toast.success('¡Cuenta creada!');
                goto('/login');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error al registrarse.');
        } finally { isLoading = false; }
    }
</script>

<div class="auth-layout">
    <div class="auth-card">
        <a href="/" class="home-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>Inicio</span>
        </a>

        <div class="icon-header">🚀</div>
        <h1>Crear Cuenta</h1>
        <p class="subtitle">Únete a DUA-Conecta hoy mismo.</p>
        
        <form onsubmit={handleRegister}>
            <div class="form-group">
                <label for="name">Nombre Completo</label>
                <input type="text" id="name" bind:value={name} placeholder="Juan Pérez" required class="themed-input" />
            </div>
            
            <div class="form-group">
                <label for="email">Correo Electrónico</label>
                <input type="email" id="email" bind:value={email} placeholder="juan@ejemplo.com" required class="themed-input" />
            </div>
            
            <div class="form-group">
                <label for="password">Contraseña</label>
                <div class="input-wrapper">
                    <input 
                        type={showPass ? "text" : "password"} 
                        id="password" 
                        bind:value={password} 
                        placeholder="••••••••" 
                        required 
                        class="themed-input has-icon" 
                    />
                    <button type="button" class="eye-btn" onclick={() => showPass = !showPass} tabindex="-1">
                        {#if showPass}
                             <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        {:else}
                             <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M1 1l22 22"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path></svg>
                        {/if}
                    </button>
                </div>
                <PasswordStrength password={password} bind:isValid={isPasswordValid} />
            </div>

            <div class="form-group">
                <label for="confirm">Confirmar Contraseña</label>
                <div class="input-wrapper">
                    <input 
                        type={showConfirm ? "text" : "password"} 
                        id="confirm" 
                        bind:value={confirmPassword} 
                        placeholder="Repite la contraseña" 
                        required 
                        class="themed-input has-icon" 
                    />
                    <button type="button" class="eye-btn" onclick={() => showConfirm = !showConfirm} tabindex="-1">
                        {#if showConfirm}
                             <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        {:else}
                             <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M1 1l22 22"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path></svg>
                        {/if}
                    </button>
                </div>
            </div>
            
            <div class="terms-check">
                <input type="checkbox" id="terms" bind:checked={termsAccepted} />
                <label for="terms">Acepto los <a href="/legal/terminos">Términos y Condiciones</a></label>
            </div>
            
            <button type="submit" class="btn-primary" disabled={isLoading || !isPasswordValid || !termsAccepted || !confirmPassword}>
                {isLoading ? 'Registrando...' : 'Registrarse'}
            </button>
        </form>
        
        <div class="card-footer">
            <span class="footer-text">¿Ya tienes cuenta?</span>
            <a href="/login" class="action-link">Inicia sesión</a>
        </div>
    </div>
</div>

<style>
    /* Layout */
    .auth-layout { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: var(--bg-section); padding: 1rem; }
    .auth-card { background-color: var(--bg-card); padding: 2.5rem; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); width: 100%; max-width: 420px; text-align: center; border: 1px solid var(--border-color); position: relative; }
    
    /* Inicio Link */
    .home-link { position: absolute; top: 1.5rem; left: 1.5rem; display: flex; align-items: center; gap: 8px; color: var(--text-light); font-weight: 600; text-decoration: none; padding: 8px 12px; border-radius: 12px; background-color: var(--bg-section); }
    
    /* Header */
    .icon-header { font-size: 3rem; margin-bottom: 1rem; background-color: var(--bg-section); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin: 0 auto; border: 1px solid var(--border-color); margin-top: 1rem; }
    h1 { margin-bottom: 0.5rem; color: var(--text-dark); font-size: 1.8rem; font-weight: 800; }
    .subtitle { color: var(--text-light); margin-bottom: 2rem; font-size: 0.95rem; }
    
    /* Inputs */
    .form-group { margin-bottom: 1.2rem; text-align: left; }
    label { display: block; margin-bottom: 0.4rem; font-weight: 600; color: var(--text-dark); font-size: 0.9rem; }
    
    .input-wrapper { position: relative; width: 100%; display: flex; align-items: center; }
    .themed-input { width: 100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background-color: var(--bg-section); color: var(--text-dark); box-sizing: border-box; }
    .themed-input.has-icon { padding-right: 45px; } /* Espacio para el ojo */
    
    /* Botón Ojo */
    .eye-btn { position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: var(--text-light); display: flex; align-items: center; padding: 5px; }
    .eye-btn:hover { color: var(--primary-color); }

    /* Checkbox */
    .terms-check { display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem; text-align: left; font-size: 0.9rem; }
    .terms-check input { width: 18px; height: 18px; accent-color: var(--primary-color); cursor: pointer; }
    .terms-check a { color: var(--primary-color); text-decoration: none; font-weight: 600; }
    
    /* Submit */
    .btn-primary { width: 100%; padding: 14px; background-color: var(--primary-color); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; background-color: var(--border-color); color: #999; }
    
    /* Footer */
    .card-footer { margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; }
    .action-link { color: var(--primary-color); text-decoration: none; font-weight: 700; }

    @media (max-width: 480px) {
        .auth-card { padding: 1.5rem; }
        .home-link { position: relative; top: 0; left: 0; display: inline-flex; margin-bottom: 1rem; }
    }
</style>