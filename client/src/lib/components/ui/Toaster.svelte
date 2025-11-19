<script lang="ts">
    import { toast } from '$lib/stores/toast.svelte';
    import { fly } from 'svelte/transition';
    import { flip } from 'svelte/animate';
</script>

<div class="toast-container">
    {#each toast.toasts as t (t.id)}
        <div 
            class="toast toast-{t.type}" 
            in:fly={{ y: 20, duration: 300 }} 
            out:fly={{ y: -20, duration: 300 }}
            animate:flip
        >
            <div class="icon">
                {#if t.type === 'success'}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {:else if t.type === 'error'}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                {/if}
            </div>
            <p>{t.message}</p>
            <button class="close-btn" onclick={() => toast.remove(t.id)}>×</button>
        </div>
    {/each}
</div>

<style>
    .toast-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 9999;
        pointer-events: none; /* Deja pasar clics a través del contenedor vacío */
    }

    .toast {
        pointer-events: auto; /* Reactiva clics en las burbujas */
        min-width: 300px;
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        padding: 12px 16px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--text-dark);
        font-size: 0.95rem;
        font-weight: 500;
        backdrop-filter: blur(10px);
    }

    /* Bordes de color según tipo */
    .toast-success { border-left: 4px solid #10b981; }
    .toast-error { border-left: 4px solid #ef4444; }
    .toast-info { border-left: 4px solid #3b82f6; }

    .icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
    }
    
    .toast-success .icon { color: #10b981; }
    .toast-error .icon { color: #ef4444; }
    .toast-info .icon { color: #3b82f6; }

    .icon svg { width: 18px; height: 18px; }

    p { margin: 0; flex-grow: 1; }

    .close-btn {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: var(--text-light);
        padding: 0 4px;
        line-height: 1;
    }
    .close-btn:hover { color: var(--text-dark); }
</style>