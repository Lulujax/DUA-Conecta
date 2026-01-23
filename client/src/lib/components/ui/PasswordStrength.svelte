<script lang="ts">
    let { password = $bindable(), isValid = $bindable() } = $props<{ 
        password: string, 
        isValid: boolean 
    }>();

    // Requisitos
    let hasMinLength = $derived(password.length >= 8);
    let hasNumber = $derived(/\d/.test(password));
    let hasSpecial = $derived(/[!@#$%^&*(),.?":{}|<>]/.test(password));
    let hasUpper = $derived(/[A-Z]/.test(password));

    // Cálculo de fuerza
    let strength = $derived(
        (hasMinLength ? 1 : 0) + 
        (hasNumber ? 1 : 0) + 
        (hasSpecial ? 1 : 0) + 
        (hasUpper ? 1 : 0)
    );

    let barColor = $derived(
        strength <= 1 ? '#dc2626' : // Rojo
        strength <= 3 ? '#d97706' : // Naranja
        '#16a34a' // Verde
    );

    let strengthLabel = $derived(
        strength <= 1 ? 'Débil' : 
        strength <= 3 ? 'Mejorable' : 
        'Segura'
    );

    $effect(() => { isValid = strength === 4; });
</script>

<div class="password-strength-container">
    <div class="input-wrapper">
        <input 
            type="password" 
            bind:value={password} 
            placeholder="Contraseña segura"
            class="pass-input"
        />
        <div class="strength-bar-bg">
            <div class="strength-bar-fill" style="background-color: {barColor}; width: {(strength / 4) * 100}%"></div>
        </div>
    </div>

    <div class="status-row">
        <span class="status-label" style="color: {barColor}">{strengthLabel}</span>
    </div>

    <div class="requirements-list">
        <div class="req-item" class:met={hasMinLength}>
            <span class="dot" style="background-color: {hasMinLength ? '#16a34a' : 'var(--border-color)'}"></span> Mín. 8 caracteres
        </div>
        <div class="req-item" class:met={hasNumber}>
            <span class="dot" style="background-color: {hasNumber ? '#16a34a' : 'var(--border-color)'}"></span> Un número
        </div>
        <div class="req-item" class:met={hasUpper}>
            <span class="dot" style="background-color: {hasUpper ? '#16a34a' : 'var(--border-color)'}"></span> Una mayúscula
        </div>
        <div class="req-item" class:met={hasSpecial}>
            <span class="dot" style="background-color: {hasSpecial ? '#16a34a' : 'var(--border-color)'}"></span> Un símbolo
        </div>
    </div>
</div>

<style>
    .password-strength-container { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; }
    
    /* Wrapper del input: Fondo adaptativo */
    .input-wrapper { position: relative; overflow: hidden; border-radius: 10px; background-color: var(--bg-section); border: 1px solid var(--border-color); transition: all 0.2s; }
    .input-wrapper:focus-within { border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(160, 132, 232, 0.2); background-color: var(--bg-card); }
    
    /* Input transparente para heredar color */
    .pass-input { width: 100%; padding: 12px 16px; border: none; outline: none; background: transparent; font-size: 1rem; color: var(--text-dark); position: relative; z-index: 2; box-sizing: border-box; }
    .pass-input::placeholder { color: var(--text-light); opacity: 0.7; }

    /* Barra */
    .strength-bar-bg { position: absolute; bottom: 0; left: 0; width: 100%; height: 4px; background: var(--border-color); z-index: 1; }
    .strength-bar-fill { height: 100%; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    
    .status-row { display: flex; justify-content: flex-end; margin-top: -4px; }
    .status-label { font-size: 0.8rem; font-weight: 700; transition: color 0.3s; text-transform: uppercase; letter-spacing: 0.5px; }
    
    /* Lista de requisitos: Fondo adaptativo */
    .requirements-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background-color: var(--bg-section); padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); }
    
    .req-item { font-size: 0.8rem; color: var(--text-light); display: flex; align-items: center; gap: 8px; transition: all 0.3s; font-weight: 500; }
    .req-item.met { color: var(--text-dark); } 
    
    .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; transition: background-color 0.3s; border: 1px solid transparent; }
</style>