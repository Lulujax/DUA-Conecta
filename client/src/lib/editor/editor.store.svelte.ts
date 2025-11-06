// @ts-nocheck
// Arriba se usa ts-nocheck porque Svelte 5 runes (.svelte.ts)
// aún puede dar falsos positivos en algunos editores.

import { tick } from 'svelte';

/**
 * --- ESTADO CENTRAL DEL EDITOR ---
 * Usamos Svelte 5 Runes ($state, $derived) para manejar la reactividad
 * de forma centralizada.
 */

// Estado de los Elementos
let elements = $state<Array<any>>([]);
let selectedElementId = $state<number | null>(null);
let nextZIndex = $state(1);

// Estado de la Actividad
let baseElements: Array<any> = []; // Copia de la plantilla original
let activityName = $state('Plantilla sin nombre');
let currentActivityId = $state<number | null>(null);
let hasUnsavedChanges = $state(false);

// Estado del Historial (Undo/Redo)
let history = $state<Array<string>>([]);
let historyIndex = $state(0);
let applyingHistory = $state(false); // Flag para evitar bucles

// --- ESTADOS DERIVADOS ---

/** El elemento actualmente seleccionado */
let selectedElement = $derived(
	elements.find((el) => el.id === selectedElementId) || null
);
/** Si se puede deshacer */
let canUndo = $derived(historyIndex > 0);
/** Si se puede rehacer */
let canRedo = $derived(historyIndex < history.length - 1);

// --- FUNCIONES DE HISTORIAL ---

/**
 * Guarda el estado actual de 'elements' en el historial.
 */
function saveStateToHistory() {
	if (applyingHistory) return;
	const currentStateString = JSON.stringify(elements);
	if (currentStateString === history[historyIndex]) return;

	const nextHistory = history.slice(0, historyIndex + 1);
	nextHistory.push(currentStateString);
	history = nextHistory;
	historyIndex = history.length - 1;

	// Limita el historial a 50 pasos
	if (history.length > 50) {
		history.shift();
		historyIndex--;
		history = [...history]; // Forzar reactividad
	}
	hasUnsavedChanges = true;
}

/**
 * Carga un estado previo o siguiente del historial.
 */
async function loadStateFromHistory(index: number) {
	if (index < 0 || index >= history.length) return;
	applyingHistory = true;
	elements = JSON.parse(history[index]);
	historyIndex = index;
	selectedElementId = null;
	hasUnsavedChanges = (index > 0); // Solo hay cambios sin guardar si no estamos en el estado inicial
	await tick();
	applyingHistory = false;
}

/** Deshace la última acción */
function undo() {
	if (canUndo) loadStateFromHistory(historyIndex - 1);
}

/** Rehace la última acción deshecha */
function redo() {
	if (canRedo) loadStateFromHistory(historyIndex + 1);
}

// --- FUNCIONES DE MANIPULACIÓN DE ELEMENTOS ---

/**
 * Actualiza una propiedad de un elemento específico.
 * @param isFinalChange Si es un cambio final que debe guardarse en el historial (ej. al soltar el mouse).
 */
function updateElement(id: number, data: any, isFinalChange: boolean = true) {
	const index = elements.findIndex((el) => el.id === id);
	if (index === -1) return;

	// Mantenimiento de aspect-ratio para imágenes
	if (elements[index].type === 'image') {
		const oldWidth = elements[index].width;
		const oldHeight = elements[index].height;
		if (data.width !== undefined && data.height === undefined && oldWidth > 0 && oldHeight > 0) {
			data.height = data.width / (oldWidth / oldHeight);
		} else if (data.height !== undefined && data.width === undefined && oldWidth > 0 && oldHeight > 0) {
			data.width = data.height * (oldWidth / oldHeight);
		}
	}
	
	const currentZ = elements[index].z;
	elements = elements.map((el, i) =>
		i === index ? { ...el, ...data, z: data.z ?? currentZ } : el
	);

	if (isFinalChange) {
		saveStateToHistory();
	}
	if (!applyingHistory) {
		hasUnsavedChanges = true;
	}
}

/** Actualiza una propiedad del elemento SELECCIONADO */
function updateSelectedElement(data: any, isFinalChange: boolean = true) {
	if (selectedElementId === null) return;
	updateElement(selectedElementId, data, isFinalChange);
}

/** Selecciona un elemento y lo trae al frente (aumentando z-index) */
function selectElement(id: number) {
	selectedElementId = id;
	const index = elements.findIndex((el) => el.id === id);
	if (index !== -1) {
		const updatedElement = { ...elements[index], z: nextZIndex++ };
		elements = elements.map((el, i) => (i === index ? updatedElement : el));
	}
}

/** Quita la selección de cualquier elemento */
function deselect() {
	selectedElementId = null;
}

/** Elimina el elemento actualmente seleccionado */
function deleteSelected() {
	if (selectedElementId === null) return;
	elements = elements.filter((el) => el.id !== selectedElementId);
	selectedElementId = null;
	saveStateToHistory();
}

// --- FUNCIONES PARA AÑADIR ELEMENTOS ---

/** Añade un nuevo elemento de texto */
function addText() {
	const newElement = {
		id: Date.now(),
		type: 'text',
		content: 'Nuevo Texto',
		x: 50,
		y: 50,
		width: 200,
		height: 30,
		fontSize: 16,
		color: '#000000',
		textAlign: 'left',
		isBold: false,
		fontFamily: 'Arial',
		isItalic: false,
		isUnderlined: false,
		z: nextZIndex++
	};
	elements = [...elements, newElement];
	selectedElementId = newElement.id;
	saveStateToHistory();
}

/** Añade una imagen subida */
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
				type: 'image',
				url,
				x: finalX,
				y: finalY,
				width: initialWidth,
				height: initialHeight,
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

/** Añade una forma (círculo, línea, etc.) */
function addShape(type: 'arrow' | 'line' | 'circle' | 'rectangle') {
	const id = Date.now();
	const shapeDefaults: any = {
		id,
		type: 'shape',
		shapeType: type,
		x: 100,
		y: 100,
		width: (type === 'circle' || type === 'rectangle') ? 80 : 140, 
		height: (type === 'circle' || type === 'rectangle') ? 80 : 20, 
		stroke: '#000000',
		fill: (type === 'rectangle' || type === 'circle') ? '#EEEEEE' : 'transparent', // Relleno para círculo y rect
		strokeWidth: 4,
		rotation: 0,
		z: nextZIndex++
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
			// Corregir el input si el valor estaba fuera de rango
			if (parseInt(input.value) !== newSize) input.value = newSize.toString();
		} else {
			// Resetear al valor actual si la entrada no es un número
			input.value = selectedElement.fontSize.toString();
		}
	}
}


// --- FUNCIONES DE INICIALIZACIÓN Y API ---

/** Inicializa el store con los datos de la plantilla base */
function init(base: Array<any>, activityId: number | null, activityNameStr: string | null) {
	baseElements = structuredClone(base);
	elements = structuredClone(base);
	history = [JSON.stringify(elements)];
	historyIndex = 0;
	nextZIndex = elements.length + 1;
	hasUnsavedChanges = false;
	currentActivityId = activityId;
	if (activityNameStr) {
		activityName = activityNameStr;
	}
}

/** Carga los datos de una actividad existente (llamado por el servicio API) */
function setLoadedActivity(id: number, name: string, loadedElements: Array<any>) {
	const processedElements = loadedElements.map((el: any, i: number) => ({
		...el,
		z: el.z || i + 1
	}));
	
	elements = processedElements;
	nextZIndex = processedElements.length + 2;
	activityName = name;
	currentActivityId = id;
	const currentStateString = JSON.stringify(elements);
	history = [currentStateString];
	historyIndex = 0;
	hasUnsavedChanges = false;
	selectedElementId = null;
}

/** Resetea el estado a la plantilla base (si falla la carga de API) */
function resetToBase() {
	elements = structuredClone(baseElements);
	history = [JSON.stringify(elements)];
	historyIndex = 0;
	nextZIndex = elements.length + 1;
	hasUnsavedChanges = false;
	currentActivityId = null;
	activityName = 'Plantilla sin nombre';
	selectedElementId = null;
}

/** Actualiza el ID y nombre después de guardar una NUEVA actividad */
function setSavedAsNew(id: number, name: string) {
	currentActivityId = id;
	activityName = name;
	hasUnsavedChanges = false;
	history = [JSON.stringify(elements)]; // Resetea el historial, este es el nuevo punto 0
	historyIndex = 0;
}

/** Marca los cambios como guardados (después de actualizar) */
function setChangesSaved() {
	hasUnsavedChanges = false;
	history = [JSON.stringify(elements)]; // Resetea el historial
	historyIndex = 0;
}

/** Obtiene el payload necesario para guardar/actualizar */
function getActivityPayload(templateId: string) {
	return {
		name: activityName.trim() === "" ? "Plantilla sin nombre" : activityName.trim(),
		templateId: templateId,
		elements: elements,
	};
}

/** Permite al componente 'EditorSidebar' actualizar el nombre */
function updateActivityName(name: string) {
	if (name !== activityName) {
		activityName = name;
		hasUnsavedChanges = true;
	}
}

// --- *** LA CORRECCIÓN *** ---
// Exportamos un único objeto 'editorStore' que usa getters
// para exponer el estado reactivo de forma segura.
export const editorStore = {
	// Estado (lectura)
	get elements() { return elements; },
	get selectedElementId() { return selectedElementId; },
	get hasUnsavedChanges() { return hasUnsavedChanges; },
	get activityName() { return activityName; },
	get currentActivityId() { return currentActivityId; },
	
	// Estado Derivado (lectura)
	get selectedElement() { return selectedElement; },
	get canUndo() { return canUndo; },
	get canRedo() { return canRedo; },
	
	// Funciones de Historial
	undo,
	redo,
	
	// Funciones de Manipulación
	updateElement,
	updateSelectedElement,
	selectElement,
	deselect,
	deleteSelected,
	
	// Funciones de Añadir
	addText,
	addImage,
	addShape,
	
	// Funciones de Barra de Texto
	toggleStyle,
	changeTextAlign,
	changeFontSize,
	updateFontSizeFromInput,
	
	// Funciones de Ciclo de Vida
	init,
	setLoadedActivity,
	resetToBase,
	setSavedAsNew,
	setChangesSaved,
	getActivityPayload,
	updateActivityName
};