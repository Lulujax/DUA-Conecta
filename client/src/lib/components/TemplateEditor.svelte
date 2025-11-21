<script lang="ts">
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import Draggable from '../editor/Draggable.svelte';
	import { user } from '../stores/auth';
	import { editorStore } from '../editor/editor.store.svelte';
	import { apiService } from '../editor/apiService';
	
	// Componentes UI
	import EditorSidebar from './editor/EditorSidebar.svelte'; 
	import TextToolbar from './editor/TextToolbar.svelte'; 
	import ShapeToolbar from './editor/ShapeToolbar.svelte';
	import ImageToolbar from './editor/ImageToolbar.svelte';
	import GeneralToolbar from './editor/GeneralToolbar.svelte';
    // Loader
    import Loader from '$lib/components/ui/Loader.svelte';

	let { templateId, baseElements } = $props<{ templateId: string; baseElements: Array<any>; }>();

	let initialActivityId: number | null = null;
	let initialActivityName: string | null = 'Plantilla sin nombre';
	
	if (browser) {
		const urlParams = new URLSearchParams(window.location.search);
		const activityIdParam = urlParams.get('activityId');
		if (activityIdParam) {
			initialActivityId = parseInt(activityIdParam);
			const activityNameParam = urlParams.get('name');
			if (activityNameParam) initialActivityName = decodeURIComponent(activityNameParam);
		}
	}
	
	let canvasContainerRef: HTMLDivElement | null = $state(null);
	let verticalSnapLine = $state<number | null>(null);
	let horizontalSnapLine = $state<number | null>(null);
	
	// Zoom automático
	let zoomScale = $state(1);
	function handleResize() {
		if (canvasContainerRef && window.innerWidth < 1000) {
			const availableWidth = window.innerWidth - 40; 
			zoomScale = Math.min(1, availableWidth / 700);
		} else {
			zoomScale = 1;
		}
	}

	function handleShowSnapLine(line: { type: 'vertical' | 'horizontal'; position: number | null }) {
		if (line.type === 'vertical') verticalSnapLine = line.position;
		else horizontalSnapLine = line.position;
	}
	
	onMount(() => {
		editorStore.init(baseElements, initialActivityId, initialActivityName);
		if (initialActivityId && browser) apiService.loadActivity(initialActivityId, $user.token);
		
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});

	function deselectCanvas(e: MouseEvent | TouchEvent) {
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
			const x = (e.clientX - canvasRect.left) / zoomScale;
			const y = (e.clientY - canvasRect.top) / zoomScale;
			editorStore.addImage(e.dataTransfer.files[0], x, y);
		}
	}
	
	let blockNavigation = false;
	beforeNavigate(({ cancel }) => {
		if (editorStore.hasUnsavedChanges && blockNavigation) {
			if (!confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) cancel();
		}
		if (!editorStore.hasUnsavedChanges || !cancel) blockNavigation = false;
	});
	afterNavigate(() => { setTimeout(() => { blockNavigation = true; }, 0); });

    // --- AQUÍ ESTABA EL PROBLEMA: FALTABAN LAS TECLAS ---
	function handleKeyDown(event: KeyboardEvent) {
		if ((event.target as HTMLElement)?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return;
		
		if (event.ctrlKey || event.metaKey) {
			const key = event.key.toLowerCase();
			
            // Deshacer / Rehacer
            if (key === 'z') { event.preventDefault(); editorStore.undo(); }
			else if (key === 'y' || (event.shiftKey && key === 'z')) { event.preventDefault(); editorStore.redo(); }
			
            // --- AÑADIDO: COPIAR / PEGAR / DUPLICAR ---
			else if (key === 'c') { event.preventDefault(); editorStore.copySelected(); }
			else if (key === 'v') { event.preventDefault(); editorStore.paste(); }
			else if (key === 'd') { event.preventDefault(); editorStore.duplicateSelectedElement(); }
            // ------------------------------------------

            // Estilos
			else if (key === 'b') { event.preventDefault(); editorStore.toggleStyle('isBold'); }
			else if (key === 'i') { event.preventDefault(); editorStore.toggleStyle('isItalic'); }
			else if (key === 'u') { event.preventDefault(); editorStore.toggleStyle('isUnderlined'); }
		
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
			if (editorStore.selectedElementId !== null) { event.preventDefault(); editorStore.deleteSelected(); }
		}
	}
	
	onMount(() => {
		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	});
</script>

<main class="editor-layout">
	<EditorSidebar {templateId} bind:canvasContainerRef={canvasContainerRef} />
	
	<div class="editor-main-area">
		{#if editorStore.selectedElement}
			<GeneralToolbar />
			{#if editorStore.selectedElement.type === 'text'} <TextToolbar />
			{:else if editorStore.selectedElement.type === 'shape'} <ShapeToolbar />
			{:else if editorStore.selectedElement.type === 'image'} <ImageToolbar />
			{/if}
		{/if}

		<div class="editor-canvas-area" onclick={deselectCanvas} ontouchend={deselectCanvas} ondragover={handleDragOver} ondrop={handleDrop}>
			<div class="scale-wrapper" style:transform="scale({zoomScale})">
				<div class="canvas-container" onmousedown={deselectCanvas} ontouchstart={deselectCanvas} bind:this={canvasContainerRef}>
					{#each editorStore.elements as element (element.id)}
						<Draggable
							data-element-id={element.id}
							{element}
							isSelected={element.id === editorStore.selectedElementId}
							onSelect={(id, e) => editorStore.selectElement(id)}
							onUpdate={editorStore.updateElement}
							allElements={editorStore.elements}
							onShowSnapLine={handleShowSnapLine}
						/>
					{/each}
					{#if verticalSnapLine !== null}<div class="snap-line vertical" style:left="{verticalSnapLine}px"></div>{/if}
					{#if horizontalSnapLine !== null}<div class="snap-line horizontal" style:top="{horizontalSnapLine}px"></div>{/if}
				</div>
			</div>
		</div>
	</div>
</main>

<style>
	.editor-layout { display: flex; height: 100vh; overflow: hidden; flex-direction: row; }
    .editor-main-area { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; background-color: var(--bg-section); }
    .editor-canvas-area { flex-grow: 1; display: flex; justify-content: center; align-items: flex-start; padding: 2rem; padding-top: 70px; overflow: auto; background-color: var(--bg-section); -webkit-overflow-scrolling: touch; }
	.scale-wrapper { transform-origin: top center; transition: transform 0.3s ease; }
    .canvas-container { position: relative; width: 700px; height: 990px; background-color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.15); overflow: hidden; border: 1px solid #ccc; flex-shrink: 0; }
    .snap-line { position: absolute; background-color: #F472B6; z-index: 10000; pointer-events: none; }
    .snap-line.vertical { width: 2px; height: 100%; top: 0; }
    .snap-line.horizontal { height: 2px; width: 100%; left: 0; }

	@media (max-width: 768px) {
		.editor-layout { flex-direction: column-reverse; }
		.editor-canvas-area { padding: 1rem; padding-top: 60px; }
	}
</style>