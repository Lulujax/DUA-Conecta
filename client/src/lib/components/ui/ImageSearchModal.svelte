<script lang="ts">
    import { fade, scale } from 'svelte/transition';
    import { api } from '$lib/api';
    import { toast } from '$lib/stores/toast.svelte';

    let { 
        isOpen = false, 
        onSelect, 
        onClose 
    } = $props<{
        isOpen: boolean;
        onSelect: (url: string) => void;
        onClose: () => void;
    }>();

    let query = $state('');
    let results = $state<any[]>([]);
    let isLoading = $state(false);
    let hasSearched = $state(false);

    // Buscar al presionar Enter
    async function handleSearch() {
        if (!query.trim()) return;
        isLoading = true;
        hasSearched = true;
        results = [];

        try {
            // Llamamos a NUESTRO servidor, no a Pixabay directo
            const data = await api.get(`/api/pixabay?q=${encodeURIComponent(query)}`);
            if (data.hits) {
                results = data.hits;
            }
        } catch (e) {
            toast.error("Error al buscar imágenes.");
        } finally {
            isLoading = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter') handleSearch();
        if (e.key === 'Escape') onClose();
    }

    function selectImage(url: string) {
        onSelect(url);
        onClose();
        // Limpiar estado para la próxima
        query = '';
        results = [];
        hasSearched = false;
    }
</script>

{#if isOpen}
    <div class="modal-backdrop" transition:fade={{ duration: 200 }} onclick={onClose} role="dialog">
        <div class="modal-card" transition:scale={{ duration: 200, start: 0.95 }} onclick={(e) => e.stopPropagation()}>
            
            <div class="modal-header">
                <h3>Buscar Imágenes</h3>
                <button class="close-btn" onclick={onClose}>×</button>
            </div>

            <div class="search-box">
                <input 
                    type="text" 
                    bind:value={query} 
                    placeholder="Ej: perro, escuela, sol..." 
                    onkeydown={handleKeydown}
                    autofocus
                />
                <button class="btn-primary" onclick={handleSearch} disabled={isLoading}>
                    {isLoading ? '...' : 'Buscar'}
                </button>
            </div>

            <div class="results-grid">
                {#if isLoading}
                    <div class="loading-msg">Buscando inspiración... 🎨</div>
                {:else if results.length > 0}
                    {#each results as img}
                        <button class="img-result" onclick={() => selectImage(img.webformatURL)}>
                            <img src={img.previewURL} alt={img.tags} loading="lazy" />
                        </button>
                    {/each}
                {:else if hasSearched}
                    <div class="empty-msg">No encontramos nada con ese nombre 😢</div>
                {:else}
                    <div class="empty-msg hint">Escribe algo para empezar a buscar.<br>¡Tenemos millones de imágenes!</div>
                {/if}
            </div>
            
            <div class="footer">
                <span class="attribution">Powered by Pixabay</span>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(3px); z-index: 2000; display: flex; justify-content: center; align-items: center; padding: 1rem; }
    .modal-card { background: var(--bg-card); width: 100%; max-width: 700px; height: 80vh; border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
    
    .modal-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
    .modal-header h3 { margin: 0; font-size: 1.2rem; color: var(--text-dark); }
    .close-btn { background: none; border: none; font-size: 2rem; line-height: 1; cursor: pointer; color: var(--text-light); }

    .search-box { padding: 1rem 1.5rem; display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color); background: var(--bg-section); }
    .search-box input { flex: 1; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color); font-size: 1rem; }
    .btn-primary { padding: 0 1.5rem; border-radius: 8px; background: var(--primary-color); color: white; border: none; font-weight: bold; cursor: pointer; }
    .btn-primary:disabled { opacity: 0.7; }

    .results-grid { flex: 1; overflow-y: auto; padding: 1.5rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; align-content: start; }
    
    .img-result { border: none; padding: 0; background: none; cursor: pointer; border-radius: 8px; overflow: hidden; transition: transform 0.2s; aspect-ratio: 1; }
    .img-result:hover { transform: scale(1.05); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    .img-result img { width: 100%; height: 100%; object-fit: cover; }

    .loading-msg, .empty-msg { grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-light); font-size: 1.1rem; }
    .hint { font-size: 0.9rem; opacity: 0.8; }

    .footer { padding: 0.5rem; text-align: center; font-size: 0.7rem; color: #999; border-top: 1px solid var(--border-color); }
</style>