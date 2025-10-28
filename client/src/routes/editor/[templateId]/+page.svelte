<script lang="ts">
    import { page } from '$app/stores';
    import { beforeNavigate } from '$app/navigation';
    import Draggable from '$lib/editor/Draggable.svelte';

    const templateId = $page.params.templateId;
    let hasUnsavedChanges = $state(false);
    let selectedElementId = $state<number | null>(null);

    // --- PLANTILLA BASE (Monstruo de las Emociones) ---
    // Recreamos tu PDF como un conjunto de elementos editables.
    let initialElements: Array<any> = [
        { id: 1, type: 'text', content: 'Nombre: _____________________', x: 50, y: 54, width: 300, height: 20, fontSize: 16, color: '#333' },
        { id: 2, type: 'text', content: 'Fecha: __________', x: 400, y: 54, width: 120, height: 20, fontSize: 16, color: '#333' },
        { id: 3, type: 'text', content: 'Grado: __________', x: 550, y: 54, width: 100, height: 20, fontSize: 16, color: '#333' },
        { id: 4, type: 'text', content: 'El Monstruo de las Emociones', x: 100, y: 95, width: 500, height: 40, fontSize: 36, color: '#333', isBold: true, textAlign: 'center' },
        { id: 5, type: 'image', url: '/asdasda-removebg-preview.png', x: 50, y: 180, width: 280, height: 350 }, 
        { id: 6, type: 'text', content: 'El monstruo siente muchas emociones, dice que en cada parte de su cuerpo hay una emoción ¿En qué parte del cuerpo sientes la emoción?', x: 360, y: 190, width: 300, height: 80, fontSize: 16, color: '#333' },
        { id: 7, type: 'text', content: 'COLORES Y EMOCIONES:', x: 360, y: 280, width: 300, height: 25, fontSize: 18, color: '#333', isBold: true },
        { id: 8, type: 'text', content: '• ROJO - IRA/MOLESTIA', x: 370, y: 315, width: 200, height: 20, fontSize: 16, color: '#333' },
        { id: 9, type: 'text', content: '• MORADO - MIEDO', x: 370, y: 340, width: 200, height: 20, fontSize: 16, color: '#333' },
        { id: 10, type: 'text', content: '• AZUL - TRISTEZA', x: 370, y: 365, width: 200, height: 20, fontSize: 16, color: '#333' },
        { id: 11, type: 'text', content: '• AMARILLO - FELICIDAD', x: 370, y: 390, width: 200, height: 20, fontSize: 16, color: '#333' },
        { id: 12, type: 'text', content: '• VERDE - ASCO', x: 370, y: 415, width: 200, height: 20, fontSize: 16, color: '#333' },
        { id: 13, type: 'text', content: '¡Gana tu ficha aquí!', x: 450, y: 830, width: 200, height: 25, fontSize: 18, color: '#333', isBold: true }
    ];

    let elements = $state(initialElements);
    let nextZIndex = $state(initialElements.length + 1);

    let selectedElement = $derived(elements.find(el => el.id === selectedElementId) || null);

    // --- LÓGICA DE ESTADO ---
    function updateElement(id: number, data: any) {
        const index = elements.findIndex(el => el.id === id);
        if (index !== -1) {
            elements[index] = { ...elements[index], ...data };
            hasUnsavedChanges = true;
        }
    }
    function selectElement(id: number, e: MouseEvent) {
        e.stopPropagation();
        selectedElementId = id;
        updateElement(id, { z: nextZIndex++ });
    }
    function deselect(e: MouseEvent) {
        if((e.target as HTMLElement).classList.contains('canvas-container')) {
            selectedElementId = null;
        }
    }
    
    // --- MANEJO DE ARCHIVOS ---
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
    function handleFileInput(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.[0]) handleFile(input.files[0]);
    }
    function handleFile(file: File, x = 50, y = 50) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const url = e.target?.result as string;
            const img = new Image();
            img.onload = () => {
                const aspect = img.width / img.height;
                const w = 150;
                elements.push({
                    id: Date.now(), type: 'image', url, x, y, 
                    width: w, height: w / aspect, z: nextZIndex++
                });
                hasUnsavedChanges = true;
            }
            img.src = url;
        }
        reader.readAsDataURL(file);
    }

    // --- HERRAMIENTAS ---
    function addText() {
        elements.push({
            id: Date.now(), type: 'text', content: 'Nuevo Texto',
            x: 50, y: 50, width: 200, height: 30, fontSize: 16, color: '#333',
            z: nextZIndex++
        });
        hasUnsavedChanges = true;
    }
    function deleteSelected() {
        if(selectedElementId === null) return;
        elements = elements.filter(el => el.id !== selectedElementId);
        selectedElementId = null;
        hasUnsavedChanges = true;
    }

</script>

<svelte:head>
    <title>Editor - DUA-Conecta</title>
</svelte:head>

<main class="editor-layout">
    <aside class="editor-sidebar">
        <a href="/dashboard/plantillas" class="back-button" style="text-decoration: none; color: var(--text-light); font-weight: 600; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem;">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            <span>Volver</span>
        </a>

        <div class="tool-section">
            <h3>Añadir Elementos</h3>
            <button class="btn-secondary" onclick={addText}>+ Añadir Texto</button>
            <label for="image-upload" class="btn-secondary btn-upload">+ Subir Imagen</label>
            <input type="file" id="image-upload" accept="image/*" onchange={handleFileInput} />
        </div>

        {#if selectedElement}
            <div class="tool-section">
                <h3>Elemento Seleccionado</h3>
                
                {#if selectedElement.type === 'text'}
                    <label class="prop-label" for="font-size">Tamaño de Fuente</label>
                    <input
                        type="number"
                        id="font-size"
                        class="font-size-input"
                        value={selectedElement.fontSize}
                        oninput={(e) => updateElement(selectedElementId, { fontSize: parseInt(e.currentTarget.value) })}
                    />
                    
                    <label class="prop-label" for="font-color">Color</label>
                    <input 
                        type="color" 
                        id="font-color" 
                        value={selectedElement.color} 
                        oninput={(e) => updateElement(selectedElementId, { color: e.currentTarget.value })}
                    />
                {/if}

                <button class="btn-secondary" style="background-color: #e53e3e; color: white; border-color: #e53e3e; margin-top: 1rem;" onclick={deleteSelected}>
                    Eliminar Elemento
                </button>
            </div>
        {/if}

        <div class="tool-section actions">
            <h3>Acciones</h3>
            <button class="btn-secondary" onclick={() => {hasUnsavedChanges=false}} disabled={!hasUnsavedChanges}>Guardar</button>
            <button class="btn-primary" onclick={() => alert("Descargando PDF...")}>Descargar PDF</button>
        </div>
    </aside>

    <div class="editor-canvas-area" ondragover={handleDragOver} ondrop={handleDrop} onclick={deselect}>
        <div class="canvas-container" onmousedown={deselect}>
            {#each elements as element (element.id)}
                <Draggable 
                    element={element}
                    isSelected={element.id === selectedElementId}
                    onSelect={selectElement}
                    onUpdate={updateElement}
                />
            {/each}
        </div>
    </div>
</main>