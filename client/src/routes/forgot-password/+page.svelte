<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { api } from '$lib/api';
    import { toast } from '$lib/stores/toast.svelte';
    import PasswordStrength from '$lib/components/ui/PasswordStrength.svelte';

    let step = $state(1);
    let token = $state('');
    let email = $state('');
    let newPassword = $state('');
    let isPasswordValid = $state(false);
    let isLoading = $state(false);
    let isSent = $state(false);
    let isResetMode = $state(false);

    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const t = urlParams.get('token');
        const e = urlParams.get('email');
        if (t && e) { token = t; email = e; isResetMode = true; }
    });

    async function handleSendLink(e: Event) {
        e.preventDefault();
        if (!email) return;
        isLoading = true;
        try {
            const res = await api.post('/auth/forgot-password', { email });
            if (res.success) { isSent = true; toast.success('¡Correo enviado!'); }
        } catch (err: any) { toast.error(err.message || 'Error al enviar.'); } 
        finally { isLoading = false; }
    }

    async function handleReset(e: Event) {
        e.preventDefault();
        if (!isPasswordValid) return;
        isLoading = true;
        try {
            const res = await api.post('/auth/reset-password-confirm', { email, code: token, newPassword });
            if (res.success) {
                toast.success('¡Listo! Redirigiendo...');
                setTimeout(() => goto('/login', { replaceState: true }), 1500);
            } else { toast.error(res.error || "Error."); }
        } catch (err: any) {
            const msg = err.message || '';
            if (msg.includes('misma')) toast.error("⚠️ No uses la misma contraseña.");
            else toast.error("Enlace caducado.");
        } finally { isLoading = false; }
    }
</script>

<div class="auth-layout">
    <a href="/" class="home-link">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
        <span>Inicio</span>
    </a>

    <div class="auth-card">
        {#if isResetMode}
            <div class="icon-header">🔐</div>
            <h1>Nueva Contraseña</h1>
            <p class="subtitle">Seguridad para: <strong>{email}</strong></p>
            <form onsubmit={handleReset}>
                <div class="form-group">
                    <label for="pass">Define tu nueva clave</label>
                    <PasswordStrength bind:password={newPassword} bind:isValid={isPasswordValid} />
                </div>
                <button type="submit" class="btn-primary" disabled={isLoading || !isPasswordValid}>
                    {isLoading ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
            </form>
        {:else if !isSent}
            <div class="icon-header">📬</div>
            <h1>Recuperar Acceso</h1>
            <p class="subtitle">Ingresa tu correo y te enviaremos un enlace mágico.</p>
            <form onsubmit={handleSendLink}>
                <div class="form-group">
                    <label for="email">Correo Electrónico</label>
                    <input type="email" id="email" bind:value={email} placeholder="tu@email.com" required class="themed-input" />
                </div>
                <button type="submit" class="btn-primary" disabled={isLoading || !email}>
                    {isLoading ? 'Enviando...' : 'Enviar Enlace'}
                </button>
            </form>
        {:else}
            <div class="icon-header success">✓</div>
            <h1>¡Correo Enviado!</h1>
            <p class="subtitle">Revisa tu bandeja de entrada en <strong>{email}</strong>.</p>
            <p class="small-text">Puedes cerrar esta pestaña.</p>
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
    /* Layout base */
    .auth-layout { position: relative; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: var(--bg-section); padding: 1rem; }
    
    /* ESTILO BOTÓN INICIO (ESCRITORIO) */
    .home-link { 
        position: absolute; 
        top: 2rem; 
        left: 2rem; 
        display: flex; 
        align-items: center; 
        gap: 8px; 
        color: var(--text-light); 
        font-weight: 600; 
        text-decoration: none; 
        padding: 10px 16px; 
        border-radius: 12px; 
        transition: all 0.2s; 
        z-index: 20; /* Z-index alto para estar encima */
        background-color: transparent; /* Transparente en PC */
    }
    .home-link:hover { background-color: var(--bg-card); color: var(--primary-color); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

    /* Tarjeta */
    .auth-card { background-color: var(--bg-card); padding: 2.5rem; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); width: 100%; max-width: 420px; text-align: center; border: 1px solid var(--border-color); position: relative; z-index: 10; }
    
    .icon-header { font-size: 3rem; margin-bottom: 1rem; background-color: var(--bg-section); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin: 0 auto; border: 1px solid var(--border-color); }
    .icon-header.success { color: #16a34a; background-color: rgba(22, 163, 74, 0.1); border-color: rgba(22, 163, 74, 0.2); }
    
    h1 { color: var(--text-dark); font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem; }
    .subtitle { color: var(--text-light); margin-bottom: 1.5rem; font-size: 0.95rem; }
    
    .form-group { margin-bottom: 1.5rem; text-align: left; }
    label { display: block; font-weight: 600; color: var(--text-dark); margin-bottom: 0.5rem; }
    
    .themed-input { width: 100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background-color: var(--bg-section); color: var(--text-dark); transition: all 0.2s; box-sizing: border-box; }
    .themed-input:focus { border-color: var(--primary-color); outline: none; background-color: var(--bg-card); box-shadow: 0 0 0 3px rgba(160, 132, 232, 0.2); }
    
    .btn-primary { width: 100%; padding: 14px; background-color: var(--primary-color); color: white; border: none; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(160, 132, 232, 0.2); }
    .btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .small-text { font-size: 0.85rem; color: var(--text-light); }
    
    .card-footer { margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; display: flex; justify-content: center; width: 100%; }
    .back-link { display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--text-light); text-decoration: none; font-weight: 600; font-size: 0.95rem; padding: 10px 20px; border-radius: 12px; transition: all 0.2s; }
    .back-link:hover { color: var(--primary-color); background-color: var(--bg-section); }

    /* --- MAGIA PARA MÓVILES (Anti-Choque) --- */
    @media (max-width: 600px) {
        .auth-layout { 
            flex-direction: column; /* Apilar verticalmente */
            justify-content: flex-start; 
            padding-top: 2rem; 
        }
        
        .home-link { 
            position: relative; /* YA NO FLOTA */
            top: auto; 
            left: auto; 
            margin-bottom: 1.5rem; /* Empuja la tarjeta hacia abajo */
            align-self: flex-start; /* Se pega a la izquierda */
            background-color: var(--bg-card); /* Fondo sólido por si acaso */
            border: 1px solid var(--border-color);
        }

        .auth-card {
            margin-top: 0; /* Limpio */
        }
    }
</style>