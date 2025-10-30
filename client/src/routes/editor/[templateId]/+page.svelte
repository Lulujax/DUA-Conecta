<script lang="ts">
	import { page } from '$app/stores';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
    
    // Importamos nuestros nuevos componentes y el store
	import { createEditorStore } from '$lib/editor/editorStore.ts';
	import EditorSidebar from '$lib/editor/EditorSidebar.svelte';
	import TextToolbar from '$lib/editor/TextToolbar.svelte';
	import EditorCanvas from '$lib/editor/EditorCanvas.svelte';

	const templateId = $page.params.templateId;
    
    // --- Lógica de inicialización (se queda en la página) ---
	let initialActivityId: number | null = null;
    let initialActivityName: string | null = 'Plantilla sin nombre';
	if (browser) {
        const urlParams = new URLSearchParams(window.location.search);
        const activityIdParam = urlParams.get('activityId');
        const activityNameParam = urlParams.get('name');
		if (activityIdParam) {
            initialActivityId = parseInt(activityIdParam);
			if (activityNameParam) {
                initialActivityName = decodeURIComponent(activityNameParam);
			}
        }
    }

    // --- Creamos la instancia de nuestro store ---
    // Pasamos los datos iniciales que obtuvimos de la URL
    const store = createEditorStore(initialActivityId, initialActivityName, templateId);

    // Desestructuramos solo las funciones que la *página* necesita directamente
    const { loadActivity, toggleStyle, undo, redo, deleteSelected } = store;

    // --- Efectos y Lógica de Página ---

    // 1. Efecto de carga
    $effect(() => {
        if (store.currentActivityId && browser) {
            loadActivity(store.currentActivityId);
        }
    });

	// 2. Aviso antes de salir
	let blockNavigation = false;
	beforeNavigate(({ cancel }) => { 
        if (store.hasUnsavedChanges && blockNavigation) { 
            if (!confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
                cancel();
            } else {
                // Si el usuario decide salir, reseteamos el flag para evitar futuros bloqueos
                // (Aunque esto es manejado por el store al guardar, es una buena práctica)
            }
        } 
        if (!store.hasUnsavedChanges || !cancel) {
            blockNavigation = false; 
        }
    });
	afterNavigate(() => { 
        setTimeout(() => { blockNavigation = true; }, 0); 
    });

	// 3. ATAJOS DE TECLADO
	function handleKeyDown(event: KeyboardEvent) { 
        if ((event.target as HTMLElement)?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return;
		
        if (event.ctrlKey || event.metaKey) { 
            if (event.key === 'z') { event.preventDefault(); undo(); } 
            else if (event.key === 'y' || (event.shiftKey && event.key === 'Z')) { event.preventDefault(); redo(); } 
            else if (event.key === 'b') { event.preventDefault(); toggleStyle('isBold'); } 
            else if (event.key === 'i') { event.preventDefault(); toggleStyle('isItalic'); } 
            else if (event.key === 'u') { event.preventDefault(); toggleStyle('isUnderlined'); } 
        } else if (event.key === 'Delete' || event.key === 'Backspace') { 
            if (store.selectedElementId !== null) { 
                event.preventDefault();
			    deleteSelected(); 
            } 
        } 
    }
	$effect(() => { 
        if (browser) { 
            document.addEventListener('keydown', handleKeyDown); 
            return () => document.removeEventListener('keydown', handleKeyDown); 
        } 
    });
</script>

<svelte:head>
    <title>Editor - {store.activityName} - DUA-Conecta</title>
</svelte:head>

<main class="editor-layout" onclick={store.deselect}>
	
    <EditorSidebar {store} />

	<div class="editor-main-area">
        
        {#if store.selectedElement?.type === 'text'}
            <TextToolbar {store} />
		{/if}

        <EditorCanvas {store} />
	</div>
</main>

<style>
    /* El archivo de la página ahora solo contiene los estilos del layout principal */
	.editor-layout { 
        display: flex;
        height: 100vh; 
        overflow: hidden; 
    }
    
    .editor-main-area { 
        flex-grow: 1;
        display: flex; 
        flex-direction: column; 
        overflow: hidden; 
        position: relative; 
        background-color: var(--bg-section);
    }
    
    .editor-canvas-area { 
        flex-grow: 1; 
        display: flex; 
        justify-content: center; 
        align-items: flex-start; 
        padding: 2rem;
        padding-top: 70px; 
        overflow: auto; 
        background-color: var(--bg-section); 
    }

    /* Estos estilos (y sus clases) deben estar en app.css o en los componentes que los usan */
    /* Dejamos esto aquí temporalmente para no romper la UI de los botones */
    :global(.btn-secondary) { 
        display:inline-block; 
        padding:0.5rem 0.8rem; 
        margin-right:4px; 
        margin-top:6px; 
    }
	:global(.icon-button) { 
        width: 32px;
        height: 32px; 
        display:flex; 
        align-items:center; 
        justify-content:center; 
    }
</style>