<script lang="ts">
	import { goto } from '$app/navigation';
	import { api } from '$lib/api';
    import { toast } from '$lib/stores/toast.svelte';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		isLoading = true;
		try {
			const res = await api.post('/auth/login', { email, password });
			if (res.success) {
                toast.success(`Bienvenido, ${res.user.name}`);
				goto('/dashboard/plantillas');
			}
		} catch (err: any) {
            toast.error(err.message || 'Credenciales incorrectas');
		} finally { isLoading = false; }
	}
</script>

<div class="auth-layout">
	<div class="auth-card">
        <a href="/" class="home-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            <span>Inicio</span>
        </a>

        <div class="icon-header">👋</div>
		<h1>Iniciar Sesión</h1>
		<p class="subtitle">Ingresa para continuar creando.</p>
		
		<form onsubmit={handleLogin}>
			<div class="form-group">
				<label for="email">Correo Electrónico</label>
				<input type="email" id="email" bind:value={email} placeholder="tu@email.com" required class="themed-input" />
			</div>
			
			<div class="form-group">
				<div class="label-row">
                    <label for="password">Contraseña</label>
                    <a href="/forgot-password" class="forgot-link">¿Olvidaste tu contraseña?</a>
                </div>
				<input type="password" id="password" bind:value={password} placeholder="••••••••" required class="themed-input" />
			</div>
			
			<button type="submit" class="btn-primary" disabled={isLoading}>
				{isLoading ? 'Entrando...' : 'Entrar'}
			</button>
		</form>
		
        <div class="card-footer">
            <span class="footer-text">¿No tienes cuenta?</span>
            <a href="/register" class="action-link">Regístrate aquí</a>
        </div>
	</div>
</div>

<style>
    /* Layout */
	.auth-layout { display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: var(--bg-section); padding: 1rem; }
    .auth-card { background-color: var(--bg-card); padding: 2.5rem; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); width: 100%; max-width: 420px; text-align: center; border: 1px solid var(--border-color); position: relative; /* Necesario para el botón absoluto */ }

    /* ESTILO DEL BOTÓN INICIO (Versión Escritorio: Absoluto) */
    .home-link {
        position: absolute;
        top: 1.5rem;
        left: 1.5rem;
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-light);
        font-weight: 600;
        text-decoration: none;
        padding: 8px 12px;
        border-radius: 12px;
        transition: all 0.2s;
        z-index: 10;
        background-color: var(--bg-section); /* Fondo para que se note */
    }
    .home-link:hover { color: var(--primary-color); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    
    .icon-header { font-size: 3rem; margin-bottom: 1rem; background-color: var(--bg-section); width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; border-radius: 50%; margin: 0 auto; border: 1px solid var(--border-color); margin-top: 1rem; /* Espacio extra arriba */ }
	
    h1 { margin-bottom: 0.5rem; color: var(--text-dark); font-size: 1.8rem; font-weight: 800; }
	.subtitle { color: var(--text-light); margin-bottom: 2rem; font-size: 0.95rem; }
	
    .form-group { margin-bottom: 1.5rem; text-align: left; }
    .label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
	label { font-weight: 600; color: var(--text-dark); font-size: 0.9rem; }
    .forgot-link { color: var(--primary-color); font-size: 0.85rem; text-decoration: none; font-weight: 600; }
    .forgot-link:hover { text-decoration: underline; }
    
	.themed-input { width: 100%; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 10px; font-size: 1rem; background-color: var(--bg-section); color: var(--text-dark); transition: all 0.2s; box-sizing: border-box; }
	.themed-input:focus { border-color: var(--primary-color); outline: none; box-shadow: 0 0 0 3px rgba(160, 132, 232, 0.2); background-color: var(--bg-card); }
	
	.btn-primary { width: 100%; padding: 14px; background-color: var(--primary-color); color: white; border: none; border-radius: 12px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
	.btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	
    .card-footer { margin-top: 2rem; border-top: 1px solid var(--border-color); padding-top: 1.5rem; display: flex; justify-content: center; align-items: center; gap: 6px; width: 100%; flex-wrap: wrap; }
    .footer-text { color: var(--text-light); font-size: 0.95rem; }
    .action-link { color: var(--primary-color); text-decoration: none; font-weight: 700; font-size: 0.95rem; }
    .action-link:hover { text-decoration: underline; }

    /* --- SOLUCIÓN AL CHOQUE EN MÓVIL --- */
    @media (max-width: 480px) {
        .auth-layout { align-items: flex-start; padding-top: 2rem; }
        .auth-card { padding: 1.5rem; }
        
        /* El botón deja de ser absoluto y se integra en el flujo */
        .home-link {
            position: relative; /* Ya no flota */
            top: auto;
            left: auto;
            display: inline-flex;
            margin-bottom: 1.5rem; /* Empuja el contenido hacia abajo */
            align-self: flex-start; /* Se alinea a la izquierda */
            background: none; /* Quita el fondo en móvil para que se vea limpio */
            padding: 0;
        }
        .icon-header { margin-top: 0; } /* Quitamos el margen extra */
    }
</style>