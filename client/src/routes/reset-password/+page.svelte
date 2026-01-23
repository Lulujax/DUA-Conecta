<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { api } from '$lib/api';
    import { toast } from '$lib/stores/toast.svelte';
    import PasswordStrength from '$lib/components/ui/PasswordStrength.svelte';

    let token = $state('');
    let email = $state('');
    let newPassword = $state('');
    let isPasswordValid = $state(false);
    let isLoading = $state(false);
    let isInvalidLink = $state(false);

    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        token = urlParams.get('token') || '';
        email = urlParams.get('email') || '';
        if (!token || !email) { isInvalidLink = true; }
    });

    async function handleReset(e: Event) {
        e.preventDefault();
        if (!isPasswordValid) { toast.error("La contraseña debe ser segura."); return; }
        isLoading = true;
        try {
            const res = await api.post('/auth/reset-password-confirm', { email, code: token, newPassword });
            if (res.success) {
                toast.success('¡Éxito! Tu contraseña ha sido cambiada.');
                setTimeout(() => { goto('/login', { replaceState: true }); }, 1500);
            } else {
                if (res.error && res.error.includes('misma')) toast.error("⚠️ Error: Estás usando la misma contraseña anterior.");
                else toast.error(res.error || "Error desconocido.");
            }
        } catch (err: any) {
            const msg = err.message || '';
            if (msg.includes('misma')) toast.error("⚠️ No uses la misma contraseña anterior.");
            else { toast.error("El enlace ha caducado."); isInvalidLink = true; }
        } finally { isLoading = false; }
    }
</script>

<div class="auth-layout">
    <a href="/" class="home-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>Inicio</span>
    </a>

    <div class="auth-card">
        {#if isInvalidLink}
            <div class="icon-header error">⚠️</div>
            <h1>Enlace Caducado</h1>
            <p class="subtitle">Este enlace ya no es válido o está incompleto.</p>
            <a href="/forgot-password" class="btn-action">Solicitar nuevo enlace</a>
        {:else}
            <div class="icon-header">🔐</div>
            <h1>Nueva Contraseña</h1>
            <p class="subtitle">Seguridad para:</p>

            <form onsubmit={handleReset}>
                <div class="form-group">
                    <input type="email" value={email} readonly class="themed-input locked" title="Correo del enlace" />
                </div>
                <div class="form-group">
                    <label for="pass">Crea una contraseña segura</label>
                    <PasswordStrength bind:password={newPassword} bind:isValid={isPasswordValid} />
                </div>
                <button type="submit" class="btn-primary" disabled={isLoading || !isPasswordValid}>
                    {isLoading ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
            </form>
        {/if}
        
        <div class="card-footer">
            <a href="/login" class="back-link">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Volver al Login
            </a>
        </div>
    </div>
</div>

<style>
    /* Layout */
    .auth-layout { position: relative; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: var(--bg-section); padding: 1rem; }
    
    /* ESTILO BOTÓN INICIO (ESCRITORIO) */
    .home-link { position: absolute; top: 2rem; left: 2rem; display: flex; align-items: center; gap: 8px; color: var(--text-light); font-weight: 600; text-decoration: none; padding: 10px 16px; border-radius: 12px; transition: all 0.2s; z-index: 20; background-color: transparent; }
    .home-link:hover { background-color: var(--bg-card); color: var(--primary-color); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

    /* Tarjeta */
    .auth-card { background-color: var(--bg-card); padding: 2.5rem; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); width: 100%; max-width: 450px; text-align: center; border: 1px solid var(--border-color); position: relative; z-index: 10; }
    
    .icon-header { font-size: 3rem; margin-bottom: 1rem; background-color: var(--bg-section); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin: 0 auto; border: 1px solid var(--border-color); }
    .icon-header.error { background-color: rgba(220, 38, 38, 0.1); color: #dc2626; border-color: rgba(220, 38, 38, 0.2); }
    
    h1 { color: var(--text-dark); font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem; }
    .subtitle { color: var(--text-light); margin-bottom: 1rem; font-size: 1rem; }
    
    .form-group { margin-bottom: 1.5rem; text-align: left; }
    label { display: block; font-weight: 600; color: var(--text-dark); margin-bottom: 0.5rem; }
    
    .themed-input { width: 100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background-color: var(--bg-section); color: var(--text-dark); transition: all 0.2s; box-sizing: border-box; }
    .themed-input.locked { text-align: center; font-weight: 500; cursor: not-allowed; opacity: 0.7; background-color: var(--bg-section); border-color: var(--border-color); user-select: none; }
    
    .btn-primary { width: 100%; background-color: var(--primary-color); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(160, 132, 232, 0.2); }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-action { display: block; width: 100%; background-color: var(--text-dark); color: var(--bg-card); padding: 12px; text-decoration: none; border-radius: 10px; font-weight: 600; margin-top: 1rem; box-sizing: border-box; }
    
    .card-footer { margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; display: flex; justify-content: center; width: 100%; }
    .back-link { display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--text-light); text-decoration: none; font-weight: 600; font-size: 0.95rem; padding: 10px 20px; border-radius: 12px; transition: all 0.2s; }
    .back-link:hover { color: var(--primary-color); background-color: var(--bg-section); }

    /* --- SOLUCIÓN MÓVIL ANTI-CHOQUE --- */
    @media (max-width: 600px) {
        .auth-layout { 
            flex-direction: column; /* Apilar */
            justify-content: flex-start; /* Empezar desde arriba */
            padding-top: 2rem; 
        }
        
        .home-link { 
            position: relative; /* Dejar de flotar */
            top: auto; 
            left: auto; 
            margin-bottom: 1.5rem; /* Margen para empujar la tarjeta */
            align-self: flex-start; 
            background-color: var(--bg-card);
            border: 1px solid var(--border-color);
        }
    }
</style>