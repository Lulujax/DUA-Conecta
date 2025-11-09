// @ts-nocheck
import { tick } from 'svelte';
import { editorStore as self } from './editor.store.svelte'; // Importamos 'self' para evitar conflictos

// --- ESTADO ---
let elements = $state<Array<any>>([]);
let selectedElementId = $state<number | null>(null);
let nextZIndex = $state(1);
let baseElements: Array<any> = [];
let activityName = $state('Plantilla sin nombre');
let currentActivityId = $state<number | null>(null);
let hasUnsavedChanges = $state(false);
let history = $state<Array<string>>([]);
let historyIndex = $state(0);
let applyingHistory = $state(false);

// --- ESTADOS DERIVADOS ---
let selectedElement = $derived(
	elements.find((el) => el.id === selectedElementId) || null
);
let canUndo = $derived(historyIndex > 0);
let canRedo = $derived(historyIndex < history.length - 1);

// --- HISTORIAL ---
function saveStateToHistory() {
	if (applyingHistory) return;
	const currentStateString = JSON.stringify(elements);
	if (currentStateString === history[historyIndex]) return;

	const nextHistory = history.slice(0, historyIndex + 1);
	nextHistory.push(currentStateString);
	history = nextHistory;
	historyIndex = history.length - 1;

	if (history.length > 50) {
		history.shift();
		historyIndex--;
		history = [...history]; 
	}
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

function undo() {
	if (canUndo) loadStateFromHistory(historyIndex - 1);
}

function redo() {
	if (canRedo) loadStateFromHistory(historyIndex + 1);
}

// --- MANIPULACIÓN DE ELEMENTOS ---
function updateElement(id: number, data: any, isFinalChange: boolean = true) {
	const index = elements.findIndex((el) => el.id === id);
	if (index === -1) return;

	if (elements[index].type === 'image') {
		const oldWidth = elements[index].width;
		const oldHeight = elements[index].height;
		if (data.width !== undefined && data.height === undefined && oldWidth > 0 && oldHeight > 0) {
			data.height = data.width / (oldWidth / oldHeight);
		} else if (data.height !== undefined && data.width === undefined && oldWidth > 0 && oldHeight > 0) {
			data.width = data.height * (oldWidth / oldHeight);
		}
	}
	
	elements = elements.map((el, i) =>
		i === index ? { ...el, ...data } : el
	);

	if (isFinalChange) {
		saveStateToHistory();
	}
	if (!applyingHistory) {
		hasUnsavedChanges = true;
	}
}

function updateSelectedElement(data: any, isFinalChange: boolean = true) {
	if (selectedElementId === null) return;
	updateElement(selectedElementId, data, isFinalChange);
}

function selectElement(id: number) {
	selectedElementId = id;
}

function deselect() {
	selectedElementId = null;
}

function deleteSelected() {
	if (selectedElementId === null) return;
	elements = elements.filter((el) => el.id !== selectedElementId);
	selectedElementId = null;
	saveStateToHistory();
}

// --- Lógica de Capas (Corregida) ---
function renormalizeZIndexes() {
	const sorted = [...elements].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
	elements = sorted.map((el, i) => ({
		...el,
		z: i
	}));
	nextZIndex = elements.length;
	saveStateToHistory();
}

function bringToFront() {
	if (selectedElementId === null) return;
	nextZIndex += 1;
	updateSelectedElement({ z: nextZIndex }, true);
}

function sendToBack() {
	if (selectedElementId === null) return;
	
	// Empuja todos los demás elementos 1 hacia arriba
	elements = elements.map(el => {
		if (el.id === selectedElementId) {
			return { ...el, z: 0 }; // Pone el seleccionado en 0
		}
		return { ...el, z: (el.z ?? 0) + 1 };
	});

	nextZIndex = elements.length + 1;
	saveStateToHistory();
}

function moveForward() {
	if (!selectedElement) return;
	if (hasDuplicateZIndexes()) renormalizeZIndexes();

	const sorted = [...elements].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
	const currentIndex = sorted.findIndex(el => el.id === selectedElementId);

	if (currentIndex < sorted.length - 1) {
		const neighbor = sorted[currentIndex + 1];
		const currentZ = selectedElement.z ?? 0;
		const neighborZ = neighbor.z ?? 0;
		
		updateElement(selectedElementId, { z: neighborZ }, false); 
		updateElement(neighbor.id, { z: currentZ }, true);
	}
}

function moveBackward() {
	if (!selectedElement) return;
	if (hasDuplicateZIndexes()) renormalizeZIndexes();

	const sorted = [...elements].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
	const currentIndex = sorted.findIndex(el => el.id === selectedElementId);

	if (currentIndex > 0) {
		const neighbor = sorted[currentIndex - 1];
		const currentZ = selectedElement.z ?? 0;
		const neighborZ = neighbor.z ?? 0;
		
		updateElement(selectedElementId, { z: neighborZ }, false); 
		updateElement(neighbor.id, { z: currentZ }, true);
	}
}
function hasDuplicateZIndexes() {
	const zIndexes = new Set();
	for (const el of elements) {
		const z = el.z ?? 0;
		if (zIndexes.has(z)) return true;
		zIndexes.add(z);
	}
	return false;
}

// --- *** INICIO DEL CAMBIO (Paso 3.2) *** ---
// --- NUEVA FUNCIÓN DE DUPLICAR ---
function duplicateSelectedElement() {
	if (!selectedElement) return;

	// Clona el elemento seleccionado
	const newElement = { 
		...selectedElement,
		id: Date.now(), // Asigna un nuevo ID único
		x: selectedElement.x + 10, // Lo mueve 10px a la derecha
		y: selectedElement.y + 10, // Lo mueve 10px hacia abajo
		z: nextZIndex++ // Lo pone al frente de todo
	};

	// Añade el nuevo elemento a la lista
	elements = [...elements, newElement];
	
	// Selecciona automáticamente el nuevo elemento duplicado
	selectedElementId = newElement.id;

	// Guarda en el historial
	saveStateToHistory();
}
// --- *** FIN DEL CAMBIO *** ---


// --- FUNCIONES PARA AÑADIR ELEMENTOS ---
function addText() {
	const newElement = {
		id: Date.now(),
		type: 'text',
		content: 'Nuevo Texto', x: 50, y: 50,
		width: 200, height: 30, fontSize: 16, color: '#000000',
		textAlign: 'left', isBold: false, fontFamily: 'Arial',
		isItalic: false, isUnderlined: false, z: nextZIndex++
	};
	elements = [...elements, newElement];
	selectedElementId = newElement.id;
	saveStateToHistory();
}

function addImage(file: File, x = 50, y = 50) {
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
			
			const newElement = {
				id: Date.now(),
				type: 'image', url,
				x: finalX, y: finalY,
				width: initialWidth, height: initialHeight,
				opacity: 1, 
				z: nextZIndex++
			};
			elements = [...elements, newElement];
			saveStateToHistory();
		};
		img.onerror = () => { alert('Error al cargar la imagen.'); };
		img.src = url;
	};
	reader.onerror = () => { alert('Error al leer el archivo.'); };
	reader.readAsDataURL(file);
}

function addShape(type: 'arrow' | 'line' | 'circle' | 'rectangle') {
	const id = Date.now();
	const shapeDefaults: any = {
		id,
		type: 'shape', shapeType: type,
		x: 100, y: 100,
		width: (type === 'circle' || type === 'rectangle') ? 80 : 140, 
		height: (type === 'circle' || type === 'rectangle') ? 80 : 20, 
		stroke: '#000000',
		fill: (type === 'rectangle' || type === 'circle') ? '#EEEEEE' : null,
		strokeWidth: 4, rotation: 0, z: nextZIndex++
	};
	elements = [...elements, shapeDefaults];
	selectedElementId = id;
	saveStateToHistory();
}


// --- FUNCIONES DE LA BARRA DE TEXTO ---
function toggleStyle(styleProp: 'isBold' | 'isItalic' | 'isUnderlined') {
	if (selectedElement?.type === 'text' && selectedElementId !== null) {
		updateSelectedElement({ [styleProp]: !selectedElement[styleProp] }, true);
	}
}

function changeTextAlign(align: 'left' | 'center' | 'right' | 'justify') {
	if (selectedElement?.type === 'text' && selectedElementId !== null) {
		updateSelectedElement({ textAlign: align }, true);
	}
}

function changeFontSize(delta: number) {
	if (selectedElement?.type === 'text' && selectedElementId !== null) {
		const newSize = Math.max(8, Math.min(120, selectedElement.fontSize + delta));
		updateSelectedElement({ fontSize: newSize }, true);
	}
}

function updateFontSizeFromInput(event: Event) {
	if (selectedElement?.type === 'text' && selectedElementId !== null) {
		const input = event.target as HTMLInputElement;
		let newSize = parseInt(input.value);
		if (!isNaN(newSize)) {
			newSize = Math.max(8, Math.min(120, newSize));
			updateSelectedElement({ fontSize: newSize }, true);
			if (parseInt(input.value) !== newSize) input.value = newSize.toString();
		} else {
			input.value = selectedElement.fontSize.toString();
		}
	}
}


// --- FUNCIONES DE INICIALIZACIÓN Y API ---
function init(base: Array<any>, activityId: number | null, activityNameStr: string | null) {
	const processedBase = base.map((el, i) => ({
		...el,
		z: el.z ?? i
	}));

	baseElements = structuredClone(processedBase);
	elements = structuredClone(processedBase);
	history = [JSON.stringify(elements)];
	historyIndex = 0;
	nextZIndex = elements.length; 
	
	hasUnsavedChanges = false;
	currentActivityId = activityId;
	if (activityNameStr) {
		activityName = activityNameStr;
	}
}

function setLoadedActivity(id: number, name: string, loadedElements: Array<any>) {
	const processedElements = loadedElements.map((el: any, i: number) => ({
		...el,
		z: el.z ?? i
	}));
	
	elements = processedElements;
	const maxZ = elements.reduce((max, el) => Math.max(max, el.z ?? 0), 0);
	nextZIndex = maxZ + 1;

	activityName = name;
	currentActivityId = id;
	const currentStateString = JSON.stringify(elements);
	history = [currentStateString];
	historyIndex = 0;
	hasUnsavedChanges = false;
	selectedElementId = null;
}

function resetToBase() {
	elements = structuredClone(baseElements);
	history = [JSON.stringify(elements)];
	historyIndex = 0;
	nextZIndex = elements.length;
	hasUnsavedChanges = false;
	currentActivityId = null;
	activityName = 'Plantilla sin nombre';
	selectedElementId = null;
}

function setSavedAsNew(id: number, name: string) {
	currentActivityId = id;
	activityName = name;
	hasUnsavedChanges = false;
	history = [JSON.stringify(elements)]; 
	historyIndex = 0;
}

function setChangesSaved() {
	hasUnsavedChanges = false;
	history = [JSON.stringify(elements)]; 
	historyIndex = 0;
}

function getActivityPayload(templateId: string) {
	return {
		name: activityName.trim() === "" ? "Plantilla sin nombre" : activityName.trim(),
		templateId: templateId,
		elements: elements,
	};
}

function updateActivityName(name: string) {
	if (name !== activityName) {
		activityName = name;
		hasUnsavedChanges = true;
	}
}

export const editorStore = {
	get elements() { return elements; },
	get selectedElementId() { return selectedElementId; },
	get hasUnsavedChanges() { return hasUnsavedChanges; },
	get activityName() { return activityName; },
	get currentActivityId() { return currentActivityId; },
	get selectedElement() { return selectedElement; },
	get canUndo() { return canUndo; },
	get canRedo() { return canRedo; },
	undo,
	redo,
	updateElement,
	updateSelectedElement,
	selectElement,
	deselect,
	deleteSelected,
	bringToFront,
	sendToBack,
	moveForward,
	moveBackward,
	
	// --- *** INICIO DEL CAMBIO (Paso 3.2) *** ---
	// Añadimos la nueva función a la exportación
	duplicateSelectedElement,
	// --- *** FIN DEL CAMBIO *** ---

	addText,
	addImage,
	addShape,
	toggleStyle,
	changeTextAlign,
	changeFontSize,
	updateFontSizeFromInput,
	init,
	setLoadedActivity,
	resetToBase,
	setSavedAsNew,
	setChangesSaved,
	getActivityPayload,
	updateActivityName
};