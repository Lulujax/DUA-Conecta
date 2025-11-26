import { tick } from 'svelte';

// --- ESTADO ---
let elements = $state<Array<EditorElement>>([]);
let selectedIds = $state<number[]>([]); // Multiselección
let nextZIndex = $state(1);
let baseElements: Array<EditorElement> = [];
let activityName = $state('Plantilla sin nombre');
let currentActivityId = $state<number | null>(null);
let hasUnsavedChanges = $state(false);
let history = $state<Array<string>>([]);
let historyIndex = $state(0);
let applyingHistory = $state(false);

let clipboard = $state<any>(null); 

// --- ESTADOS DERIVADOS ---
let selectedElement = $derived(
	selectedIds.length > 0 
        ? elements.find((el) => el.id === selectedIds[selectedIds.length - 1]) || null 
        : null
);

let canUndo = $derived(historyIndex > 0);
let canRedo = $derived(historyIndex < history.length - 1);

// --- HISTORIAL ---
function saveStateToHistory() {
	if (applyingHistory) return;
	const currentStateString = JSON.stringify(elements);
	if (historyIndex >= 0 && currentStateString === history[historyIndex]) return;

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
	try {
		elements = JSON.parse(history[index]);
		historyIndex = index;
		selectedIds = []; 
		hasUnsavedChanges = (index > 0);
		await tick();
	} catch (e) {
		console.error("Error historial", e);
	} finally {
		applyingHistory = false;
	}
}

function undo() { if (canUndo) loadStateFromHistory(historyIndex - 1); }
function redo() { if (canRedo) loadStateFromHistory(historyIndex + 1); }

// --- SELECCIÓN ---
function selectElement(id: number, multi: boolean = false) {
    if (multi) {
        // Toggle selección
        if (selectedIds.includes(id)) {
            selectedIds = selectedIds.filter(i => i !== id);
        } else {
            selectedIds = [...selectedIds, id];
        }
    } else {
        selectedIds = [id];
    }
}

function deselect() { selectedIds = []; }

// --- MANIPULACIÓN ---
function updateElement(id: number, data: any, isFinalChange: boolean = true) {
	elements = elements.map((el) => {
        if (el.id === id) {
            if (el.type === 'image') {
                const oldWidth = el.width;
                const oldHeight = el.height;
                if (data.width !== undefined && data.height === undefined && oldWidth > 0 && oldHeight > 0) {
                    data.height = data.width / (oldWidth / oldHeight);
                } else if (data.height !== undefined && data.width === undefined && oldWidth > 0 && oldHeight > 0) {
                    data.width = data.height * (oldWidth / oldHeight);
                }
            }
            return { ...el, ...data };
        }
        return el;
    });

	if (isFinalChange) saveStateToHistory();
	if (!applyingHistory) hasUnsavedChanges = true;
}

function updateSelectedElement(data: any, isFinalChange: boolean = true) {
	if (selectedIds.length === 0) return;
    
    elements = elements.map(el => {
        if (selectedIds.includes(el.id)) {
            return { ...el, ...data };
        }
        return el;
    });

    if (isFinalChange) saveStateToHistory();
    if (!applyingHistory) hasUnsavedChanges = true;
}

function moveSelected(dx: number, dy: number, isFinal: boolean = false) {
    elements = elements.map(el => {
        if (selectedIds.includes(el.id)) {
            return { ...el, x: el.x + dx, y: el.y + dy };
        }
        return el;
    });
    if (isFinal) saveStateToHistory();
}

function deleteSelected() {
	if (selectedIds.length === 0) return;
	elements = elements.filter((el) => !selectedIds.includes(el.id));
	selectedIds = [];
	saveStateToHistory();
}

// --- COPIAR Y PEGAR ---
function duplicateSelectedElement() {
	if (selectedIds.length === 0) return;
    const newIds: number[] = [];
	const newElements = elements
        .filter(el => selectedIds.includes(el.id))
        .map(el => {
            const newId = Date.now() + Math.floor(Math.random() * 10000);
            newIds.push(newId);
            return { 
                ...el,
                id: newId, 
                x: el.x + 10,
                y: el.y + 10,
                z: nextZIndex++
            };
        });

	elements = [...elements, ...newElements];
	selectedIds = newIds;
	saveStateToHistory();
}

function copySelected() {
    if (selectedIds.length === 0) return;
    const toCopy = elements.filter(el => selectedIds.includes(el.id));
    clipboard = JSON.parse(JSON.stringify(toCopy));
}

function paste() {
    if (!clipboard || !Array.isArray(clipboard)) return;
    
    const fixedOffset = 10;
    const newIds: number[] = [];

    const pastedElements = clipboard.map((el: any) => {
        el.x += fixedOffset;
        el.y += fixedOffset;
        const newId = Date.now() + Math.floor(Math.random() * 10000);
        newIds.push(newId);
        return {
            ...el,
            id: newId,
            z: nextZIndex++
        };
    });

    clipboard = pastedElements; 
    elements = [...elements, ...pastedElements];
    selectedIds = newIds;
    saveStateToHistory();
}

// --- CAPAS ---
function bringToFront() {
    if (selectedIds.length === 0) return;
	const maxZ = elements.reduce((max, el) => Math.max(max, el.z), 0);
    updateSelectedElement({ z: maxZ + 1 }, true); 
}

function sendToBack() {
    if (selectedIds.length === 0) return;
	updateSelectedElement({ z: 0 }, true); 
}

// --- CREACIÓN ---
function addText() {
	const newElement: EditorElement = {
		id: Date.now(), type: 'text', content: 'Nuevo Texto', 
		x: 50, y: 50, width: 200, height: 30, 
		fontSize: 16, color: '#000000', textAlign: 'left', 
        fontFamily: 'Arial', lineHeight: 1.4,
		z: nextZIndex++, flipX: false
	};
	elements = [...elements, newElement];
	selectedIds = [newElement.id];
	saveStateToHistory();
}

function addImage(file: File, x = 50, y = 50) {
	const reader = new FileReader();
	reader.onload = (e) => {
		const url = e.target?.result as string;
		const img = new Image();
		img.onload = () => {
            const aspect = img.width / img.height;
			const initialWidth = Math.min(150, img.width);
			const initialHeight = aspect > 0 ? initialWidth / aspect : 150;
			
			const newElement: EditorElement = {
				id: Date.now(), type: 'image', url,
				x: Math.max(0, x - initialWidth/2), y: Math.max(0, y - initialHeight/2), 
                width: initialWidth, height: initialHeight,
				opacity: 1, z: nextZIndex++, flipX: false
			};
			elements = [...elements, newElement];
            saveStateToHistory();
		};
		img.src = url;
	};
	reader.readAsDataURL(file);
}

function addImageFromUrl(url: string, x = 50, y = 50) {
	const newElement: EditorElement = {
		id: Date.now(), type: 'image', url, 
		x: x, y: y, width: 200, height: 200, opacity: 1, 
		z: nextZIndex++, flipX: false
	};
	elements = [...elements, newElement];
	selectedIds = [newElement.id];
	saveStateToHistory();
}

function addShape(type: ShapeType) {
	const id = Date.now();
	const shapeDefaults: EditorElement = {
		id, type: 'shape', shapeType: type,
		x: 100, y: 100,
		width: (type === 'circle' || type === 'rectangle') ? 80 : 140, 
		height: (type === 'circle' || type === 'rectangle') ? 80 : 20, 
		stroke: '#000000', fill: (type === 'rectangle' || type === 'circle') ? '#EEEEEE' : null,
		strokeWidth: 4, rotation: 0, z: nextZIndex++, flipX: false
	};
	elements = [...elements, shapeDefaults];
	selectedIds = [id];
	saveStateToHistory();
}

// --- ESTILOS ---
function changeTextAlign(align: TextAlign) {
    updateSelectedElement({ textAlign: align }, true);
}

function changeFontSize(delta: number) {
    elements = elements.map(el => {
        if (selectedIds.includes(el.id) && el.type === 'text') {
            const newSize = Math.max(8, Math.min(120, (el.fontSize || 16) + delta));
            return { ...el, fontSize: newSize };
        }
        return el;
    });
    saveStateToHistory();
}

function updateFontSizeFromInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let newSize = parseInt(input.value);
    if (!isNaN(newSize)) {
        newSize = Math.max(8, Math.min(120, newSize));
        updateSelectedElement({ fontSize: newSize }, true);
    }
}

function toggleFlip() {
    elements = elements.map(el => {
        if (selectedIds.includes(el.id)) {
            return { ...el, flipX: !el.flipX };
        }
        return el;
    });
    saveStateToHistory();
}

function changeLineHeight(newLineHeight: number) {
    updateSelectedElement({ lineHeight: newLineHeight }, true);
}

// --- GESTIÓN GLOBAL ---
function init(base: Array<any>, activityId: number | null, activityNameStr: string | null) {
	const processedBase = base.map((el, i) => ({ ...el, z: el.z ?? (i + 1) }));
	baseElements = structuredClone(processedBase);
	elements = structuredClone(processedBase);
	history = [JSON.stringify(elements)];
	historyIndex = 0;
	const maxZ = elements.reduce((max, el) => Math.max(max, el.z), 0);
	nextZIndex = maxZ + 1;
	hasUnsavedChanges = false;
	currentActivityId = activityId;
	activityName = activityNameStr || 'Plantilla sin nombre';
    selectedIds = [];
}

function setLoadedActivity(id: number, name: string, loadedElements: Array<any>) { init(loadedElements, id, name); }
function resetToBase() { init(baseElements, null, 'Plantilla sin nombre'); }
function setSavedAsNew(id: number, name: string) { currentActivityId = id; activityName = name; hasUnsavedChanges = false; }
function setChangesSaved() { hasUnsavedChanges = false; }
function getActivityPayload(templateId: string) { return { name: activityName.trim() || "Plantilla sin nombre", templateId, elements }; }
function updateActivityName(name: string) { if (name !== activityName) { activityName = name; hasUnsavedChanges = true; } }

export const editorStore = {
	get elements() { return elements; },
    get selectedIds() { return selectedIds; },
	get selectedElementId() { return selectedIds.length > 0 ? selectedIds[0] : null; },
	get hasUnsavedChanges() { return hasUnsavedChanges; },
	get activityName() { return activityName; },
	get currentActivityId() { return currentActivityId; },
	get selectedElement() { return selectedElement; },
	get canUndo() { return canUndo; },
	get canRedo() { return canRedo; },
	undo, redo,
	updateElement, updateSelectedElement, moveSelected,
	selectElement, deselect, deleteSelected,
	duplicateSelectedElement, copySelected, paste, 
	bringToFront, sendToBack, 
	addText, addImage, addImageFromUrl, addShape,
	changeTextAlign, changeFontSize, updateFontSizeFromInput, toggleFlip, changeLineHeight,
	init, setLoadedActivity, resetToBase, setSavedAsNew, setChangesSaved,
	getActivityPayload, updateActivityName
};