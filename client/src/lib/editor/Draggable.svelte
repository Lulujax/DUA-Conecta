<script lang="ts">
  // Usamos $props() para la sintaxis de Svelte 5
  let { element, isSelected, onUpdate, onSelect } = $props<{
    element: any,
    isSelected: boolean,
    onUpdate: (id: number, data: any) => void,
    onSelect: (id: number, e: MouseEvent) => void
  }>();

  // --- LÓGICA DE ARRASTRE ---
  function onDragStart(e: MouseEvent) {
    if (e.button !== 0 || (e.target as HTMLElement).isContentEditable) return; // No arrastrar con clic derecho o si se edita texto
    e.preventDefault();
    onSelect(element.id, e); // Notifica al padre que este elemento está seleccionado

    const startX = e.clientX;
    const startY = e.clientY;
    const startElX = element.x;
    const startElY = element.y;

    function onDragMove(e: MouseEvent) {
      const newX = startElX + (e.clientX - startX);
      const newY = startElY + (e.clientY - startY);
      onUpdate(element.id, { x: newX, y: newY });
    }
    function onDragEnd() {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
    }
    // Añadimos listeners globales SOLO al iniciar el arrastre
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }

  // --- LÓGICA DE REDIMENSIONAMIENTO ---
  function onResizeStart(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation(); // Detiene el evento de arrastre

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;

    function onResizeMove(e: MouseEvent) {
      const newWidth = Math.max(50, startWidth + (e.clientX - startX));
      const newHeight = element.type === 'image' 
        ? newWidth / (startWidth / startHeight) // Mantiene proporción para imágenes
        : Math.max(30, startHeight + (e.clientY - startY)); // Altura libre para texto
      onUpdate(element.id, { width: newWidth, height: newHeight });
    }
    function onResizeEnd() {
      window.removeEventListener('mousemove', onResizeMove);
      window.removeEventListener('mouseup', onResizeEnd);
    }
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeEnd);
  }

  // --- LÓGICA DE EDICIÓN DE TEXTO ---
  function handleInput(e: Event) {
    const target = e.target as HTMLElement;
    onUpdate(element.id, { content: target.innerText });
  }

  function stopPropagation(e: MouseEvent) {
    e.stopPropagation(); // Evita que el clic en el texto inicie un arrastre
  }
</script>

<div
  class="draggable-wrapper"
  class:selected={isSelected}
  style:transform="translate({element.x}px, {element.y}px)"
  style:width="{element.width}px"
  style:height="{element.type === 'image' ? element.height + 'px' : 'auto'}"
  onmousedown={onDragStart}
  role="button"
  tabindex="0"
>
  {#if element.type === 'image'}
    <img src={element.url} alt="Elemento de plantilla" class="element-content" draggable="false" />
  {:else if element.type === 'text'}
    <div
      class="element-content text-content"
      style:font-size="{element.fontSize}px"
      style:color={element.color}
      style:font-family={element.fontFamily || 'Arial, sans-serif'}
      style:font-weight={element.isBold ? 'bold' : 'normal'}
      style:text-align={element.textAlign || 'left'}
      contenteditable="true"
      oninput={handleInput}
      onmousedown={stopPropagation}
      spellcheck="false"
    >
      {element.content}
    </div>
  {/if}

  {#if isSelected}
    <div class="resize-handle" onmousedown={(e) => { e.stopPropagation(); onResizeStart(e); }}></div>
  {/if}
</div>

<style>
  .draggable-wrapper {
    position: absolute;
    cursor: grab;
    border: 2px dashed transparent;
    transition: border-color 0.2s ease;
  }
  .draggable-wrapper:hover {
    border-color: rgba(160, 132, 232, 0.5);
  }
  .draggable-wrapper.selected {
    border: 2px solid var(--primary-color, #A084E8);
    z-index: 999;
  }
  .draggable-wrapper:active {
    cursor: grabbing;
    z-index: 1000;
  }
  .element-content {
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  img.element-content {
    object-fit: contain;
  }
  .text-content {
    pointer-events: auto;
    cursor: text;
    overflow: hidden;
    white-space: pre-wrap;
    outline: none;
    padding: 2px;
    height: auto;
  }
  .resize-handle {
    position: absolute;
    bottom: -6px;
    right: -6px;
    width: 12px;
    height: 12px;
    background: var(--primary-color, #A084E8);
    border: 2px solid white;
    border-radius: 50%;
    cursor: nwse-resize;
    z-index: 1001;
  }
</style>