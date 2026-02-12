<script lang="ts">
    let { password = '', isValid = $bindable() } = $props<{ 
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
    <div class="strength-bar-bg">
        <div class="strength-bar-fill" style="background-color: {barColor}; width: {(strength / 4) * 100}%"></div>
    </div>

    <div class="status-row">
        <span class="status-label" style="color: {barColor}">{strengthLabel}</span>
    </div>

    <div class="requirements-list">
        <div class="req-item" class:met={hasMinLength}>
            <span class="dot" style="background-color: {hasMinLength ? '#16a34a' : 'var(--border-color)'}"></span> Mín. 8
        </div>
        <div class="req-item" class:met={hasNumber}>
            <span class="dot" style="background-color: {hasNumber ? '#16a34a' : 'var(--border-color)'}"></span> Número
        </div>
        <div class="req-item" class:met={hasUpper}>
            <span class="dot" style="background-color: {hasUpper ? '#16a34a' : 'var(--border-color)'}"></span> Mayúscula
        </div>
        <div class="req-item" class:met={hasSpecial}>
            <span class="dot" style="background-color: {hasSpecial ? '#16a34a' : 'var(--border-color)'}"></span> Símbolo
        </div>
    </div>
</div>

<style>
    .password-strength-container { display: flex; flex-direction: column; gap: 0.5rem; width: 100%; margin-top: 5px; }
    
    .strength-bar-bg { width: 100%; height: 4px; background: var(--border-color); border-radius: 2px; overflow: hidden; }
    .strength-bar-fill { height: 100%; transition: all 0.4s ease; }
    
    .status-row { display: flex; justify-content: flex-end; }
    .status-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
    
    .requirements-list { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
    .req-item { font-size: 0.75rem; color: var(--text-light); display: flex; align-items: center; gap: 6px; }
    .req-item.met { color: var(--text-dark); font-weight: 600; } 
    
    .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; border: 1px solid transparent; background-color: #ddd; }
</style>