<script lang="ts">
	// --- IMPORTS ---
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	// --- Rutas relativas ---
	import Draggable from '../editor/Draggable.svelte';
	import { user } from '../stores/auth';
	import { editorStore } from '../editor/editor.store.svelte';
	import { apiService } from '../editor/apiService';
	
	// --- Importamos los NUEVOS componentes de UI ---
	import EditorSidebar from './editor/EditorSidebar.svelte'; 
	import TextToolbar from './editor/TextToolbar.svelte'; // <-- ¡NUEVO!

	// --- PROPS ---
	let {
		templateId,
		baseElements
	} = $props<{
		templateId: string;
		baseElements: Array<any>;
	}>();

	// --- Lógica de carga de URL ---
	let initialActivityId: number | null = null;
	let initialActivityName: string | null = 'Plantilla sin nombre';
	if (browser) {
		const urlParams = new URLSearchParams(window.location.search);
		const activityIdParam = urlParams.get('activityId');
		if (activityIdParam) {
			initialActivityId = parseInt(activityIdParam);
			const activityNameParam = urlParams.get('name');
			if (activityNameParam) {
				initialActivityName = decodeURIComponent(activityNameParam);
			}
		}
	}
	
	// --- Estado de la UI (Snap lines y Referencia al DOM) ---
	let canvasContainerRef: HTMLDivElement | null = $state(null);
	let verticalSnapLine = $state<number | null>(null);
	let horizontalSnapLine = $state<number | null>(null);
	function handleShowSnapLine(line: { type: 'vertical' | 'horizontal'; position: number | null }) {
		if (line.type === 'vertical') verticalSnapLine = line.position;
		else horizontalSnapLine = line.position;
	}

	// --- `availableFonts` MOVIDO a TextToolbar.svelte ---
	
	// --- LÓGICA DE INICIALIZACIÓN ---
	onMount(() => {
		editorStore.init(baseElements, initialActivityId, initialActivityName);
		
		if (initialActivityId && browser) {
			apiService.loadActivity(initialActivityId, $user.token);
		}
	});

	// --- LÓGICA DE INTERFAZ (Pegado, soltado, etc.) ---
	function deselectCanvas(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target.classList.contains('canvas-container') || target.classList.contains('editor-canvas-area')) {
			editorStore.deselect();
		}
	}
	
	function handleDragOver(e: DragEvent) { e.preventDefault(); }
	
	function handleDrop(e: DragEvent) {
		e.preventDefault();
		if (e.dataTransfer?.files?.[0]) {
			const canvasRect = (e.currentTarget as HTMLElement).querySelector('.canvas-container')?.getBoundingClientRect();
			if (!canvasRect) return;
			const x = e.clientX - canvasRect.left;
			const y = e.clientY - canvasRect.top;
			editorStore.addImage(e.dataTransfer.files[0], x, y);
		}
	}
	
	// --- MANEJO DE NAVEGACIÓN Y TECLADO ---
	let blockNavigation = false;
	beforeNavigate(({ cancel }) => {
		if (editorStore.hasUnsavedChanges && blockNavigation) {
			if (!confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
				cancel();
			}
		}
		if (!editorStore.hasUnsavedChanges || !cancel) {
			blockNavigation = false;
		}
	});
	afterNavigate(() => {
		setTimeout(() => { blockNavigation = true; }, 0);
	});

	// --- `formatList` y `stopToolbarClick` MOVIDOS a TextToolbar.svelte ---

	function handleKeyDown(event: KeyboardEvent) {
		if ((event.target as HTMLElement)?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return;
		
		if (event.ctrlKey || event.metaKey) {
			if (event.key === 'z') { event.preventDefault(); editorStore.undo(); }
			else if (event.key === 'y' || (event.shiftKey && event.key === 'Z')) { event.preventDefault(); editorStore.redo(); }
			else if (event.key === 'b') { event.preventDefault(); editorStore.toggleStyle('isBold'); }
			else if (event.key === 'i') { event.preventDefault(); editorStore.toggleStyle('isItalic'); }
			else if (event.key === 'u') { event.preventDefault(); editorStore.toggleStyle('isUnderlined'); }
		} else if (event.key === 'Delete' || event.key === 'Backspace') {
			if (editorStore.selectedElementId !== null) {
				event.preventDefault();
				editorStore.deleteSelected();
			}
		}
	}
	
	onMount(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	});
</script>

<main class="editor-layout" onclick={deselectCanvas}>
	
	<EditorSidebar {templateId} bind:canvasContainerRef={canvasContainerRef} />

	<div class="editor-main-area">
		
		{#if editorStore.selectedElement?.type === 'text'}
			<TextToolbar />
		{/if}

		<div class="editor-canvas-area" onclick={deselectCanvas} ondragover={handleDragOver} ondrop={handleDrop}>
			<div class="canvas-container" onmousedown={deselectCanvas} bind:this={canvasContainerRef}>
				{#each editorStore.elements as element (element.id)}
					<Draggable
						data-element-id={element.id}
						{element}
						isSelected={element.id === editorStore.selectedElementId}
						onSelect={(id, e) => editorStore.selectElement(id)}
						onUpdate={editorStore.updateElement}
						allElements={editorStore.elements}
						{handleShowSnapLine} />
				{/each}
				{#if verticalSnapLine !== null}<div class="snap-line vertical" style:left="{verticalSnapLine}px"></div>{/if}
				{#if horizontalSnapLine !== null}<div class="snap-line horizontal" style:top="{horizontalSnapLine}px"></div>{/if}
			</div>
		</div>
	</div>
</main>

<style>
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
		padding-top: 70px; /* Espacio para la barra de texto */
		overflow: auto; 
		background-color: var(--bg-section); 
	}
    .canvas-container { 
		position: relative; 
		width: 700px; 
		height: 990px; 
		background-color: white; 
		box-shadow: 0 10px 30px rgba(0,0,0,0.15); 
		overflow: hidden; 
		border: 1px solid #ccc; 
		flex-shrink: 0; 
	}
    .snap-line { 
		position: absolute; 
		background-color: #ff4d4d; 
		z-index: 10000; 
		pointer-events: none; 
	}
    .snap-line.vertical { width: 1px; height: 100%; top: 0; }
    .snap-line.horizontal { height: 1px; width: 100%; left: 0; }
</style>