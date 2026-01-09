<script lang="ts">
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';
  import { toast } from '$lib/stores/toast.svelte';
  import { api } from '$lib/api';

  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);

  async function handleLogin(e: Event) {
    e.preventDefault();
    isLoading = true;

    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.success) {
        user.loginSuccess(res.user);
        toast.success(`¡Hola de nuevo, ${res.user.name}!`);
        // Redirige al panel principal donde están las plantillas
        goto('/dashboard/plantillas'); 
      } else {
        toast.error(res.error || 'Credenciales inválidas');
      }
    } catch (err) {
      toast.error('Error de conexión con el servidor');
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="auth-wrapper">
  <div class="auth-card">
    <h2>Iniciar Sesión</h2>
    <p class="subtitle">Continúa creando experiencias mágicas</p>
    
    <a href="/" class="back-link">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      Volver
    </a>

    <form onsubmit={handleLogin}>
      <div class="form-group">
        <label for="email">Correo Electrónico</label>
        <input type="email" id="email" bind:value={email} required placeholder="tu@correo.com" />
      </div>

      <div class="form-group">
        <label for="password">Contraseña</label>
        <div class="password-group">
          <input type="password" id="password" bind:value={password} required placeholder="••••••••" />
        </div>
      </div>

      <div class="forgot-password-link">
        <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
      </div>

      <button type="submit" class="btn-primary" disabled={isLoading}>
        {#if isLoading}
          <div class="spinner"></div>
        {:else}
          Ingresar
        {/if}
      </button>

      <div class="switch-link">
        ¿No tienes cuenta? <a href="/register">Regístrate gratis</a>
      </div>
    </form>
  </div>
</div>