<script lang="ts">
    import { page } from '$app/stores';
    import { beforeNavigate } from '$app/navigation';
    import Draggable from '$lib/editor/Draggable.svelte';

    const templateId = $page.params.templateId;
    let hasUnsavedChanges = $state(false);
    let selectedElementId = $state<number | null>(null);

    // --- ESTADO PARA LÍNEAS DE AJUSTE ---
    let verticalSnapLine = $state<number | null>(null);
    let horizontalSnapLine = $state<number | null>(null);

    function handleShowSnapLine(line: { type: 'vertical' | 'horizontal', position: number | null }) {
        if (line.type === 'vertical') {
            verticalSnapLine = line.position;
        } else {
            horizontalSnapLine = line.position;
        }
    }

    // --- PLANTILLA BASE (Monstruo Emociones) - CON POSICIONES REAJUSTADAS ---
    // Coordenadas ajustadas para encajar mejor en 700x990 y estar más centrado
    let initialElements: Array<any> = [
        // Encabezado (Margen izquierdo ~50px, Margen derecho ~50px)
        { id: 1, type: 'text', content: 'Nombre:', x: 50, y: 40, width: 60, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left'},
        { id: 101, type: 'text', content: '_____________________', x: 115, y: 40, width: 180, height: 20, fontSize: 12, color: '#000000', textAlign: 'left'},
        { id: 2, type: 'text', content: 'Fecha:', x: 350, y: 40, width: 50, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left' },
        { id: 102, type: 'text', content: '__________', x: 405, y: 40, width: 100, height: 20, fontSize: 12, color: '#000000', textAlign: 'left'},
        { id: 3, type: 'text', content: 'Grado:', x: 550, y: 40, width: 50, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left' },
        { id: 103, type: 'text', content: '______', x: 605, y: 40, width: 80, height: 20, fontSize: 12, color: '#000000', textAlign: 'left'},

        // Título (Centrado en 700px)
        { id: 4, type: 'text', content: 'El Monstruo de las Emociones', x: 50, y: 90, width: 600, height: 35, fontSize: 24, color: '#000000', isBold: true, textAlign: 'center' },

        // Instrucciones (Ancho completo con márgenes)
        { id: 6, type: 'text', content: 'El monstruo siente muchas emociones, dice que en cada parte de su cuerpo hay una emoción ¿En qué parte del cuerpo sientes la emoción?', x: 50, y: 140, width: 600, height: 40, fontSize: 12, color: '#000000', textAlign: 'left' },

        // Lista de Colores (Alineada a la izquierda con margen)
        { id: 7, type: 'text', content: 'COLORES Y EMOCIONES:', x: 50, y: 200, width: 600, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'left' },
        { id: 8, type: 'text', content: '• ROJO - IRA/MOLESTIA', x: 70, y: 230, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left' },
        { id: 9, type: 'text', content: '• MORADO - MIEDO', x: 70, y: 250, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left' },
        { id: 10, type: 'text', content: '• AZUL - TRISTEZA', x: 70, y: 270, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left' },
        { id: 11, type: 'text', content: '• AMARILLO - FELICIDAD', x: 70, y: 290, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left' },
        { id: 12, type: 'text', content: '• VERDE - ASCO', x: 70, y: 310, width: 250, height: 18, fontSize: 12, color: '#000000', textAlign: 'left' },

        // Imagen del Monstruo (Centrada horizontalmente, más abajo)
        { id: 5, type: 'image', url: '/asdasda-removebg-preview.png', x: 200, y: 360, width: 300, height: 300 }, // Centrado en 700px ( (700-300)/2 = 200 )

        // Footer (Alineado a la derecha con margen)
        { id: 13, type: 'text', content: '¡Gana tu ficha aquí!', x: 380, y: 920, width: 160, height: 20, fontSize: 12, color: '#000000', isBold: true, textAlign: 'right'},
        { id: 113, type: 'text', content: '___________', x: 550, y: 920, width: 100, height: 20, fontSize: 12, color: '#000000', textAlign: 'left'}
    ];


    let elements = $state(initialElements);
    let nextZIndex = $state(initialElements.length + 1);

    let selectedElement = $derived(elements.find(el => el.id === selectedElementId) || null);

    // --- LÓGICA DE ESTADO ---
    function updateElement(id: number, data: any) {
        const index = elements.findIndex(el => el.id === id);
        if (index !== -1) {
             if (elements[index].type === 'image' && data.width && data.height === undefined) {
                 const oldWidth = elements[index].width;
                 const oldHeight = elements[index].height;
                 if (oldWidth > 0 && oldHeight > 0) {
                     data.height = data.width / (oldWidth / oldHeight);
                 }
             }
             else if (elements[index].type === 'image' && data.height && data.width === undefined) {
                 const oldWidth = elements[index].width;
                 const oldHeight = elements[index].height;
                  if (oldWidth > 0 && oldHeight > 0) {
                     data.width = data.height * (oldWidth / oldHeight);
                 }
             }
            const currentZ = elements[index].z;
            elements[index] = { ...elements[index], ...data, z: data.z ?? currentZ };
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
        input.value = '';
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
                const initialHeight = initialWidth / aspect;
                const finalX = Math.max(0, x - initialWidth / 2);
                const finalY = Math.max(0, y - initialHeight / 2);

                elements = [...elements, {
                    id: Date.now(), type: 'image', url,
                    x: finalX, y: finalY,
                    width: initialWidth, height: initialHeight,
                    z: nextZIndex++
                }];
                hasUnsavedChanges = true;
            }
            img.onerror = () => { alert('Error al cargar la imagen.'); }
            img.src = url;
        }
        reader.onerror = () => { alert('Error al leer el archivo.'); }
        reader.readAsDataURL(file);
    }

    // --- HERRAMIENTAS ---
    function addText() {
         elements = [...elements, {
            id: Date.now(), type: 'text', content: 'Nuevo Texto',
            x: 50, y: 50, width: 200, height: 30, fontSize: 16, color: '#000000',
            textAlign: 'left', isBold: false,
            z: nextZIndex++
        }];
        hasUnsavedChanges = true;
        selectedElementId = elements[elements.length - 1].id;
    }
    function deleteSelected() {
        if(selectedElementId === null) return;
        elements = elements.filter(el => el.id !== selectedElementId);
        selectedElementId = null;
        hasUnsavedChanges = true;
    }

    // --- Acciones de Guardado/Descarga (Simuladas) ---
    function saveChanges() {
        console.log("Guardando:", elements);
        hasUnsavedChanges = false;
        alert("¡Plantilla guardada (simulado)!");
    }
    function downloadPdf() {
        console.log("Descargando PDF con:", elements);
        alert("Descargando PDF (simulado)...");
    }

    // --- Aviso antes de salir ---
    beforeNavigate(({ cancel }) => {
        if (hasUnsavedChanges) {
            if (!confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
                cancel();
            }
        }
    });

    // --- Funciones para herramientas de texto ---
    function toggleBold() {
        if (selectedElement?.type === 'text') {
            updateElement(selectedElementId!, { isBold: !selectedElement.isBold });
        }
    }
    function changeTextAlign(align: 'left' | 'center' | 'right') {
         if (selectedElement?.type === 'text') {
            updateElement(selectedElementId!, { textAlign: align });
        }
    }

</script>

<svelte:head>
    <title>Editor - {templateId} - DUA-Conecta</title>
</svelte:head>

<main class="editor-layout">
    <aside class="editor-sidebar">
         <a href="/dashboard/plantillas" class="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              <span>Volver a Plantillas</span>
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
                     <label class="prop-label" for="font-size">Tamaño (px)</label>
                     <input
                          type="number"
                         id="font-size"
                         class="tool-input"
                         min="8"
                         max="120"
                         value={selectedElement.fontSize}
                          oninput={(e) => updateElement(selectedElementId!, { fontSize: parseInt(e.currentTarget.value) })}
                     />

                     <label class="prop-label" for="font-color">Color</label>
                     <input
                          type="color"
                         id="font-color"
                         class="tool-input color-input"
                         value={selectedElement.color}
                          oninput={(e) => updateElement(selectedElementId!, { color: e.currentTarget.value })}
                     />

                     <div class="tool-group">
                          <button class="tool-button" class:active={selectedElement.isBold} onclick={toggleBold} title="Negrita">B</button>
                          <button class="tool-button" class:active={selectedElement.textAlign === 'left'} onclick={() => changeTextAlign('left')} title="Alinear Izquierda">L</button>
                          <button class="tool-button" class:active={selectedElement.textAlign === 'center'} onclick={() => changeTextAlign('center')} title="Centrar">C</button>
                          <button class="tool-button" class:active={selectedElement.textAlign === 'right'} onclick={() => changeTextAlign('right')} title="Alinear Derecha">R</button>
                     </div>

                 {/if}

                 {#if selectedElement.type === 'image'}
                      <p class="prop-label" style="margin-top:0;">Imagen</p>
                      <p style="font-size: 0.8rem; color: var(--text-light);">Puedes arrastrarla o usar la esquina para redimensionar.</p>
                 {/if}

                 <button class="btn-secondary btn-delete" onclick={deleteSelected}>
                     Eliminar Elemento
                 </button>
             </div>
         {/if}

         <div class="tool-section actions">
             <h3>Acciones</h3>
             <button class="btn-secondary" onclick={saveChanges} disabled={!hasUnsavedChanges}>
                 {#if hasUnsavedChanges}Guardar Cambios{:else}Guardado ✓{/if}
             </button>
             <button class="btn-primary" onclick={downloadPdf}>Descargar PDF</button>
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
                    allElements={elements}
                    onShowSnapLine={handleShowSnapLine} />
            {/each}

            {#if verticalSnapLine !== null}
                <div class="snap-line vertical" style:left="{verticalSnapLine}px"></div>
            {/if}
            {#if horizontalSnapLine !== null}
                <div class="snap-line horizontal" style:top="{horizontalSnapLine}px"></div>
            {/if}
        </div>
    </div>
</main>

<style>
    .editor-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background-color: var(--bg-section);
    }

    .editor-sidebar {
      width: 280px;
      flex-shrink: 0;
      background-color: var(--bg-card);
      border-right: 1px solid var(--border-color);
      padding: 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .back-button {
      text-decoration: none;
      color: var(--text-light);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      transition: color 0.2s ease;
    }
    .back-button:hover {
      color: var(--primary-color);
    }

    .tool-section h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-dark);
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .editor-sidebar button, .editor-sidebar .btn-upload {
      width: 100%;
      text-align: center;
      padding: 0.6rem 1rem;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
    }
    .editor-sidebar input[type="file"] { display: none; }

    .prop-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-light);
      margin-top: 1rem;
      margin-bottom: 0.3rem;
      display: block;
    }

    .tool-input {
      width: 100%;
      padding: 0.6rem 0.8rem;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background-color: var(--bg-section);
      color: var(--text-dark);
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
    }
     .color-input {
      height: 40px;
      padding: 2px;
      cursor: pointer;
    }

    .tool-group {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
        margin-bottom: 0.75rem;
    }
    .tool-button {
        flex: 1;
        padding: 0.5rem;
        font-size: 0.9rem;
        font-weight: bold;
        background-color: var(--bg-section);
        border: 1px solid var(--border-color);
        color: var(--text-light);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    .tool-button:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
    }
    .tool-button.active {
         background-color: var(--primary-color);
         color: var(--text-on-primary);
         border-color: var(--primary-color);
    }

    .btn-delete {
      background-color: #f15e5e;
      color: white;
      border-color: #f15e5e;
      margin-top: 1rem;
    }
    .btn-delete:hover {
       background-color: #e53e3e;
       border-color: #e53e3e;
    }

    .actions {
      margin-top: auto;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }
    .actions button:first-child {
      margin-bottom: 0.75rem;
    }

    .editor-canvas-area {
      flex-grow: 1;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 2rem;
      overflow: auto;
    }

    .canvas-container {
      position: relative;
      width: 700px; /* Ajustado para pantalla */
      height: 990px; /* Ajustado para pantalla (~A4 ratio) */
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
    .snap-line.vertical {
        width: 1px;
        height: 100%;
        top: 0;
    }
    .snap-line.horizontal {
        height: 1px;
        width: 100%;
        left: 0;
    }
</style>