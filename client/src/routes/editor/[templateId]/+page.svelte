<script lang="ts">
	import { page } from '$app/stores';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import Draggable from '$lib/editor/Draggable.svelte';
	import { browser } from '$app/environment';
    import { tick } from 'svelte';

	const templateId = $page.params.templateId;
	let selectedElementId = $state<number | null>(null);

	// --- ESTADO PARA LÍNEAS DE AJUSTE ---
	let verticalSnapLine = $state<number | null>(null);
	let horizontalSnapLine = $state<number | null>(null);

	function handleShowSnapLine(line: { type: 'vertical' | 'horizontal'; position: number | null }) {
		if (line.type === 'vertical') verticalSnapLine = line.position;
		else horizontalSnapLine = line.position;
	}

	// --- FUENTES DISPONIBLES ---
	const availableFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS'];

	// --- PLANTILLA BASE ---
	let initialElements: Array<any> = [
        { id: 1, type: 'text', content: 'Nombre:', x: 50, y: 40, width: 60, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 101, type: 'text', content: '_____________________', x: 115, y: 40, width: 180, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 2, type: 'text', content: 'Fecha:', x: 350, y: 40, width: 50, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 102, type: 'text', content: '__________', x: 405, y: 40, width: 100, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 3, type: 'text', content: 'Grado:', x: 550, y: 40, width: 50, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 103, type: 'text', content: '______', x: 605, y: 40, width: 80, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 4, type: 'text', content: 'El Monstruo de las Emociones', x: 50, y: 90, width: 600, height: 35, fontSize: 24, color: '#000000', isBold: true, textAlign: 'center', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 6, type: 'text', content: 'El monstruo siente muchas emociones, dice que en cada parte de su cuerpo hay una emoción ¿En qué parte del cuerpo sientes la emoción?', x: 50, y: 140, width: 600, height: 40, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 7, type: 'text', content: 'COLORES Y EMOCIONES:', x: 50, y: 200, width: 600, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 8, type: 'text', content: '• ROJO - IRA/MOLESTIA', x: 70, y: 230, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 9, type: 'text', content: '• MORADO - MIEDO', x: 70, y: 250, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 10, type: 'text', content: '• AZUL - TRISTEZA', x: 70, y: 270, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 11, type: 'text', content: '• AMARILLO - FELICIDAD', x: 70, y: 290, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 12, type: 'text', content: '• VERDE - ASCO', x: 70, y: 310, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false },
        { id: 5, type: 'image', url: '/asdasda-removebg-preview.png', x: 200, y: 360, width: 300, height: 300 },
        { id: 13, type: 'text', content: '¡Gana tu ficha aquí!', x: 380, y: 920, width: 160, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'right', fontFamily: 'Arial', isItalic: false, isUnderlined: false},
        { id: 113, type: 'text', content: '___________', x: 550, y: 920, width: 100, height: 20, fontSize: 12, color: '#000000', textAlign: 'left', fontFamily: 'Arial', isItalic: false, isUnderlined: false}
    ];

	// --- LÓGICA DE HISTORIAL ---
	let history: Array<string> = $state(['[{"id":-1}]']);
	let historyIndex = $state(0);
	let applyingHistory = $state(false);

    let elements = $state(structuredClone(initialElements));
	let nextZIndex = $state(elements.length + 1);

	function saveStateToHistory() {
		if (applyingHistory) return;
		const currentStateString = JSON.stringify(elements);
		if (currentStateString === history[historyIndex]) return;
		const nextHistory = history.slice(0, historyIndex + 1);
		nextHistory.push(currentStateString);
		history = nextHistory; historyIndex = history.length - 1;
		if (history.length > 50) { history.shift(); historyIndex--; history = [...history];}
		hasUnsavedChanges = true;
	}
	async function loadStateFromHistory(index: number) {
        if (index < 0 || index >= history.length) return;
        applyingHistory = true;
        historyIndex = index;
        elements = JSON.parse(history[historyIndex]);
        selectedElementId = null;
        hasUnsavedChanges = true;
        await tick();
        applyingHistory = false;
    }
	function undo() { if (historyIndex > 0) loadStateFromHistory(historyIndex - 1); }
	function redo() { if (historyIndex < history.length - 1) loadStateFromHistory(historyIndex + 1); }

	let canUndo = $derived(historyIndex > 0);
	let canRedo = $derived(historyIndex < history.length - 1);

	let selectedElement = $derived(elements.find((el) => el.id === selectedElementId) || null);
	let hasUnsavedChanges = $state(false);

	// --- LÓGICA DE ESTADO ---
	function updateElement(id: number, data: any, isFinalChange: boolean = true) {
		const index = elements.findIndex((el) => el.id === id);
		if (index !== -1) {
			 if (elements[index].type === 'image' && data.width !== undefined && data.height === undefined) { const oldWidth = elements[index].width; const oldHeight = elements[index].height; if (oldWidth > 0 && oldHeight > 0) data.height = data.width / (oldWidth / oldHeight); }
			 else if (elements[index].type === 'image' && data.height !== undefined && data.width === undefined) { const oldWidth = elements[index].width; const oldHeight = elements[index].height; if (oldWidth > 0 && oldHeight > 0) data.width = data.height * (oldWidth / oldHeight); }

             const currentZ = elements[index].z;
             elements[index] = { ...elements[index], ...data, z: data.z ?? currentZ };

			if (isFinalChange) { saveStateToHistory(); }
			if (!applyingHistory) hasUnsavedChanges = true;
		}
	}
	function selectElement(id: number, e: MouseEvent | KeyboardEvent) { e.stopPropagation(); selectedElementId = id; const index = elements.findIndex((el) => el.id === id); if (index !== -1) elements[index].z = nextZIndex++; }
	function deselect(e: MouseEvent) { const target = e.target as HTMLElement; if (target.classList.contains('canvas-container') || target.classList.contains('editor-canvas-area')) selectedElementId = null; }

	// --- MANEJO DE ARCHIVOS ---
	function handleDragOver(e: DragEvent) { e.preventDefault(); }
	function handleDrop(e: DragEvent) { e.preventDefault(); if (e.dataTransfer?.files?.[0]) { const canvasRect = (e.currentTarget as HTMLElement).querySelector('.canvas-container')?.getBoundingClientRect(); if (!canvasRect) return; const x = e.clientX - canvasRect.left; const y = e.clientY - canvasRect.top; handleFile(e.dataTransfer.files[0], x, y); } }
	function handleFileInput(e: Event) { const input = e.target as HTMLInputElement; if (input.files?.[0]) handleFile(input.files[0]); input.value = ''; }
	function handleFile(file: File, x = 50, y = 50) { if (!file.type.startsWith('image/')) { alert('Por favor, sube solo archivos de imagen.'); return; } const reader = new FileReader(); reader.onload = (e) => { const url = e.target?.result as string; const img = new Image(); img.onload = () => { const aspect = img.width / img.height; const maxWidth = 150; const initialWidth = Math.min(maxWidth, img.width); const initialHeight = aspect > 0 ? initialWidth / aspect : 150; const finalX = Math.max(0, x - initialWidth / 2); const finalY = Math.max(0, y - initialHeight / 2); elements = [...elements, { id: Date.now(), type: 'image', url, x: finalX, y: finalY, width: initialWidth, height: initialHeight, z: nextZIndex++ }]; saveStateToHistory(); }; img.onerror = () => { alert('Error al cargar la imagen.'); }; img.src = url; }; reader.onerror = () => { alert('Error al leer el archivo.'); }; reader.readAsDataURL(file); }

	// --- HERRAMIENTAS ---
	function addText() { elements = [...elements, { id: Date.now(), type: 'text', content: 'Nuevo Texto', x: 50, y: 50, width: 200, height: 30, fontSize: 16, color: '#000000', textAlign: 'left', isBold: false, fontFamily: 'Arial', isItalic: false, isUnderlined: false, z: nextZIndex++ }]; selectedElementId = elements[elements.length - 1].id; saveStateToHistory(); }
	function deleteSelected() { if(selectedElementId === null) return; elements = elements.filter((el) => el.id !== selectedElementId); selectedElementId = null; saveStateToHistory(); }

	// --- Acciones de Guardado/Descarga ---
	function saveChanges() { console.log('Guardando:', elements); hasUnsavedChanges = false; history = [JSON.stringify(elements)]; historyIndex = 0; alert('¡Plantilla guardada (simulado)!'); }
	function downloadPdf() { console.log('Descargando PDF con:', elements); alert('Descargando PDF (simulado)...'); }

	// --- Aviso antes de salir ---
	let blockNavigation = false;
	beforeNavigate(({ cancel }) => { if (hasUnsavedChanges && blockNavigation) { if (!confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) cancel(); else hasUnsavedChanges = false; } if (!hasUnsavedChanges || !cancel) blockNavigation = false; });
	afterNavigate(() => { setTimeout(() => { blockNavigation = true; }, 0); });

	// --- Funciones para herramientas de texto ---
	function toggleStyle(styleProp: 'isBold' | 'isItalic' | 'isUnderlined') { if (selectedElement?.type === 'text' && selectedElementId !== null) updateElement(selectedElementId, { [styleProp]: !selectedElement[styleProp] }, true); }
	function changeTextAlign(align: 'left' | 'center' | 'right' | 'justify') { if (selectedElement?.type === 'text' && selectedElementId !== null) updateElement(selectedElementId, { textAlign: align }, true); }
	function changeFontSize(delta: number) { if (selectedElement?.type === 'text' && selectedElementId !== null) { const newSize = Math.max(8, Math.min(120, selectedElement.fontSize + delta)); updateElement(selectedElementId, { fontSize: newSize }, true); } }
    function updateFontSizeFromInput(event: Event) { if (selectedElement?.type === 'text' && selectedElementId !== null) { const input = event.target as HTMLInputElement; let newSize = parseInt(input.value); if (!isNaN(newSize)) { newSize = Math.max(8, Math.min(120, newSize)); updateElement(selectedElementId, { fontSize: newSize }, true); if (parseInt(input.value) !== newSize) input.value = newSize.toString(); } else { input.value = selectedElement.fontSize.toString(); } } }
    function formatList(command: 'insertUnorderedList' | 'insertOrderedList') { if (!browser || !selectedElement || selectedElement.type !== 'text' || selectedElementId === null) return; const draggableElement = document.querySelector(`[data-element-id="${selectedElementId}"] .text-content`); if (draggableElement && draggableElement instanceof HTMLElement) { draggableElement.focus(); document.execCommand(command, false); setTimeout(() => { if (selectedElementId !== null) updateElement(selectedElementId, { content: draggableElement.innerHTML }, true); }, 0); } }
    function stopToolbarClick(event: MouseEvent) { event.stopPropagation(); }

	// --- ATAJOS DE TECLADO ---
	function handleKeyDown(event: KeyboardEvent) { if ((event.target as HTMLElement)?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return; if (event.ctrlKey || event.metaKey) { if (event.key === 'z') { event.preventDefault(); undo(); } else if (event.key === 'y' || (event.shiftKey && event.key === 'Z')) { event.preventDefault(); redo(); } else if (event.key === 'b') { event.preventDefault(); toggleStyle('isBold'); } else if (event.key === 'i') { event.preventDefault(); toggleStyle('isItalic'); } else if (event.key === 'u') { event.preventDefault(); toggleStyle('isUnderlined'); } } else if (event.key === 'Delete' || event.key === 'Backspace') { if (selectedElementId !== null) { event.preventDefault(); deleteSelected(); } } }
	$effect(() => { if (browser) { document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); } });

</script>

<svelte:head>
	<title>Editor - {templateId} - DUA-Conecta</title>
</svelte:head>

<main class="editor-layout" onclick={deselect}>
	<aside class="editor-sidebar">
		<a href="/dashboard/plantillas" class="back-button">
			<svg width="18" height="18" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
			<span>Volver</span>
		</a>
		<div class="tool-section history-controls">
			<button class="icon-button" onclick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)"><svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg></button>
			<button class="icon-button" onclick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)"><svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
		</div>
		<div class="tool-section">
			<h3>Añadir</h3>
			<button class="btn-secondary" onclick={addText}>+ Texto</button>
			<label for="image-upload" class="btn-secondary btn-upload">+ Imagen</label>
			<input type="file" id="image-upload" accept="image/*" onchange={handleFileInput} />
		</div>
		{#if selectedElement}
			<div class="tool-section">
				<h3>Seleccionado</h3>
				{#if selectedElement.type === 'image'}<p class="prop-label" style="margin-top:0;">Imagen</p><p style="font-size: 0.8rem; color: var(--text-light);">Arrastra para mover, usa la esquina para redimensionar.</p>{/if}
				{#if selectedElement.type === 'text'}<p class="prop-label" style="margin-top:0;">Texto</p><p style="font-size: 0.8rem; color: var(--text-light);">Edita en la barra superior.</p>{/if}
				<button class="btn-secondary btn-delete" onclick={deleteSelected} title="Eliminar (Supr/Borrar)">Eliminar</button>
			</div>
		{/if}
		<div class="tool-section actions">
			<h3>Acciones</h3>
			<button class="btn-secondary" onclick={saveChanges} disabled={!hasUnsavedChanges}>{#if hasUnsavedChanges}Guardar{:else}Guardado ✓{/if}</button>
			<button class="btn-primary" onclick={downloadPdf}>Descargar PDF</button>
		</div>
	</aside>

	<div class="editor-main-area">
		{#if selectedElement?.type === 'text'}
            <div class="text-toolbar" role="toolbar" aria-label="Herramientas de texto" onclick={stopToolbarClick} onmousedown={stopToolbarClick}>
				 <select class="toolbar-select" value={selectedElement.fontFamily} onchange={(e) => updateElement(selectedElementId!, { fontFamily: e.currentTarget.value }, true)}> {#each availableFonts as font}<option value={font} style:font-family={font}>{font}</option>{/each} </select>
				<div class="font-size-control"> <button class="icon-button" onclick={() => changeFontSize(-1)} title="Reducir tamaño" disabled={selectedElement.fontSize <= 8}><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13H5v-2h14v2z"></path></svg></button> <input type="number" class="toolbar-input font-size-input" min="8" max="120" step="1" value={selectedElement.fontSize} onchange={updateFontSizeFromInput} onblur={updateFontSizeFromInput} onkeydown={(e) => { if(e.key === 'Enter') { e.preventDefault(); updateFontSizeFromInput(e); (e.target as HTMLElement).blur();} }}/> <button class="icon-button" onclick={() => changeFontSize(1)} title="Aumentar tamaño" disabled={selectedElement.fontSize >= 120}><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg></button> </div>
				<label class="icon-button color-label" title="Color de texto"> <svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.75 11.25a.75.75 0 000-1.5h-11.5a.75.75 0 000 1.5h11.5zm.75 1.5a.75.75 0 01-.75.75H6a.75.75 0 010-1.5h11.75a.75.75 0 01.75.75zm0 3a.75.75 0 01-.75.75H6a.75.75 0 010-1.5h11.75a.75.75 0 01.75.75zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zM12 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"></path></svg> <input type="color" class="color-picker-hidden" value={selectedElement.color} oninput={(e) => updateElement(selectedElementId!, { color: e.currentTarget.value }, true)} /> <div class="color-indicator" style:background-color={selectedElement.color || '#000000'}></div> </label>
				<button class="icon-button" class:active={selectedElement.isBold} onclick={() => toggleStyle('isBold')} title="Negrita (Ctrl+B)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4.25-4H7v14h7.04c2.1 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"></path></svg></button>
				<button class="icon-button" class:active={selectedElement.isItalic} onclick={() => toggleStyle('isItalic')} title="Cursiva (Ctrl+I)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"></path></svg></button>
				<button class="icon-button" class:active={selectedElement.isUnderlined} onclick={() => toggleStyle('isUnderlined')} title="Subrayado (Ctrl+U)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"></path></svg></button>
				<div class="toolbar-separator"></div>
                <button class="icon-button" onclick={() => formatList('insertUnorderedList')} title="Lista con viñetas"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h2v2H4zm0 6h2v2H4zm0 6h2v2H4zm4 1h14v2H8zm0-6h14v2H8zm0-6h14v2H8z"></path></svg></button>
                <button class="icon-button" onclick={() => formatList('insertOrderedList')} title="Lista numerada"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 11.9V11H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"></path></svg></button>
				<div class="toolbar-separator"></div>
				<button class="icon-button" class:active={selectedElement.textAlign === 'left'} onclick={() => changeTextAlign('left')} title="Alinear Izquierda"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"></path></svg></button>
				<button class="icon-button" class:active={selectedElement.textAlign === 'center'} onclick={() => changeTextAlign('center')} title="Centrar"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"></path></svg></button>
				<button class="icon-button" class:active={selectedElement.textAlign === 'right'} onclick={() => changeTextAlign('right')} title="Alinear Derecha"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"></path></svg></button>
                <button class="icon-button" class:active={selectedElement.textAlign === 'justify'} onclick={() => changeTextAlign('justify')} title="Justificar"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"></path></svg></button>
			</div>
		{/if}

		<div class="editor-canvas-area" onclick={deselect}>
			<div class="canvas-container" onmousedown={deselect}>
				{#each elements as element (element.id)}
                    <Draggable
                        data-element-id={element.id}
                        element={element}
                        isSelected={element.id === selectedElementId}
                        onSelect={selectElement}
                        onUpdate={updateElement}
                        allElements={elements}
                        onShowSnapLine={handleShowSnapLine}
                    />
				{/each}
				{#if verticalSnapLine !== null}<div class="snap-line vertical" style:left="{verticalSnapLine}px"></div>{/if}
				{#if horizontalSnapLine !== null}<div class="snap-line horizontal" style:top="{horizontalSnapLine}px"></div>{/if}
			</div>
		</div>
	</div>
</main>

<style>
	.editor-layout { display: flex; height: 100vh; overflow: hidden; }
	.editor-sidebar { width: 280px; flex-shrink: 0; background-color: var(--bg-card); border-right: 1px solid var(--border-color); padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
	.back-button { text-decoration: none; color: var(--text-light); font-weight: 600; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0rem; transition: color 0.2s ease; }
    .back-button svg { flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
	.back-button:hover { color: var(--primary-color); }
	.history-controls { display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
	.icon-button { width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; padding: 0; background-color: var(--bg-section); border: 1px solid var(--border-color); color: var(--text-light); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;}
	.icon-button svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; width: 18px; height: 18px;}
	.icon-button:hover:not(:disabled) { border-color: var(--primary-color); color: var(--primary-color); background-color: transparent; }
	.icon-button:disabled { opacity: 0.5; cursor: not-allowed; }
	.tool-section h3 { font-size: 1rem; font-weight: 700; color: var(--text-dark); margin: 0 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
	.editor-sidebar button:not(.icon-button), .editor-sidebar .btn-upload { width: 100%; text-align: center; padding: 0.6rem 1rem; font-size: 0.85rem; margin-bottom: 0.5rem; }
	.editor-sidebar input[type="file"] { display: none; }
	.prop-label { font-size: 0.85rem; font-weight: 600; color: var(--text-light); margin-top: 0.8rem; margin-bottom: 0.3rem; display: block; }
	.btn-delete { background-color: #f15e5e; color: white; border-color: #f15e5e; margin-top: 1rem; }
	.btn-delete:hover { background-color: #e53e3e; border-color: #e53e3e; }
	.actions { margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
	.actions button:first-child { margin-bottom: 0.75rem; }
    .editor-main-area { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; background-color: var(--bg-section); }
    .text-toolbar { position: absolute; top: 1rem; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.5rem; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 1001; white-space: nowrap; }
    .toolbar-select, .toolbar-input { padding: 0.2rem 0.4rem; border-radius: 4px; border: 1px solid var(--border-color); background-color: var(--bg-section); color: var(--text-dark); font-size: 0.75rem; height: 28px; box-sizing: border-box; outline: none; }
    .toolbar-select { min-width: 80px; }
    .font-size-control { display: flex; align-items: center; background-color: var(--bg-section); border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; }
    .font-size-control .icon-button { border: none; border-radius: 0; background-color: transparent; width: 26px; height: 26px; color: var(--text-light); }
    .font-size-control .icon-button:hover:not(:disabled) { background-color: rgba(0,0,0,0.05); color: var(--primary-color);}
    .font-size-control .icon-button:disabled { opacity: 0.4; }
    .font-size-control .icon-button svg { width: 16px; height: 16px; }
    .font-size-input { width: 35px; text-align: center; margin: 0; padding: 0.2rem; border: none; height: 26px; background-color: transparent; }
    .font-size-input::-webkit-outer-spin-button, .font-size-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .font-size-input { -moz-appearance: textfield; }
    .text-toolbar .icon-button { width: 28px; height: 28px; background-color: transparent; border-color: transparent; }
    .text-toolbar .icon-button svg { width: 18px; height: 18px; fill: currentColor; }
    .text-toolbar .icon-button:hover:not(:disabled) { background-color: var(--bg-section); color: var(--primary-color); border-color: transparent;}
    .text-toolbar .icon-button.active { background-color: var(--primary-color); color: var(--text-on-primary); border-color: var(--primary-color);}
    .color-label { position: relative; border: 1px solid var(--border-color); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2px; box-sizing: border-box;}
    .color-label svg { width: 16px; height: 12px; margin-bottom: 1px; fill: currentColor; }
    .color-label:hover { background-color: var(--bg-section); }
    .color-picker-hidden { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
    .color-indicator { width: 100%; height: 4px; border-radius: 1px; margin-top: auto; border: 1px solid rgba(0,0,0,0.1); box-sizing: border-box;}
    .toolbar-separator { width: 1px; height: 18px; background-color: var(--border-color); margin: 0 0.3rem; }
    .editor-canvas-area { flex-grow: 1; display: flex; justify-content: center; align-items: flex-start; padding: 2rem; padding-top: 70px; overflow: auto; background-color: var(--bg-section); }
    .canvas-container { position: relative; width: 700px; height: 990px; background-color: white; box-shadow: 0 10px 30px rgba(0,0,0,0.15); overflow: hidden; border: 1px solid #ccc; flex-shrink: 0; }
    .snap-line { position: absolute; background-color: #ff4d4d; z-index: 10000; pointer-events: none; }
    .snap-line.vertical { width: 1px; height: 100%; top: 0; }
    .snap-line.horizontal { height: 1px; width: 100%; left: 0; }
</style>