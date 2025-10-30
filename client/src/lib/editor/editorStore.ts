import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { tick } from 'svelte';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { user } from '$lib/stores/auth';
import { PUBLIC_API_URL } from '$env/static/public';

// --- PLANTILLA BASE ---
// (La movimos aquí para mantener limpio el store)
const BASE_ELEMENTS: Array<any> = [
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

// Usamos Svelte 5 Runes para crear nuestro store
export function createEditorStore(
    initialActivityId: number | null, 
    initialActivityName: string | null,
    templateId: string
) {
	let elements = $state(structuredClone(BASE_ELEMENTS));
	let selectedElementId = $state<number | null>(null);
	let history = $state([JSON.stringify(elements)]);
	let historyIndex = $state(0);
	let applyingHistory = $state(false);
	let nextZIndex = $state(elements.length + 1);
	let hasUnsavedChanges = $state(false);
	let canvasContainerRef = $state<HTMLDivElement | null>(null);
	let verticalSnapLine = $state<number | null>(null);
	let horizontalSnapLine = $state<number | null>(null);
    let currentActivityId = $state<number | null>(initialActivityId);
    let activityName = $state<string>(initialActivityName || 'Plantilla sin nombre');

    const selectedElement = $derived(elements.find((el) => el.id === selectedElementId) || null);
	const canUndo = $derived(historyIndex > 0);
	const canRedo = $derived(historyIndex < history.length - 1);
    
    const availableFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS'];

	// --- LÓGICA DE HISTORIAL ---
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
        // FIX: Solo marca cambios si no estamos en el estado base (índice 0)
		hasUnsavedChanges = (index > 0); 
		await tick();
		applyingHistory = false;
	}
	function undo() { if (historyIndex > 0) loadStateFromHistory(historyIndex - 1); }
	function redo() { if (historyIndex < history.length - 1) loadStateFromHistory(historyIndex + 1); }

    // --- LÓGICA DE ELEMENTOS ---
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
	function deselect(e: MouseEvent) { 
        const target = e.target as HTMLElement;
		if (target.classList.contains('canvas-container') || target.classList.contains('editor-canvas-area')) {
            selectedElementId = null; 
        }
    }

    // --- HERRAMIENTAS DE BARRA LATERAL ---
    function addText() { 
        elements = [...elements, { id: Date.now(), type: 'text', content: 'Nuevo Texto', x: 50, y: 50, width: 200, height: 30, fontSize: 16, color: '#000000', textAlign: 'left', isBold: false, fontFamily: 'Arial', isItalic: false, isUnderlined: false, z: nextZIndex++ }];
		selectedElementId = elements[elements.length - 1].id; 
        saveStateToHistory(); 
    }
	function deleteSelected() { 
        if(selectedElementId === null) return; 
        elements = elements.filter((el) => el.id !== selectedElementId);
		selectedElementId = null; 
        saveStateToHistory(); 
    }
	function addShape(type: 'arrow' | 'line' | 'circle') {
		const id = Date.now();
		let shapeDefaults: any = {
			id, type: 'shape', shapeType: type, x: 100, y: 100,
			width: type === 'circle' ? 80 : 140,
			height: type === 'circle' ? 80 : 20,
			stroke: '#000000', fill: 'transparent', strokeWidth: 4, rotation: 0, z: nextZIndex++
		};
		elements = [...elements, shapeDefaults];
		selectedElementId = id;
		saveStateToHistory();
	}
    function handleFile(file: File, x = 50, y = 50) { 
        if (!file.type.startsWith('image/')) { 
            alert('Por favor, sube solo archivos de imagen.');
	        return; 
        } 
        const reader = new FileReader(); 
        reader.onload = (e) => { 
            const url = e.target?.result as string;
		    const img = new Image(); 
            img.onload = () => { 
                const aspect = img.width / img.height; 
                const maxWidth = 150;
			    const initialWidth = Math.min(maxWidth, img.width); 
                const initialHeight = aspect > 0 ? initialWidth / aspect : 150;
			    const finalX = Math.max(0, x - initialWidth / 2); 
                const finalY = Math.max(0, y - initialHeight / 2);
			    elements = [...elements, { id: Date.now(), type: 'image', url, x: finalX, y: finalY, width: initialWidth, height: initialHeight, z: nextZIndex++ }];
			    saveStateToHistory(); 
            }; 
            img.onerror = () => { alert('Error al cargar la imagen.'); }; 
            img.src = url; 
        };
		reader.onerror = () => { alert('Error al leer el archivo.'); }; 
        reader.readAsDataURL(file);
	}
    function handleFileInput(e: Event) { 
        const input = e.target as HTMLInputElement;
	    if (input.files?.[0]) handleFile(input.files[0]); 
        input.value = '';
	}
    function handleDragOver(e: DragEvent) { e.preventDefault(); }
	function handleDrop(e: DragEvent) { 
        e.preventDefault();
	    if (e.dataTransfer?.files?.[0]) { 
            const canvasRect = (e.currentTarget as HTMLElement).querySelector('.canvas-container')?.getBoundingClientRect(); 
            if (!canvasRect) return;
		    const x = e.clientX - canvasRect.left;
		    const y = e.clientY - canvasRect.top; 
            handleFile(e.dataTransfer.files[0], x, y);
	    } 
    }

    // --- HERRAMIENTAS DE BARRA DE TEXTO ---
    function toggleStyle(styleProp: 'isBold' | 'isItalic' | 'isUnderlined') { 
        if (selectedElement?.type === 'text' && selectedElementId !== null) {
            updateElement(selectedElementId, { [styleProp]: !selectedElement[styleProp] }, true);
        }
	}
	function changeTextAlign(align: 'left' | 'center' | 'right' | 'justify') { 
        if (selectedElement?.type === 'text' && selectedElementId !== null) {
            updateElement(selectedElementId, { textAlign: align }, true);
        }
	}
	function changeFontSize(delta: number) { 
        if (selectedElement?.type === 'text' && selectedElementId !== null) { 
            const newSize = Math.max(8, Math.min(120, selectedElement.fontSize + delta));
		    updateElement(selectedElementId, { fontSize: newSize }, true); 
        } 
    }
	function updateFontSizeFromInput(event: Event) { 
        if (selectedElement?.type === 'text' && selectedElementId !== null) { 
            const input = event.target as HTMLInputElement;
		    let newSize = parseInt(input.value); 
            if (!isNaN(newSize)) { 
                newSize = Math.max(8, Math.min(120, newSize)); 
                updateElement(selectedElementId, { fontSize: newSize }, true);
			    if (parseInt(input.value) !== newSize) input.value = newSize.toString(); 
            } else { 
                input.value = selectedElement.fontSize.toString();
		    } 
        } 
    }
    async function formatList(command: 'insertUnorderedList' | 'insertOrderedList') {
		if (!browser || !selectedElement || selectedElement.type !== 'text' || selectedElementId === null) return;
		const normalized = command === 'insertUnorderedList' ? 'ul' : 'ol';
		const wrapper = document.querySelector(`[data-element-id="${selectedElementId}"]`);
		if (!wrapper) return;
		wrapper.dispatchEvent(new CustomEvent('toggle-list', { detail: { type: normalized }, bubbles: true }));
	}

    // --- LÓGICA DE SNAP/API/PDF ---
    function handleShowSnapLine(line: { type: 'vertical' | 'horizontal'; position: number | null }) {
		if (line.type === 'vertical') verticalSnapLine = line.position;
		else horizontalSnapLine = line.position;
	}

    async function loadActivity(id: number) {
        const $user = user.get(); // Obtenemos el valor actual del store
		if (!$user || !$user.token) {
            alert("No autenticado. Imposible cargar actividad.");
			return;
        }
        try {
            const response = await fetch(`${PUBLIC_API_URL}/api/activities/${id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${$user.token}` }
            });
            if (!response.headers.get('content-type')?.includes('application/json')) {
                 throw new Error(`Respuesta inesperada del servidor. Código: ${response.status}`);
			}
			const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Error al cargar la actividad.');
			}
            
            // FIX: Asegura que los elementos cargados tengan z-index
            const loadedElements = result.activity.elements.map((el: any, i: number) => ({
                ...el,
                z: el.z || i + 1 
            }));
            elements = loadedElements;
            nextZIndex = loadedElements.length + 2; // Actualizamos el contador
			activityName = result.activity.name;
            currentActivityId = id;
            
            const currentStateString = JSON.stringify(elements);
			history = [currentStateString];
            historyIndex = 0;
            hasUnsavedChanges = false;
        } catch (error) {
            console.error('Fallo al cargar la actividad:', error);
             let errorMsg = 'Error al cargar la actividad guardada.';
             if (error instanceof SyntaxError) { errorMsg += " Respuesta inesperada del servidor."; } 
             else if (error instanceof Error) { errorMsg += ` ${error.message}`; }
             alert(`${errorMsg} Se ha cargado la plantilla base.`);
            elements = structuredClone(BASE_ELEMENTS);
            currentActivityId = null; 
        }
    }

    async function saveChanges() {
        const $user = user.get();
		if (!$user || !$user.token) {
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
            templateId: templateId,
            elements: elements,
        };
		try {
            const response = await fetch(targetUrl, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${$user.token}`
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
             if (error instanceof SyntaxError) { errorMsg += " Respuesta inesperada del servidor."; } 
             else if (error instanceof Error) { errorMsg += ` ${error.message}`; }
             alert(errorMsg);
		}
	}

    async function downloadPdf() {
        if (!canvasContainerRef) {
			alert('Error: No se encontró el área de diseño.');
            return;
        }
        selectedElementId = null;
		verticalSnapLine = null;
        horizontalSnapLine = null;
        await tick();

        const options = {
            scale: 2, useCORS: true, backgroundColor: '#FFFFFF', 
            scrollY: -window.scrollY, scrollX: -window.scrollX,
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

    // Devolvemos todos los estados y funciones que los componentes necesitarán
    return {
        // State
        get elements() { return elements },
        get selectedElementId() { return selectedElementId },
        get selectedElement() { return selectedElement },
        get hasUnsavedChanges() { return hasUnsavedChanges },
        get currentActivityId() { return currentActivityId },
        get activityName() { return activityName },
        get verticalSnapLine() { return verticalSnapLine },
        get horizontalSnapLine() { return horizontalSnapLine },
        get canUndo() { return canUndo },
        get canRedo() { return canRedo },
        get availableFonts() { return availableFonts },
        set canvasContainerRef(ref: HTMLDivElement | null) { canvasContainerRef = ref },

        // Methods
        loadActivity,
        saveChanges,
        downloadPdf,
        updateElement,
        selectElement,
        deselect,
        addText,
        deleteSelected,
        addShape,
        handleFileInput,
        handleDragOver,
        handleDrop,
        handleShowSnapLine,
        undo,
        redo,
        toggleStyle,
        changeTextAlign,
        changeFontSize,
        updateFontSizeFromInput,
        formatList
    }
}