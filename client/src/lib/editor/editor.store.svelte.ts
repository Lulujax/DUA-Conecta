import { tick } from 'svelte';

// --- ESTADO ---
// Ahora TypeScript sabe que esto es un array de EditorElement, no de "cualquier cosa"
let elements = $state<App.EditorElement[]>([]);
let selectedElementId = $state<number | null>(null);
let nextZIndex = $state(1);
let baseElements: App.EditorElement[] = []; // Copia de seguridad
let activityName = $state('Plantilla sin nombre');
let currentActivityId = $state<number | null>(null);
let hasUnsavedChanges = $state(false);

// Historial de deshacer/rehacer
let history = $state<string[]>([]);
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
	// Evitar duplicados si no hubo cambios reales
	if (historyIndex >= 0 && currentStateString === history[historyIndex]) return;

	const nextHistory = history.slice(0, historyIndex + 1);
	nextHistory.push(currentStateString);
	history = nextHistory;
	historyIndex = history.length - 1;

	// Limitar historial a 50 pasos para no saturar memoria
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
	try {
		elements = JSON.parse(history[index]);
		historyIndex = index;
		selectedElementId = null;
		hasUnsavedChanges = (index > 0); // Si estamos en el paso 0, no hay cambios "nuevos"
		await tick();
	} catch (e) {
		console.error("Error al cargar historial", e);
	} finally {
		applyingHistory = false;
	}
}

function undo() {
	if (canUndo) loadStateFromHistory(historyIndex - 1);
}

function redo() {
	if (canRedo) loadStateFromHistory(historyIndex + 1);
}

// --- MANIPULACIÓN DE ELEMENTOS ---

// Partial<App.EditorElement> significa que puedes pasar solo las propiedades que quieres cambiar
function updateElement(id: number, data: Partial<App.EditorElement>, isFinalChange: boolean = true) {
	const index = elements.findIndex((el) => el.id === id);
	if (index === -1) return;

	// Lógica especial para mantener el aspecto de las imágenes
	if (elements[index].type === 'image') {
		const oldWidth = elements[index].width;
		const oldHeight = elements[index].height;
		if (data.width !== undefined && data.height === undefined && oldWidth > 0 && oldHeight > 0) {
			data.height = data.width / (oldWidth / oldHeight);
		} else if (data.height !== undefined && data.width === undefined && oldWidth > 0 && oldHeight > 0) {
			data.width = data.height * (oldWidth / oldHeight);
		}
	}
	
	// Actualización inmutable
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

function updateSelectedElement(data: Partial<App.EditorElement>, isFinalChange: boolean = true) {
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

function duplicateSelectedElement() {
	if (!selectedElement) return;

	const newElement: App.EditorElement = { 
		...selectedElement,
		id: Date.now(), 
		x: selectedElement.x + 20,
		y: selectedElement.y + 20,
		z: nextZIndex++ 
	};

	elements = [...elements, newElement];
	selectedElementId = newElement.id;
	saveStateToHistory();
}

// --- Lógica de Capas ---
function renormalizeZIndexes() {
	const sorted = [...elements].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
	elements = sorted.map((el, i) => ({
		...el,
		z: i + 1
	}));
	nextZIndex = elements.length + 1;
	saveStateToHistory();
}

function bringToFront() {
	if (selectedElementId === null) return;
	// Simplemente asignamos un Z mayor al actual máximo
	const maxZ = elements.reduce((max, el) => Math.max(max, el.z), 0);
	nextZIndex = maxZ + 1;
	updateSelectedElement({ z: nextZIndex }, true);
}

function sendToBack() {
	if (selectedElementId === null) return;
	// La estrategia más segura: poner este en 0 y re-normalizar todos
	updateElement(selectedElementId, { z: -1 }, false); // Temporalmente el más bajo
	renormalizeZIndexes(); // Esto pondrá al -1 como 1 y a los demás hacia arriba
}

function moveForward() {
	if (!selectedElement) return;
	// Ordenamos por Z actual
	const sorted = [...elements].sort((a, b) => a.z - b.z);
	const currentIndex = sorted.findIndex(el => el.id === selectedElementId);

	// Si no es el último (el de más arriba)
	if (currentIndex < sorted.length - 1) {
		const neighbor = sorted[currentIndex + 1];
		// Intercambiamos sus Z
		const currentZ = selectedElement.z;
		const neighborZ = neighbor.z;
		
		updateElement(selectedElementId, { z: neighborZ }, false); 
		updateElement(neighbor.id, { z: currentZ }, true);
	}
}

function moveBackward() {
	if (!selectedElement) return;
	const sorted = [...elements].sort((a, b) => a.z - b.z);
	const currentIndex = sorted.findIndex(el => el.id === selectedElementId);

	// Si no es el primero (el del fondo)
	if (currentIndex > 0) {
		const neighbor = sorted[currentIndex - 1];
		const currentZ = selectedElement.z;
		const neighborZ = neighbor.z;
		
		updateElement(selectedElementId, { z: neighborZ }, false); 
		updateElement(neighbor.id, { z: currentZ }, true);
	}
}


// --- CREACIÓN ---
function addText() {
	const newElement: App.EditorElement = {
		id: Date.now(),
		type: 'text',
		content: 'Nuevo Texto', 
		x: 50, y: 50,
		width: 200, height: 30, 
		fontSize: 16, color: '#000000',
		textAlign: 'left', isBold: false, 
		fontFamily: 'Arial',
		isItalic: false, isUnderlined: false, 
		z: nextZIndex++
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
			
			const newElement: App.EditorElement = {
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
		img.src = url;
	};
	reader.readAsDataURL(file);
}

function addShape(type: App.ShapeType) {
	const id = Date.now();
	const shapeDefaults: App.EditorElement = {
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


// --- ESTILOS ---
function toggleStyle(styleProp: 'isBold' | 'isItalic' | 'isUnderlined') {
	if (selectedElement?.type === 'text' && selectedElementId !== null) {
		updateSelectedElement({ [styleProp]: !selectedElement[styleProp] }, true);
	}
}

function changeTextAlign(align: App.TextAlign) {
	if (selectedElement?.type === 'text' && selectedElementId !== null) {
		updateSelectedElement({ textAlign: align }, true);
	}
}

function changeFontSize(delta: number) {
	if (selectedElement?.type === 'text' && selectedElementId !== null) {
		const currentSize = selectedElement.fontSize || 16;
		const newSize = Math.max(8, Math.min(120, currentSize + delta));
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
			input.value = (selectedElement.fontSize || 16).toString();
		}
	}
}


// --- GESTIÓN DE ESTADO GLOBAL ---
function init(base: App.EditorElement[], activityId: number | null, activityNameStr: string | null) {
	// Normalizamos los datos entrantes para asegurar que tienen Z
	const processedBase = base.map((el, i) => ({
		...el,
		z: el.z ?? (i + 1)
	}));

	baseElements = structuredClone(processedBase);
	elements = structuredClone(processedBase);
	
	// Reiniciar historial
	history = [JSON.stringify(elements)];
	historyIndex = 0;
	
	// Calcular próximo Z disponible
	const maxZ = elements.reduce((max, el) => Math.max(max, el.z), 0);
	nextZIndex = maxZ + 1;
	
	hasUnsavedChanges = false;
	currentActivityId = activityId;
	if (activityNameStr) {
		activityName = activityNameStr;
	} else {
		activityName = 'Plantilla sin nombre';
	}
}

function setLoadedActivity(id: number, name: string, loadedElements: App.EditorElement[]) {
	init(loadedElements, id, name);
}

function resetToBase() {
	init(baseElements, null, 'Plantilla sin nombre');
}

function setSavedAsNew(id: number, name: string) {
	currentActivityId = id;
	activityName = name;
	hasUnsavedChanges = false;
	// El historial se mantiene, solo marcamos como guardado
}

function setChangesSaved() {
	hasUnsavedChanges = false;
}

function getActivityPayload(templateId: string) {
	return {
		name: activityName.trim() || "Plantilla sin nombre",
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
	duplicateSelectedElement,
	
	bringToFront,
	sendToBack,
	moveForward,
	moveBackward,

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