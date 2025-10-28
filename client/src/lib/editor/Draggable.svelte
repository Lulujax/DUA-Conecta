<script lang="ts">
  // --- PROPS ---
  let {
    element,
    isSelected,
    onUpdate,
    onSelect,
    allElements = [],
    onShowSnapLine = (line: { type: 'vertical' | 'horizontal', position: number | null }) => {}
  } = $props<{
    element: any,
    isSelected: boolean,
    onUpdate: (id: number, data: any) => void,
    onSelect: (id: number, e: MouseEvent) => void,
    allElements?: any[],
    onShowSnapLine?: (line: { type: 'vertical' | 'horizontal', position: number | null }) => void
  }>();

  const snapThreshold = 5; // Píxeles de tolerancia para el ajuste

  // --- LÓGICA DE ARRASTRE (CON AJUSTE/SNAPPING) ---
  function onDragStart(e: MouseEvent) {
    if (e.button !== 0 || (e.target as HTMLElement).isContentEditable) return;
    e.preventDefault();
    onSelect(element.id, e);

    const startX = e.clientX;
    const startY = e.clientY;
    const startElX = element.x;
    const startElY = element.y;

    function onDragMove(e: MouseEvent) {
      let currentX = startElX + (e.clientX - startX);
      let currentY = startElY + (e.clientY - startY);
      let snappedX = null;
      let snappedY = null;
      let showVerticalLine: number | null = null;
      let showHorizontalLine: number | null = null;

      const draggingCenterH = currentX + element.width / 2;
      const draggingCenterV = currentY + element.height / 2;
      const draggingLeft = currentX;
      const draggingRight = currentX + element.width;
      const draggingTop = currentY;
      const draggingBottom = currentY + element.height;

      // Buscar alineaciones verticales (eje X)
      for (const other of allElements) {
        if (other.id === element.id) continue;
        const otherCenterH = other.x + other.width / 2;
        const otherLeft = other.x;
        const otherRight = other.x + other.width;

        if (Math.abs(draggingCenterH - otherCenterH) < snapThreshold) { snappedX = otherCenterH - element.width / 2; showVerticalLine = otherCenterH; break; }
        if (Math.abs(draggingLeft - otherLeft) < snapThreshold) { snappedX = otherLeft; showVerticalLine = otherLeft; break; }
        if (Math.abs(draggingRight - otherRight) < snapThreshold) { snappedX = otherRight - element.width; showVerticalLine = otherRight; break; }
        if (Math.abs(draggingLeft - otherRight) < snapThreshold) { snappedX = otherRight; showVerticalLine = otherRight; break; }
        if (Math.abs(draggingRight - otherLeft) < snapThreshold) { snappedX = otherLeft - element.width; showVerticalLine = otherLeft; break; }
      }

       // Buscar alineaciones horizontales (eje Y)
       for (const other of allElements) {
        if (other.id === element.id) continue;
        const otherCenterV = other.y + other.height / 2;
        const otherTop = other.y;
        const otherBottom = other.y + other.height;

        if (Math.abs(draggingCenterV - otherCenterV) < snapThreshold) { snappedY = otherCenterV - element.height / 2; showHorizontalLine = otherCenterV; break; }
        if (Math.abs(draggingTop - otherTop) < snapThreshold) { snappedY = otherTop; showHorizontalLine = otherTop; break; }
        if (Math.abs(draggingBottom - otherBottom) < snapThreshold) { snappedY = otherBottom - element.height; showHorizontalLine = otherBottom; break; }
        if (Math.abs(draggingTop - otherBottom) < snapThreshold) { snappedY = otherBottom; showHorizontalLine = otherBottom; break; }
        if (Math.abs(draggingBottom - otherTop) < snapThreshold) { snappedY = otherTop - element.height; showHorizontalLine = otherTop; break; }
      }

      const finalX = snappedX !== null ? snappedX : currentX;
      const finalY = snappedY !== null ? snappedY : currentY;

      onUpdate(element.id, { x: finalX, y: finalY });
      onShowSnapLine({ type: 'vertical', position: showVerticalLine });
      onShowSnapLine({ type: 'horizontal', position: showHorizontalLine });
    }

    function onDragEnd() {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
      onShowSnapLine({ type: 'vertical', position: null });
      onShowSnapLine({ type: 'horizontal', position: null });
    }

    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
  }

  // --- LÓGICA DE REDIMENSIONAMIENTO ---
  function onResizeStart(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = element.width;
    const startHeight = element.height;

    function onResizeMove(e: MouseEvent) {
      let newWidth = Math.max(50, startWidth + (e.clientX - startX));
      let newHeight = startHeight + (e.clientY - startY);

       if (element.type === 'image') {
           const aspectRatio = (startHeight > 0) ? startWidth / startHeight : 0;
           if(aspectRatio > 0) {
               if (Math.abs(e.clientX - startX) > Math.abs(e.clientY - startY)) {
                   newHeight = newWidth / aspectRatio;
               } else {
                   newWidth = newHeight * aspectRatio;
                   newWidth = Math.max(50, newWidth);
                   newHeight = newWidth / aspectRatio;
               }
           } else {
               newHeight = Math.max(30, newHeight);
           }
       } else {
           newHeight = Math.max(30, newHeight);
       }

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
    if (element.content !== target.innerText) {
        onUpdate(element.id, { content: target.innerText });
    }
  }

  function stopPropagation(e: MouseEvent) {
    e.stopPropagation();
  }
</script>

<div
  class="draggable-wrapper"
  class:selected={isSelected}
  style:transform="translate({element.x}px, {element.y}px)"
  style:width="{element.width}px"
  style:height="{element.type === 'image' ? element.height + 'px' : 'auto'}"
  style:min-height="{element.type === 'text' ? '1.2em' : 'auto'}"
  style:z-index={element.z || 0}
  onmousedown={onDragStart}
  role="button"
  tabindex="0"
>
  {#if element.type === 'image'}
    <img src={element.url} alt="Elemento de plantilla" class="element-content image-content" draggable="false" />
  {:else if element.type === 'text'}
    <div
      class="element-content text-content"
      style:font-size="{element.fontSize}px"
      style:color={element.color || '#000000'}
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
    <div class="resize-handle" onmousedown={onResizeStart}></div>
  {/if}
</div>

<style>
  .draggable-wrapper {
    position: absolute;
    cursor: grab;
    border: 1px dashed transparent;
    transition: border-color 0.2s ease;
    user-select: none;
    box-sizing: border-box;
  }
  .draggable-wrapper:hover {
    border-color: rgba(160, 132, 232, 0.5);
  }
  .draggable-wrapper.selected {
    border: 1px solid var(--primary-color, #A084E8);
  }
  .draggable-wrapper:active {
    cursor: grabbing;
  }

  .element-content {
    width: 100%;
    height: 100%;
    display: block;
    box-sizing: border-box;
  }

  .image-content {
    object-fit: contain;
    pointer-events: none;
  }

  .text-content {
    pointer-events: auto;
    cursor: text;
    overflow-wrap: break-word;
    word-break: break-word;
    white-space: pre-wrap;
    outline: none;
    padding: 2px;
    min-height: 1.2em;
    height: auto;
    /* El color se aplica inline directamente en el style del div */
  }

  .resize-handle {
    position: absolute;
    bottom: -5px;
    right: -5px;
    width: 10px;
    height: 10px;
    background: var(--primary-color, #A084E8);
    border: 1px solid white;
    border-radius: 50%;
    cursor: nwse-resize;
    box-shadow: 0 0 3px rgba(0,0,0,0.3);
    z-index: 1001;
  }
</style>