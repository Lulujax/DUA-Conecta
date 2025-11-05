<script lang="ts">
	// --- IMPORTS ---
	import { page } from '$app/stores';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import Draggable from '$lib/editor/Draggable.svelte';
	import { browser } from '$app/environment';
	import { tick } from 'svelte';
	import html2canvas from 'html2canvas';
	import { jsPDF } from 'jspdf';
	import { user } from '$lib/stores/auth';
	import { PUBLIC_API_URL } from '$env/static/public';

    // --- PROPS ---
	let {
		templateId,
		baseElements
	} = $props<{
		templateId: string;
		baseElements: Array<any>;
	}>();
    
	// Lógica de carga de actividad
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

	let currentActivityId = $state<number | null>(initialActivityId);
    let activityName = $state<string>(initialActivityName);
    
	let selectedElementId = $state<number | null>(null);
	let canvasContainerRef: HTMLDivElement | null = $state(null);
	let verticalSnapLine = $state<number | null>(null);
	let horizontalSnapLine = $state<number | null>(null);
	function handleShowSnapLine(line: { type: 'vertical' | 'horizontal'; position: number | null }) {
		if (line.type === 'vertical') verticalSnapLine = line.position;
		else horizontalSnapLine = line.position;
	}

    // (La variable 'activePanel' de la fase anterior ha sido eliminada)

	// --- FUENTES DISPONIBLES ---
	const availableFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Anton', 'Oswald'];

	// --- LÓGICA DE HISTORIAL ---
	let elements = $state(structuredClone(baseElements));
	let history: Array<string> = $state([JSON.stringify(elements)]);
	let historyIndex = $state(0);
	let applyingHistory = $state(false);
	let nextZIndex = $state(elements.length + 1);

    $effect(() => {
        if (currentActivityId && browser) {
            loadActivity(currentActivityId);
        }
    });

	async function loadActivity(id: number) {
        const currentUser = $user;
		if (!currentUser || !currentUser.token) {
            alert("No autenticado. Imposible cargar actividad.");
			return;
        }

        try {
            const response = await fetch(`${PUBLIC_API_URL}/api/activities/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${currentUser.token}` }
            });
            if (!response.headers.get('content-type')?.includes('application/json')) {
                 throw new Error(`Respuesta inesperada del servidor. Código: ${response.status}`);
			}
			const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al cargar la actividad.');
			}

            const loadedElements = result.activity.elements.map((el: any, i: number) => ({
                ...el,
                z: el.z || i + 1
            }));
			elements = loadedElements;
            nextZIndex = loadedElements.length + 2;

			activityName = result.activity.name;
            currentActivityId = id;
            const currentStateString = JSON.stringify(elements);
			history = [currentStateString];
            historyIndex = 0;
            hasUnsavedChanges = false;
            
        } catch (error) {
            console.error('Fallo al cargar la actividad:', error);
			let errorMsg = 'Error al cargar la actividad guardada.';
             if (error instanceof SyntaxError) {
                 errorMsg += " Respuesta inesperada del servidor.";
			} else if (error instanceof Error) {
                 errorMsg += ` ${error.message}`;
			}
             alert(`${errorMsg} Se ha cargado la plantilla base.`);
            
			elements = structuredClone(baseElements);
			currentActivityId = null;
        }
    }

	function saveStateToHistory() {
		if (applyingHistory) return;
		const currentStateString = JSON.stringify(elements);
		if (currentStateString === history[historyIndex]) return;
		const nextHistory = history.slice(0, historyIndex + 1);
		nextHistory.push(currentStateString);
		history = nextHistory;
		historyIndex = history.length - 1;
		if (history.length > 50) { history.shift(); historyIndex--; history = [...history];}
		hasUnsavedChanges = true;
	}
	async function loadStateFromHistory(index: number) {
		if (index < 0 || index >= history.length) return;
		applyingHistory = true;
		elements = JSON.parse(history[index]);
		historyIndex = index;
		selectedElementId = null;
		hasUnsavedChanges = (index > 0);
		await tick();
		applyingHistory = false;
	}
	function undo() { if (historyIndex > 0) loadStateFromHistory(historyIndex - 1);
	}
	function redo() { if (historyIndex < history.length - 1) loadStateFromHistory(historyIndex + 1); }

	let canUndo = $derived(historyIndex > 0);
	let canRedo = $derived(historyIndex < history.length - 1);

	let selectedElement = $derived(elements.find((el) => el.id === selectedElementId) || null);
	let hasUnsavedChanges = $state(false);

	function updateElement(id: number, data: any, isFinalChange: boolean = true) {
		const index = elements.findIndex((el) => el.id === id);
		if (index !== -1) {
			if (elements[index].type === 'image' && data.width !== undefined && data.height === undefined) {
				const oldWidth = elements[index].width;
				const oldHeight = elements[index].height; if (oldWidth > 0 && oldHeight > 0) data.height = data.width / (oldWidth / oldHeight);
			} else if (elements[index].type === 'image' && data.height !== undefined && data.width === undefined) {
				const oldWidth = elements[index].width;
				const oldHeight = elements[index].height; if (oldWidth > 0 && oldHeight > 0) data.width = data.height * (oldWidth / oldHeight);
			}

			const currentZ = elements[index].z;
			elements = elements.map((el, i) => i === index ? { ...el, ...data, z: data.z ?? currentZ } : el);
			if (isFinalChange) { saveStateToHistory(); }
			if (!applyingHistory) hasUnsavedChanges = true;
		}
	}
	function selectElement(id: number, e: MouseEvent | KeyboardEvent) { 
        e.stopPropagation();
		selectedElementId = id;
        const index = elements.findIndex((el) => el.id === id);
		if (index !== -1) {
            const updatedElement = { ...elements[index], z: nextZIndex++ };
			elements = elements.map((el, i) => i === index ? updatedElement : el);
		}
    }
	function deselect(e: MouseEvent) { const target = e.target as HTMLElement;
	if (target.classList.contains('canvas-container') || target.classList.contains('editor-canvas-area')) selectedElementId = null; }

	function handleDragOver(e: DragEvent) { e.preventDefault();
	}
	function handleDrop(e: DragEvent) { e.preventDefault();
	if (e.dataTransfer?.files?.[0]) { const canvasRect = (e.currentTarget as HTMLElement).querySelector('.canvas-container')?.getBoundingClientRect(); if (!canvasRect) return;
		const x = e.clientX - canvasRect.left;
		const y = e.clientY - canvasRect.top; handleFile(e.dataTransfer.files[0], x, y);
	} }
	function handleFileInput(e: Event) { const input = e.target as HTMLInputElement;
	if (input.files?.[0]) handleFile(input.files[0]); input.value = '';
	}
	function handleFile(file: File, x = 50, y = 50) { if (!file.type.startsWith('image/')) { alert('Por favor, sube solo archivos de imagen.');
	return; } const reader = new FileReader(); reader.onload = (e) => { const url = e.target?.result as string;
	const img = new Image(); img.onload = () => { const aspect = img.width / img.height; const maxWidth = 150;
	const initialWidth = Math.min(maxWidth, img.width); const initialHeight = aspect > 0 ? initialWidth / aspect : 150;
	const finalX = Math.max(0, x - initialWidth / 2); const finalY = Math.max(0, y - initialHeight / 2);
	elements = [...elements, { id: Date.now(), type: 'image', url, x: finalX, y: finalY, width: initialWidth, height: initialHeight, z: nextZIndex++ }];
	saveStateToHistory(); }; img.onerror = () => { alert('Error al cargar la imagen.'); }; img.src = url; };
	reader.onerror = () => { alert('Error al leer el archivo.'); }; reader.readAsDataURL(file);
	}

	function addText() { elements = [...elements, { id: Date.now(), type: 'text', content: 'Nuevo Texto', x: 50, y: 50, width: 200, height: 30, fontSize: 16, color: '#000000', textAlign: 'left', isBold: false, fontFamily: 'Arial', isItalic: false, isUnderlined: false, z: nextZIndex++ }];
	selectedElementId = elements[elements.length - 1].id; saveStateToHistory(); }
	function deleteSelected() { if(selectedElementId === null) return; elements = elements.filter((el) => el.id !== selectedElementId);
	selectedElementId = null; saveStateToHistory(); }
	
	function addShape(type: 'arrow' | 'line' | 'circle' | 'rectangle') {
		const id = Date.now();
		let shapeDefaults: any = {
			id,
			type: 'shape',
			shapeType: type,
			x: 100,
			y: 100,
			width: (type === 'circle' || type === 'rectangle') ? 80 : 140, 
			height: (type === 'circle' || type === 'rectangle') ? 80 : 20, 
			stroke: '#000000',
			fill: type === 'rectangle' ? '#EEEEEE' : 'transparent', 
			strokeWidth: 4,
			rotation: 0,
			z: nextZIndex++
		};
		elements = [...elements, shapeDefaults];
		selectedElementId = id;
		saveStateToHistory();
	}

	async function saveChanges() {
        const currentUser = $user;
		if (!currentUser || !currentUser.token) {
            alert("No estás autenticado. Por favor, inicia sesión.");
			return;
        }
        
        let targetUrl: string;
		let method: 'POST' | 'PUT';
        let nameToSave = activityName.trim();

        if (currentActivityId) {
            targetUrl = `${PUBLIC_API_URL}/api/activities/${currentActivityId}`;
			method = 'PUT';
        } else {
            const inputName = prompt("Ingresa un nombre para guardar tu nueva actividad:", activityName);
			if (!inputName || inputName.trim() === "") {
                alert("El guardado fue cancelado. Debes proporcionar un nombre.");
				return;
            }
            nameToSave = inputName.trim();
            targetUrl = `${PUBLIC_API_URL}/api/activities/save`;
			method = 'POST';
        }

        const payload = {
            name: nameToSave,
            templateId: templateId, // <-- Usa la prop
            elements: elements,
        };
		try {
            const response = await fetch(targetUrl, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
				},
                body: JSON.stringify(payload),
            });
            if (!response.headers.get('content-type')?.includes('application/json')) {
                 throw new Error(`Respuesta inesperada del servidor. Código: ${response.status}`);
			}
			const body = await response.json();
            
            if (!response.ok) {
                throw new Error(body.error || `Error ${method === 'PUT' ? 'al actualizar' : 'al guardar'} la actividad.`);
			}

            if (method === 'POST' && body.activityId) {
                currentActivityId = body.activityId;
			}
            
            activityName = nameToSave;
            hasUnsavedChanges = false; 
            history = [JSON.stringify(elements)];
			historyIndex = 0;
            alert(body.message || `¡Actividad "${activityName}" guardada con éxito!`);
		} catch (error) {
            console.error('Error en el guardado:', error);
			let errorMsg = 'Fallo al guardar/actualizar la actividad:';
             if (error instanceof SyntaxError) {
                 errorMsg += " Respuesta inesperada del servidor.";
			} else if (error instanceof Error) {
                 errorMsg += ` ${error.message}`;
			}
             alert(errorMsg);
		}
	}
    
	async function downloadPdf() {
        if (!canvasContainerRef) {
            console.error('No se encontró el contenedor del canvas.');
			alert('Error: No se encontró el área de diseño.');
            return;
        }
        selectedElementId = null;
		verticalSnapLine = null;
        horizontalSnapLine = null;
        await tick();

        const options = {
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#FFFFFF', 
            scrollY: -window.scrollY, 
            scrollX: -window.scrollX,
            windowWidth: canvasContainerRef.scrollWidth,
			windowHeight: canvasContainerRef.scrollHeight
        };
		try {
            const canvas = await html2canvas(canvasContainerRef, options);
			const imgData = canvas.toDataURL('image/jpeg', 1.0); 

            const pdf = new jsPDF('p', 'px', 'a4'); 
            const pdfWidth = pdf.internal.pageSize.getWidth();
			const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
            pdf.save(`DUA-Conecta_Actividad_${activityName.replace(/\s/g, '_')}.pdf`);

            alert('¡PDF generado con éxito!');
		} catch (error) {
            console.error('Error al generar PDF:', error);
			alert('Error al generar PDF. Revisa la consola.');
        }
    }

	let blockNavigation = false;
	beforeNavigate(({ cancel }) => { if (hasUnsavedChanges && blockNavigation) { if (!confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) cancel(); else hasUnsavedChanges = false; } if (!hasUnsavedChanges || !cancel) blockNavigation = false; });
	afterNavigate(() => { setTimeout(() => { blockNavigation = true; }, 0); });
	
	function toggleStyle(styleProp: 'isBold' | 'isItalic' | 'isUnderlined') { if (selectedElement?.type === 'text' && selectedElementId !== null) updateElement(selectedElementId, { [styleProp]: !selectedElement[styleProp] }, true);
	}
	function changeTextAlign(align: 'left' | 'center' | 'right' | 'justify') { if (selectedElement?.type === 'text' && selectedElementId !== null) updateElement(selectedElementId, { textAlign: align }, true);
	}
	function changeFontSize(delta: number) { if (selectedElement?.type === 'text' && selectedElementId !== null) { const newSize = Math.max(8, Math.min(120, selectedElement.fontSize + delta));
	updateElement(selectedElementId, { fontSize: newSize }, true); } }
	function updateFontSizeFromInput(event: Event) { if (selectedElement?.type === 'text' && selectedElementId !== null) { const input = event.target as HTMLInputElement;
	let newSize = parseInt(input.value); if (!isNaN(newSize)) { newSize = Math.max(8, Math.min(120, newSize)); updateElement(selectedElementId, { fontSize: newSize }, true);
	if (parseInt(input.value) !== newSize) input.value = newSize.toString(); } else { input.value = selectedElement.fontSize.toString();
	} } }

	async function formatList(command: 'insertUnorderedList' | 'insertOrderedList') {
		if (!browser || !selectedElement || selectedElement.type !== 'text' || selectedElementId === null) return;
		const normalized = command === 'insertUnorderedList' ? 'ul' : 'ol';
		const wrapper = document.querySelector(`[data-element-id="${selectedElementId}"]`);
		if (!wrapper) return;
		wrapper.dispatchEvent(new CustomEvent('toggle-list', { detail: { type: normalized }, bubbles: true }));
	}

	function stopToolbarClick(event: MouseEvent) { event.stopPropagation();
	}

	function handleKeyDown(event: KeyboardEvent) { if ((event.target as HTMLElement)?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement)?.tagName)) return;
	if (event.ctrlKey || event.metaKey) { if (event.key === 'z') { event.preventDefault(); undo();
	} else if (event.key === 'y' || (event.shiftKey && event.key === 'Z')) { event.preventDefault(); redo();
	} else if (event.key === 'b') { event.preventDefault(); toggleStyle('isBold'); } else if (event.key === 'i') { event.preventDefault(); toggleStyle('isItalic');
	} else if (event.key === 'u') { event.preventDefault(); toggleStyle('isUnderlined'); } } else if (event.key === 'Delete' || event.key === 'Backspace') { if (selectedElementId !== null) { event.preventDefault();
	deleteSelected(); } } }
	$effect(() => { if (browser) { document.addEventListener('keydown', handleKeyDown); return () => document.removeEventListener('keydown', handleKeyDown); } });
</script>

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
        
        <div class="tool-section add-panel">
			<h3>Añadir</h3>
			<button class="add-panel-button" onclick={addText}>+ Texto</button>
			<label for="image-upload" class="add-panel-button btn-upload">+ Imagen</label>
			<input type="file" id="image-upload" accept="image/*" onchange={handleFileInput} />
			
            <div class="add-panel-separator"></div>

            <button class="add-panel-button" onclick={() => addShape('flecha')}>+ Flecha</button>
			<button class="add-panel-button" onclick={() => addShape('line')}>+ Línea</button>
			<button class="add-panel-button" onclick={() => addShape('circle')}>+ Círculo</button>
			<button class="add-panel-button" onclick={() => addShape('rectangle')}>+ Rectángulo</button>
		</div>
        {#if selectedElement}
			<div class="tool-section">
				<h3>Seleccionado</h3>
				{#if selectedElement.type === 'image'}<p class="prop-label" style="margin-top:0;">Imagen</p><p style="font-size: 0.8rem; color: var(--text-light);">Arrastra para mover, usa la esquina para redimensionar.</p>{/if}
				{#if selectedElement.type === 'text'}<p class="prop-label" style="margin-top:0;">Texto</p><p style="font-size: 0.8rem; color: var(--text-light);">Edita en la barra superior.</p>{/if}
				{#if selectedElement.type === 'shape'}
					<p class="prop-label" style="margin-top:0;">Forma</p>
					<label style="display:flex;gap:8px;align-items:center;">
						Tipo:
						<select value={selectedElement.shapeType} onchange={(e) => updateElement(selectedElementId!, { shapeType: (e.currentTarget as HTMLSelectElement).value }, true)}>
							<option value="arrow">Flecha</option>
							<option value="line">Línea</option>
							<option value="circle">Círculo</option>
							<option value="rectangle">Rectángulo</option>
						</select>
					</label>
					<label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
						Color (Borde):
						<input type="color" value={selectedElement.stroke || '#000000'} oninput={(e) => updateElement(selectedElementId!, { stroke: (e.currentTarget as HTMLInputElement).value }, true)} />
					</label>
                    {#if selectedElement.shapeType === 'rectangle' || selectedElement.shapeType === 'circle'}
                        <label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
                            Color (Relleno):
                            <input type="color" value={selectedElement.fill || '#000000'} oninput={(e) => updateElement(selectedElementId!, { fill: (e.currentTarget as HTMLInputElement).value }, true)} />
                        </label>
                    {/if}
					<label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
						Grosor:
						<input type="number" min="1" max="40" value={selectedElement.strokeWidth || 4} onchange={(e) => updateElement(selectedElementId!, { strokeWidth: parseInt((e.currentTarget as HTMLInputElement).value) || 1 }, true)} />
					</label>
					<label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
						Rotación:
						<input type="range" min="0" max="360" value={selectedElement.rotation || 0} onchange={(e) => updateElement(selectedElementId!, { rotation: parseInt((e.currentTarget as HTMLInputElement).value) || 0 }, true)} />
						<span style="width:36px;text-align:center">{selectedElement.rotation || 0}°</span>
					</label>
				{/if}
				<button class="btn-secondary btn-delete" onclick={deleteSelected} title="Eliminar (Supr/Borrar)">Eliminar</button>
			</div>
		{/if}
		<div class="tool-section actions">
			<h3>Acciones</h3>
			<button class="btn-secondary" onclick={saveChanges} disabled={!hasUnsavedChanges}>
                {#if hasUnsavedChanges}
                    {currentActivityId ? 'Actualizar' : 'Guardar Nueva'}
                {:else}
                    Guardado ✓
                {/if}
            </button>
			<button class="btn-primary" onclick={downloadPdf}>Descargar PDF</button>
		</div>
	</aside>

	<div class="editor-main-area">
		{#if selectedElement?.type === 'text'}
            <div class="text-toolbar" role="toolbar" aria-label="Herramientas de texto" onclick={stopToolbarClick} onmousedown={stopToolbarClick}>
				 <select class="toolbar-select" value={selectedElement.fontFamily} onchange={(e) => updateElement(selectedElementId!, { fontFamily: e.currentTarget.value }, true)}>
                    {#each availableFonts as font}
                        <option value={font} style:font-family={font}>{font}</option>
                    {/each}
                 </select>
				<div class="font-size-control">
					<button class="icon-button" onclick={() => changeFontSize(-1)} title="Reducir tamaño" disabled={selectedElement.fontSize <= 8}><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13H5v-2h14v2z"></path></svg></button>
					<input type="number" class="toolbar-input font-size-input" min="8" max="120" step="1" value={selectedElement.fontSize} onchange={updateFontSizeFromInput} onblur={updateFontSizeFromInput} onkeydown={(e) => { if(e.key === 'Enter') { e.preventDefault(); updateFontSizeFromInput(e); (e.target as HTMLElement).blur();} }}/>
					<button class="icon-button" onclick={() => changeFontSize(1)} title="Aumentar tamaño" disabled={selectedElement.fontSize >= 120}><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg></button>
				</div>
				<label class="icon-button color-label" title="Color de texto">
					<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.75 11.25a.75.75 0 000-1.5h-11.5a.75.75 0 000 1.5h11.5zm.75 1.5a.75.75 0 01-.75.75H6a.75.75 0 010-1.5h11.75a.75.75 0 01.75.75zm0 3a.75.75 0 01-.75.75H6a.75.75 0 010-1.5h11.75a.75.75 0 01.75.75zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zM12 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"></path></svg>
					<input type="color" class="color-picker-hidden" value={selectedElement.color} oninput={(e) => updateElement(selectedElementId!, { color: e.currentTarget.value }, true)} />
					<div class="color-indicator" style:background-color={selectedElement.color || '#000000'}></div>
				</label>
				<button class="icon-button" class:active={selectedElement.isBold} onclick={() => toggleStyle('isBold')} title="Negrita (Ctrl+B)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4.25-4H7v14h7.04c2.1 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"></path></svg></button>
				<button class="icon-button" class:active={selectedElement.isItalic} onclick={() => toggleStyle('isItalic')} title="Cursiva (Ctrl+I)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"></path></svg></button>
				<button class="icon-button" class:active={selectedElement.isUnderlined} onclick={() => toggleStyle('isUnderlined')} title="Subrayado (Ctrl+U)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"></path></svg></button>
				<div class="toolbar-separator"></div>

				<button class="icon-button" onclick={(e) => { e.preventDefault(); e.stopPropagation(); formatList('insertUnorderedList'); }} title="Lista con viñetas"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h2v2H4zm0 6h2v2H4zm0 6h2v2H4zm4 1h14v2H8zm0-6h14v2H8zm0-6h14v2H8z"></path></svg></button>
				<button class="icon-button" class:active={false} onclick={(e) => { e.preventDefault(); e.stopPropagation(); formatList('insertOrderedList'); }} title="Lista numerada"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 11.9V11H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"></path></svg></button>
				<div class="toolbar-separator"></div>
				<button class="icon-button" class:active={selectedElement?.textAlign === 'left'} onclick={() => changeTextAlign('left')} title="Alinear Izquierda"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"></path></svg></button>
				<button class="icon-button" class:active={selectedElement?.textAlign === 'center'} onclick={() => changeTextAlign('center')} title="Centrar"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"></path></svg></button>
				<button class="icon-button" class:active={selectedElement?.textAlign === 'right'} onclick={() => changeTextAlign('right')} title="Alinear Derecha"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"></path></svg></button>
				<button class="icon-button" class:active={selectedElement?.textAlign === 'justify'} onclick={() => changeTextAlign('justify')} title="Justificar"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"></path></svg></button>
			</div>
		{/if}

		<div class="editor-canvas-area" onclick={deselect} ondragover={handleDragOver} ondrop={handleDrop}>
			<div class="canvas-container" onmousedown={deselect} bind:this={canvasContainerRef}>
				{#each elements as element (element.id)}
					<Draggable
						data-element-id={element.id}
						element={element}
						isSelected={element.id === selectedElementId}
						onSelect={selectElement}
						onUpdate={updateElement}
						allElements={elements}
						onShowSnapLine={handleShowSnapLine} />
				{/each}
				{#if verticalSnapLine !== null}<div class="snap-line vertical" style:left="{verticalSnapLine}px"></div>{/if}
				{#if horizontalSnapLine !== null}<div class="snap-line horizontal" style:top="{horizontalSnapLine}px"></div>{/if}
			</div>
		</div>
	</div>
</main>

<style>
    /* ... (Todos los estilos existentes de Fase 1) ... */
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
	
    /* --- *** INICIO DEL CAMBIO (CSS) *** --- */
    /* (Se eliminan los estilos antiguos de .btn-secondary y .btn-upload de la barra lateral) */
    
    .add-panel {
        display: flex;
        flex-direction: column;
        gap: 0.75rem; /* Espacio entre botones */
    }
    .add-panel-button {
        display: flex; /* Cambiado a flex para centrar */
        justify-content: center;
        align-items: center;
        width: 100%;
        padding: 0.75rem 1rem;
        margin: 0; /* Reseteo de margen */
        font-size: 0.9rem;
        font-weight: 600;
        
        /* Estilos de tu captura de pantalla */
        background-color: var(--bg-card);
        color: var(--text-light);
        border: 2px solid var(--border-color); /* Borde sutil */
        border-radius: 50px; /* Completamente redondeado */
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .add-panel-button:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
        background-color: var(--bg-section); /* Ligero fondo al pasar el ratón */
    }
    .add-panel-separator {
        height: 1px;
        background-color: var(--border-color);
        margin: 0.5rem 0;
    }
    /* --- *** FIN DEL CAMBIO (CSS) *** --- */

	.editor-sidebar input[type="file"] { display: none; }
	.prop-label { font-size: 0.85rem; font-weight: 600; color: var(--text-light); margin-top: 0.8rem; margin-bottom: 0.3rem; display: block; }
	.btn-delete { background-color: #f15e5e; color: white; border-color: #f15e5e; margin-top: 1rem; }
	.btn-delete:hover { background-color: #e53e3e; border-color: #e53e3e; }
	.actions { margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
	/* Estilos de botones de Acciones (Guardar, PDF) se mantienen */
    .actions .btn-secondary, .actions .btn-primary {
        width: 100%;
        text-align: center;
        padding: 0.6rem 1rem;
        font-size: 0.85rem;
        margin: 0 0 0.75rem 0;
    }
    
    /* ... (resto de estilos del editor, canvas, etc. se mantienen igual) ... */
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
    .shape-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .shape-button { background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; width: 100%; height: 40px; display: flex; justify-content: center; align-items: center; cursor: pointer; transition: all 0.2s ease; color: var(--text-light); }
    .shape-button:hover { border-color: var(--primary-color); color: var(--primary-color); }
    .shape-button svg { width: 24px; height: 24px; stroke-width: 2.5; }
    .shape-properties, .general-properties { padding: 0.5rem 0; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); margin: 1rem 0; }
    .shape-properties input[type="color"] { width: 100%; height: 35px; border: 1px solid var(--border-color); border-radius: 8px; padding: 0; background: none; cursor: pointer; }
    .shape-properties input[type="range"], .general-properties input[type="range"] { width: 100%; margin-top: 0.5rem; }
    .font-size-control { display: flex; align-items: center; background-color: var(--bg-section); border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; }
    .font-size-control .icon-button { border: none; border-radius: 0; background-color: transparent; width: 26px; height: 26px; color: var(--text-light); }
    .font-size-control .icon-button:hover:not(:disabled) { background-color: rgba(0,0,0,0.05); color: var(--primary-color); }
    .font-size-control .icon-button:disabled { opacity: 0.4; }
    .font-size-control .icon-button svg { width: 16px; height: 16px; }
    .font-size-input { width: 35px; text-align: center; margin: 0; padding: 0.2rem; border: none; height: 26px; background-color: transparent; }
	.icon-button { width: 32px; height: 32px; display:flex; align-items:center; justify-content:center; }
	.color-indicator { width: 24px; height: 18px; border-radius: 3px; border: 1px solid rgba(0,0,0,0.08); }

    /* (Se eliminaron los estilos .panel-nav, .panel-tab, etc. de la Fase 2) */
</style>