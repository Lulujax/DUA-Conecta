<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
    import { toast } from '$lib/stores/toast.svelte';
    import PasswordStrength from '$lib/components/ui/PasswordStrength.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
    let isPasswordValid = $state(false);
	let isLoading = $state(false);

	async function handleRegister(e: Event) {
		e.preventDefault();
        if (!isPasswordValid) { toast.error("Tu contraseña debe ser segura."); return; }
		isLoading = true;
		try {
			const res = await api.post('/auth/register', { name, email, password });
			if (res.success) {
                toast.success('¡Cuenta creada! Ya puedes entrar.');
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
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
                <PasswordStrength bind:password bind:isValid={isPasswordValid} />
			</div>
			
			<button type="submit" class="btn-primary" disabled={isLoading || !isPasswordValid}>
				{isLoading ? 'Registrando...' : 'Registrarse'}
			</button>
		</form>
		
        <div class="card-footer">
            <span class="footer-text">¿Ya tienes cuenta?</span>
            <a href="/login" class="action-link">Inicia sesión aquí</a>
        </div>
	</div>
</div>

<style>
	.auth-layout { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: var(--bg-section); padding: 1rem; }
    .auth-card { background-color: var(--bg-card); padding: 2.5rem; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); width: 100%; max-width: 420px; text-align: center; border: 1px solid var(--border-color); position: relative; }

    /* ESTILO BOTÓN INICIO */
    .home-link { position: absolute; top: 1.5rem; left: 1.5rem; display: flex; align-items: center; gap: 8px; color: var(--text-light); font-weight: 600; text-decoration: none; padding: 8px 12px; border-radius: 12px; transition: all 0.2s; z-index: 10; background-color: var(--bg-section); }
    .home-link:hover { color: var(--primary-color); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

    .icon-header { font-size: 3rem; margin-bottom: 1rem; background-color: var(--bg-section); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin: 0 auto; border: 1px solid var(--border-color); margin-top: 1rem; }
	
	h1 { margin-bottom: 0.5rem; color: var(--text-dark); font-size: 1.8rem; font-weight: 800; }
	.subtitle { color: var(--text-light); margin-bottom: 2rem; font-size: 0.95rem; }
    
	.form-group { margin-bottom: 1.5rem; text-align: left; }
	label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--text-dark); font-size: 0.9rem; }
    
	.themed-input { width: 100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background-color: var(--bg-section); color: var(--text-dark); transition: all 0.2s; box-sizing: border-box; }
	.themed-input:focus { border-color: var(--primary-color); outline: none; background-color: var(--bg-card); box-shadow: 0 0 0 3px rgba(160, 132, 232, 0.2); }
	
	.btn-primary { width: 100%; padding: 14px; background-color: var(--primary-color); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
	.btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	
    .card-footer { margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; display: flex; justify-content: center; align-items: center; gap: 6px; width: 100%; }
    .footer-text { color: var(--text-light); font-size: 0.95rem; }
    .action-link { color: var(--primary-color); text-decoration: none; font-weight: 700; font-size: 0.95rem; }
    .action-link:hover { text-decoration: underline; }

    /* --- SOLUCIÓN MÓVIL --- */
    @media (max-width: 480px) {
        .auth-layout { align-items: flex-start; padding-top: 2rem; }
        .auth-card { padding: 1.5rem; }
        .home-link { position: relative; top: auto; left: auto; display: inline-flex; margin-bottom: 1.5rem; align-self: flex-start; background: none; padding: 0; }
        .icon-header { margin-top: 0; }
    }
</style>