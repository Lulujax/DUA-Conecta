<script lang="ts">
    import { fade, scale } from 'svelte/transition';
    import { cubicOut } from 'svelte/easing';

    // Props del componente (Svelte 5 runes)
    let { 
        isOpen = false, 
        title = "Título", 
        placeholder = "Escribe aquí...", 
        defaultValue = "", 
        confirmLabel = "Confirmar",
        onConfirm, 
        onCancel 
    } = $props<{
        isOpen: boolean;
        title: string;
        placeholder?: string;
        defaultValue?: string;
        confirmLabel?: string;
        onConfirm: (value: string) => void;
        onCancel: () => void;
    }>();

    let inputValue = $state(defaultValue);

    // Actualizar el input cuando se abre el modal con un valor por defecto
    $effect(() => {
        if (isOpen) {
            inputValue = defaultValue;
            // Pequeño hack para enfocar el input automáticamente
            setTimeout(() => document.getElementById('modal-input')?.focus(), 50);
        }
    });

    function handleConfirm() {
        if (inputValue.trim()) {
            onConfirm(inputValue.trim());
        }
    }
    
    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') handleConfirm();
        if (e.key === 'Escape') onCancel();
    }
</script>

{#if isOpen}
    <div 
        class="modal-backdrop" 
        transition:fade={{ duration: 200 }}
        onclick={onCancel}
        role="dialog"
        aria-modal="true"
    >
        <div 
            class="modal-card" 
            transition:scale={{ duration: 300, easing: cubicOut, start: 0.95 }}
            onclick={(e) => e.stopPropagation()} 
        >
            <h3>{title}</h3>
            
            <input 
                id="modal-input"
                type="text" 
                bind:value={inputValue} 
                {placeholder}
                onkeydown={handleKeydown}
                autocomplete="off"
            />

            <div class="modal-actions">
                <button class="btn-secondary" onclick={onCancel}>Cancelar</button>
                <button class="btn-primary" onclick={handleConfirm} disabled={!inputValue.trim()}>
                    {confirmLabel}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(25, 21, 35, 0.6);
        backdrop-filter: blur(4px);
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1.5rem;
    }

    .modal-card {
        background-color: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: 16px;
        padding: 2rem;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.2);
        text-align: center;
    }

    h3 {
        margin: 0 0 1.5rem 0;
        font-size: 1.5rem;
        color: var(--text-dark);
    }

    input {
        width: 100%;
        padding: 0.8rem 1rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        font-size: 1rem;
        margin-bottom: 2rem;
        outline: none;
        transition: border-color 0.2s;
        background: var(--bg-section);
        color: var(--text-dark);
    }

    input:focus {
        border-color: var(--primary-color);
    }

    .modal-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .modal-actions button {
        min-width: 100px;
    }
</style>