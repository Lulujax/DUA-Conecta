<script lang="ts">
    import { page } from '$app/stores';
    import { beforeNavigate } from '$app/navigation'; // Necesitarás esto si implementas el aviso de cambios sin guardar
    import Draggable from '$lib/editor/Draggable.svelte';

    const templateId = $page.params.templateId;
    let hasUnsavedChanges = $state(false);
    let selectedElementId = $state<number | null>(null);

    // --- PLANTILLA BASE (Monstruo Emociones) - CON POSICIONES AJUSTADAS ---
    // Ajustamos x, y, width, height, fontSize, etc. para parecerse al documento
    let initialElements: Array<any> = [
        // Encabezado
        { id: 1, type: 'text', content: 'Nombre:', x: 50, y: 50, width: 70, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left'},
        { id: 101, type: 'text', content: '_____________________', x: 125, y: 50, width: 200, height: 20, fontSize: 14, color: '#000000', textAlign: 'left'}, // Línea Nombre
        { id: 2, type: 'text', content: 'Fecha:', x: 400, y: 50, width: 60, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left' },
        { id: 102, type: 'text', content: '__________', x: 465, y: 50, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left'}, // Línea Fecha
        { id: 3, type: 'text', content: 'Grado:', x: 600, y: 50, width: 60, height: 20, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left' },
        { id: 103, type: 'text', content: '__________', x: 665, y: 50, width: 100, height: 20, fontSize: 14, color: '#000000', textAlign: 'left'}, // Línea Grado

        // Título
        { id: 4, type: 'text', content: 'El Monstruo de las Emociones', x: 50, y: 100, width: 650, height: 40, fontSize: 28, color: '#000000', isBold: true, textAlign: 'center' },

        // Instrucciones
        { id: 6, type: 'text', content: 'El monstruo siente muchas emociones, dice que en cada parte de su cuerpo hay una emoción ¿En qué parte del cuerpo sientes la emoción?', x: 50, y: 160, width: 650, height: 50, fontSize: 14, color: '#000000', textAlign: 'left' },

        // Lista de Colores
        { id: 7, type: 'text', content: 'COLORES Y EMOCIONES:', x: 50, y: 230, width: 650, height: 25, fontSize: 14, color: '#000000', isBold: true, textAlign: 'left' },
        { id: 8, type: 'text', content: '• ROJO - IRA/MOLESTIA', x: 70, y: 260, width: 250, height: 20, fontSize: 14, color: '#000000', textAlign: 'left' },
        { id: 9, type: 'text', content: '• MORADO - MIEDO', x: 70, y: 285, width: 250, height: 20, fontSize: 14, color: '#000000', textAlign: 'left' },
        { id: 10, type: 'text', content: '• AZUL - TRISTEZA', x: 70, y: 310, width: 250, height: 20, fontSize: 14, color: '#000000', textAlign: 'left' },
        { id: 11, type: 'text', content: '• AMARILLO - FELICIDAD', x: 70, y: 335, width: 250, height: 20, fontSize: 14, color: '#000000', textAlign: 'left' },
        { id: 12, type: 'text', content: '• VERDE - ASCO', x: 70, y: 360, width: 250, height: 20, fontSize: 14, color: '#000000', textAlign: 'left' },

        // Imagen del Monstruo - RUTA CORREGIDA
        { id: 5, type: 'image', url: '/asdasda-removebg-preview.png', x: 200, y: 400, width: 300, height: 300 }, // Ajusta X, Y, Width, Height según necesites

        // Footer
        { id: 13, type: 'text', content: '¡Gana tu ficha aquí!', x: 400, y: 830, width: 180, height: 25, fontSize: 14, color: '#000000', isBold: true, textAlign: 'right'},
        { id: 113, type: 'text', content: '_____________________', x: 590, y: 830, width: 160, height: 25, fontSize: 14, color: '#000000', textAlign: 'left'} // Línea Footer
    ];

    let elements = $state(initialElements);
    let nextZIndex = $state(initialElements.length + 1);

    let selectedElement = $derived(elements.find(el => el.id === selectedElementId) || null);

    // --- LÓGICA DE ESTADO ---
    function updateElement(id: number, data: any) {
        const index = elements.findIndex(el => el.id === id);
        if (index !== -1) {
            // Mantiene la proporción para imágenes al redimensionar si solo cambia width
            if (elements[index].type === 'image' && data.width && !data.height) {
                const oldWidth = elements[index].width;
                const oldHeight = elements[index].height;
                data.height = data.width / (oldWidth / oldHeight);
            }
             // Mantiene la proporción para imágenes al redimensionar si solo cambia height
            else if (elements[index].type === 'image' && data.height && !data.width) {
                 const oldWidth = elements[index].width;
                 const oldHeight = elements[index].height;
                 data.width = data.height * (oldWidth / oldHeight);
            }
            elements[index] = { ...elements[index], ...data };
            hasUnsavedChanges = true;
        }
    }
    function selectElement(id: number, e: MouseEvent) {
        e.stopPropagation();
        selectedElementId = id;
        // Trae el elemento al frente al seleccionarlo
        updateElement(id, { z: nextZIndex++ });
    }
    function deselect(e: MouseEvent) {
        // Deselecciona solo si se hace clic directamente en el contenedor del canvas
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
            // Calcula la posición relativa al canvas
            const x = e.clientX - canvasRect.left;
            const y = e.clientY - canvasRect.top;
            handleFile(e.dataTransfer.files[0], x, y);
        }
    }
    function handleFileInput(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files?.[0]) handleFile(input.files[0]);
        input.value = ''; // Permite subir el mismo archivo de nuevo
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
                const maxWidth = 150; // Ancho inicial por defecto
                const initialWidth = Math.min(maxWidth, img.width);
                const initialHeight = initialWidth / aspect;

                // Ajusta coords si caen fuera del canvas (simple)
                const finalX = Math.max(0, x - initialWidth / 2);
                const finalY = Math.max(0, y - initialHeight / 2);

                elements = [...elements, { // Usar [...elements, newElement] para reactividad Svelte 5
                    id: Date.now(), type: 'image', url,
                    x: finalX, y: finalY,
                    width: initialWidth, height: initialHeight,
                    z: nextZIndex++
                }];
                hasUnsavedChanges = true;
            }
            img.onerror = () => {
                 alert('Error al cargar la imagen.');
            }
            img.src = url;
        }
        reader.onerror = () => {
             alert('Error al leer el archivo.');
        }
        reader.readAsDataURL(file);
    }

    // --- HERRAMIENTAS ---
    function addText() {
         elements = [...elements, { // Usar [...elements, newElement]
            id: Date.now(), type: 'text', content: 'Nuevo Texto',
            x: 50, y: 50, width: 200, height: 30, fontSize: 16, color: '#333',
            textAlign: 'left', isBold: false, // Añadir propiedades por defecto
            z: nextZIndex++
        }];
        hasUnsavedChanges = true;
        // Seleccionar el texto recién añadido
        selectedElementId = elements[elements.length - 1].id;
    }
    function deleteSelected() {
        if(selectedElementId === null) return;
        elements = elements.filter(el => el.id !== selectedElementId); // Usar asignación para reactividad
        selectedElementId = null;
        hasUnsavedChanges = true;
    }

    // --- Acciones de Guardado/Descarga (Simuladas) ---
    function saveChanges() {
      // Aquí iría la lógica para enviar 'elements' al backend
      console.log("Guardando:", elements);
      hasUnsavedChanges = false;
      alert("¡Plantilla guardada (simulado)!");
    }
    function downloadPdf() {
      // Aquí iría la lógica para generar y descargar el PDF
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
                <div style:z-index={element.z || 0}> <Draggable
                        element={element}
                        isSelected={element.id === selectedElementId}
                        onSelect={selectElement}
                        onUpdate={updateElement}
                    />
                </div>
            {/each}
         </div>
    </div>
</main>

<style>
    /* --- Estilos Generales del Layout del Editor --- */
    .editor-layout {
      display: flex;
      /* Ajusta la altura para ocupar el espacio bajo el header del dashboard si existe, sino, pantalla completa */
      height: 100vh; /* O calc(100vh - ALTO_DEL_HEADER) si el layout del dashboard no ocupa toda la altura */
      overflow: hidden; /* Evita scroll en el layout principal */
      background-color: var(--bg-section); /* Fondo del área fuera del canvas */
    }

    /* --- Barra Lateral --- */
    .editor-sidebar {
      width: 280px;
      flex-shrink: 0; /* Evita que se encoja */
      background-color: var(--bg-card);
      border-right: 1px solid var(--border-color);
      padding: 1.5rem;
      overflow-y: auto; /* Permite scroll si hay muchas herramientas */
      display: flex;
      flex-direction: column;
      gap: 1.5rem; /* Espacio entre secciones */
    }

    .back-button {
      text-decoration: none;
      color: var(--text-light);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem; /* Ajuste espacio */
      transition: color 0.2s ease;
    }
    .back-button:hover {
      color: var(--primary-color);
    }

    .tool-section {
       /* Eliminamos bordes y márgenes inferiores fijos, usamos gap */
    }

    .tool-section h3 {
      font-size: 1rem; /* Ligeramente más pequeño */
      font-weight: 700;
      color: var(--text-dark);
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    /* Botones y Inputs en la barra lateral */
    .editor-sidebar button, .editor-sidebar .btn-upload {
      width: 100%;
      margin-top: 0.5rem;
      text-align: center; /* Asegura texto centrado */
      padding: 0.6rem 1rem; /* Ajuste padding */
      font-size: 0.85rem; /* Ligeramente más pequeño */
    }
    .editor-sidebar input[type="file"] { display: none; } /* Oculta input file real */

    .prop-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-light);
      margin-top: 1rem;
      margin-bottom: 0.3rem; /* Espacio bajo label */
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
      margin-bottom: 0.75rem; /* Espacio bajo inputs */
    }
     .color-input {
      height: 40px; /* Altura específica para color */
      padding: 2px; /* Padding interno para color */
      cursor: pointer;
    }

    .tool-group {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
        margin-bottom: 0.75rem;
    }
    .tool-button {
        flex: 1; /* Ocupan espacio equitativo */
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
      background-color: #f15e5e; /* Rojo más suave */
      color: white;
      border-color: #f15e5e;
      margin-top: 1.5rem; /* Más espacio arriba */
    }
    .btn-delete:hover {
       background-color: #e53e3e; /* Rojo más oscuro al pasar */
       border-color: #e53e3e;
    }

    /* Sección de Acciones al final */
    .actions {
      margin-top: auto; /* Empuja al fondo */
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }
    .actions button:first-child {
      margin-bottom: 0.75rem; /* Espacio entre botones */
    }

    /* --- Área del Canvas --- */
    .editor-canvas-area {
      flex-grow: 1; /* Ocupa el espacio restante */
      display: flex;
      justify-content: center;
      align-items: flex-start; /* Hoja alineada arriba */
      padding: 3rem; /* Más padding alrededor de la hoja */
      overflow: auto; /* Permite scroll si la ventana es pequeña */
    }

    /* Contenedor de la Hoja/Plantilla */
    .canvas-container {
      position: relative; /* Clave para el posicionamiento absoluto de Draggable */
      width: 21cm; /* Ancho A4 */
      height: 29.7cm; /* Alto A4 */
      background-color: white;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15); /* Sombra más pronunciada */
      overflow: hidden; /* Recorta elementos que se salgan */
      border: 1px solid #ccc; /* Borde visible para la hoja */
      flex-shrink: 0; /* No se encoge */
    }
</style>