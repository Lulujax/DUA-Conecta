<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';

	// --- PROPS ---
	let {
		element,
		isSelected,
		onUpdate, // (id: number, data: any, isFinalChange: boolean) => void
		onSelect,
		allElements = [],
		onShowSnapLine = (line: { type: 'vertical' | 'horizontal'; position: number | null }) => {}
	} = $props<{
		element: any;
		isSelected: boolean;
		onUpdate: (id: number, data: any, isFinalChange: boolean) => void;
		onSelect: (id: number, e: MouseEvent | KeyboardEvent) => void;
		allElements?: any[];
		onShowSnapLine?: (line: { type: 'vertical' | 'horizontal'; position: number | null }) => void;
	}>();

	const snapThreshold = 5;
	let isEditing = $state(false);
	let textElementRef: HTMLElement | null = $state(null);
	let wrapperRef: HTMLElement | null = null;

	// Bandera local para bloquear oninput/onblur mientras aplicamos cambios (previene duplicados)
	let applyingLocal = false;

	// --- MANEJO DE CLICS/DOBLE CLICS ---
	let clickTimeout: number | null = null;

	function handleClick(e: MouseEvent) {
		if (isEditing && (e.target as HTMLElement)?.closest('.text-content')) return;

        if (isEditing && !(e.target as HTMLElement)?.closest('.text-content')) { 
            handleBlur();
            onSelect(element.id, e); 
            return; 
        }

		if (clickTimeout === null) {
			clickTimeout = window.setTimeout(() => { clickTimeout = null; if (!isEditing) onSelect(element.id, e); }, 250);
		} else {
			window.clearTimeout(clickTimeout);
			clickTimeout = null;
			handleDoubleClick(e);
		}
	}

	function handleDoubleClick(e: MouseEvent) {
		if (element.type === 'text' && (e.target as HTMLElement)?.closest('.text-content')) {
			isEditing = true;
			$effect(() => { 
                requestAnimationFrame(() => {
                    if (isEditing && textElementRef) {
                        textElementRef.focus();
                        const range = document.createRange(); 
                        const sel = window.getSelection(); 
                        range.selectNodeContents(textElementRef); 
                        range.collapse(false); 
                        sel?.removeAllRanges(); 
                        sel?.addRange(range);
                    }
                });
			});
		}
	}

	// --- LÓGICA DE ARRASTRE ---
	function onDragStart(e: MouseEvent) {
		if (e.button !== 0 || isEditing || (e.target as HTMLElement)?.classList.contains('resize-handle')) return; 
		if ((e.target as HTMLElement)?.closest('.text-content')) e.preventDefault();
		const startX = e.clientX; const startY = e.clientY;
		const startElX = element.x; const startElY = element.y;
		let currentX = startElX; let currentY = startElY; let didMove = false;
		function onDragMove(e: MouseEvent) {
            if (!didMove && clickTimeout !== null) { window.clearTimeout(clickTimeout);
				clickTimeout = null; }
            didMove = true;
			currentX = startElX + (e.clientX - startX); currentY = startElY + (e.clientY - startY);
			let snappedX = null;
			let snappedY = null; let showVerticalLine: number | null = null; let showHorizontalLine: number | null = null;
			const draggingCenterH = currentX + element.width / 2; const draggingCenterV = currentY + element.height / 2; const draggingLeft = currentX;
			const draggingRight = currentX + element.width; const draggingTop = currentY; const draggingBottom = currentY + element.height;
			for (const other of allElements) { if (other.id === element.id) continue; const otherCenterH = other.x + other.width / 2;
				const otherLeft = other.x; const otherRight = other.x + other.width;
				if (Math.abs(draggingCenterH - otherCenterH) < snapThreshold) { snappedX = otherCenterH - element.width / 2; showVerticalLine = otherCenterH; break;
				} if (Math.abs(draggingLeft - otherLeft) < snapThreshold) { snappedX = otherLeft; showVerticalLine = otherLeft; break;
				} if (Math.abs(draggingRight - otherRight) < snapThreshold) { snappedX = otherRight - element.width; showVerticalLine = otherRight; break;
				} if (Math.abs(draggingLeft - otherRight) < snapThreshold) { snappedX = otherRight; showVerticalLine = otherRight; break;
				} if (Math.abs(draggingRight - otherLeft) < snapThreshold) { snappedX = otherLeft - element.width; showVerticalLine = otherLeft; break;
				} }
			for (const other of allElements) { if (other.id === element.id) continue; const otherCenterV = other.y + other.height / 2;
				const otherTop = other.y; const otherBottom = other.y + other.height;
				if (Math.abs(draggingCenterV - otherCenterV) < snapThreshold) { snappedY = otherCenterV - element.height / 2; showHorizontalLine = otherCenterV; break;
				} if (Math.abs(draggingTop - otherTop) < snapThreshold) { snappedY = otherTop; showHorizontalLine = otherTop; break;
				} if (Math.abs(draggingBottom - otherBottom) < snapThreshold) { snappedY = otherBottom - element.height; showHorizontalLine = otherBottom; break;
				} if (Math.abs(draggingTop - otherBottom) < snapThreshold) { snappedY = otherBottom; showHorizontalLine = otherBottom; break;
				} if (Math.abs(draggingBottom - otherTop) < snapThreshold) { snappedY = otherTop - element.height; showHorizontalLine = otherTop; break;
				} }
			const finalX = snappedX !== null ? snappedX : currentX; const finalY = snappedY !== null ?
				snappedY : currentY;
			onUpdate(element.id, { x: finalX, y: finalY }, false);
			onShowSnapLine({ type: 'vertical', position: showVerticalLine });
			onShowSnapLine({ type: 'horizontal', position: showHorizontalLine });
			currentX = finalX; currentY = finalY;
		}
		function onDragEnd(e: MouseEvent) {
			window.removeEventListener('mousemove', onDragMove); window.removeEventListener('mouseup', onDragEnd);
			onShowSnapLine({ type: 'vertical', position: null }); onShowSnapLine({ type: 'horizontal', position: null });
			if (didMove) { onUpdate(element.id, { x: currentX, y: currentY }, true);
			} else if (clickTimeout !== null) { window.clearTimeout(clickTimeout);
				clickTimeout = null; onSelect(element.id, e); }
		}
		window.addEventListener('mousemove', onDragMove); window.addEventListener('mouseup', onDragEnd);
	}

	// --- REDIMENSIONAMIENTO ---
	function onResizeStart(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		const startX = e.clientX; const startY = e.clientY; const startWidth = element.width; const startHeight = element.height;
		let newWidth = startWidth; let newHeight = startHeight; let didResize = false;
		function onResizeMove(e: MouseEvent) {
            didResize = true;
			newWidth = Math.max(50, startWidth + (e.clientX - startX));
			newHeight = startHeight + (e.clientY - startY);
			if (element.type === 'image') { const aspectRatio = startHeight > 0 ? startWidth / startHeight : 0;
				if (aspectRatio > 0) { if (Math.abs(e.clientX - startX) > Math.abs(e.clientY - startY)) { newHeight = newWidth / aspectRatio;
				} else { newWidth = newHeight * aspectRatio; newWidth = Math.max(50, newWidth); newHeight = newWidth / aspectRatio;
				} } else { newHeight = Math.max(30, newHeight); } } else { newHeight = Math.max(30, newHeight);
			}
			onUpdate(element.id, { width: newWidth, height: newHeight }, false);
		}
		function onResizeEnd() { window.removeEventListener('mousemove', onResizeMove); window.removeEventListener('mouseup', onResizeEnd);
			if (didResize) onUpdate(element.id, { width: newWidth, height: newHeight }, true); }
		window.addEventListener('mousemove', onResizeMove); window.addEventListener('mouseup', onResizeEnd);
	}

  // --- EDICIÓN DE TEXTO ---
  function handleInput(_e: Event) {
    if (applyingLocal) return;
    // no emitimos cambios continuos; guardado final en blur
  }
  
  function handleBlur() {
      if (applyingLocal) {
          isEditing = false;
          return;
      }
      if (isEditing) {
          isEditing = false;
          onUpdate(element.id, { content: textElementRef?.innerHTML ?? element.content }, true);
      }
  }
  
  function stopPropagation(e: Event) { 
      if (!isEditing) (e as Event & { stopPropagation: () => void }).stopPropagation();
  }

	// --- manejo del evento custom enviado por el toolbar ---
	function onToggleListEvent(ev: CustomEvent) {
		const type = ev.detail?.type;
		if (type === 'ul' || type === 'ol') toggleList(type);
	}

	onMount(() => {
		if (wrapperRef) wrapperRef.addEventListener('toggle-list', onToggleListEvent as EventListener);
	});

	onDestroy(() => {
		if (wrapperRef) wrapperRef.removeEventListener('toggle-list', onToggleListEvent as EventListener);
	});

	/**
	 * toggleList: envuelve o desarrolla la línea/bloque actual dentro de UL/OL
	 */
	async function toggleList(listType: 'ul' | 'ol') {
		if (!textElementRef) return;

		applyingLocal = true;

		if (!isEditing) {
			isEditing = true;
			await tick();
		}
		textElementRef.focus();

		const sel = window.getSelection();
		if (!sel) { applyingLocal = false; return; }
		const anchorNode = sel.anchorNode;
		if (!anchorNode) { applyingLocal = false; return; }
		if (!textElementRef.contains(anchorNode)) { textElementRef.focus(); applyingLocal = false; return; }

		// encontrar bloque
		let node: Node | null = anchorNode;
		while (node && node !== textElementRef && node.parentElement !== textElementRef) node = node.parentNode;
		let blockElement: HTMLElement;
		if (!node || node === textElementRef) {
			const firstChild = Array.from(textElementRef.childNodes).find(n => n.nodeType === Node.ELEMENT_NODE) as HTMLElement | undefined;
			blockElement = firstChild ?? textElementRef;
		} else blockElement = node as HTMLElement;

		const parent = blockElement.parentElement;
		if (parent && (parent.tagName.toLowerCase() === 'ul' || parent.tagName.toLowerCase() === 'ol') && blockElement.tagName.toLowerCase() === 'li') {
			// unwrap: reemplazar li por su contenido y eliminar lista si queda vacía
			const fragment = document.createDocumentFragment();
			while (blockElement.firstChild) fragment.appendChild(blockElement.firstChild);
			parent.parentElement?.insertBefore(fragment, parent);
			if (parent.childElementCount === 0) parent.remove();
		} else {
			// wrap into list
			const list = document.createElement(listType === 'ul' ? 'ul' : 'ol');
			// si el bloque es textElementRef, manejar múltiples nodos
			if (blockElement === textElementRef) {
				const children = Array.from(textElementRef.childNodes);
				if (children.length === 1) {
					const li = document.createElement('li');
					li.innerHTML = textElementRef.innerHTML;
					list.appendChild(li);
					textElementRef.innerHTML = '';
					textElementRef.appendChild(list);
				} else {
					children.forEach((child) => {
						const li2 = document.createElement('li');
						li2.appendChild(child.cloneNode(true));
						list.appendChild(li2);
					});
					textElementRef.innerHTML = '';
					textElementRef.appendChild(list);
				}
			} else {
				const li = document.createElement('li');
				li.innerHTML = blockElement.innerHTML;
				blockElement.parentElement?.replaceChild(list, blockElement);
				list.appendChild(li);
			}
		}

		// colocar caret al final de la lista modificada
		const range = document.createRange();
		const selection = window.getSelection();
		if (textElementRef.lastChild) {
			range.selectNodeContents(textElementRef.lastChild);
			range.collapse(false);
			selection?.removeAllRanges();
			selection?.addRange(range);
		}

		// guardar final
		onUpdate(element.id, { content: textElementRef.innerHTML }, true);

		setTimeout(() => { applyingLocal = false; }, 0);
	}
</script>

<div
    data-element-id={element.id}
	bind:this={wrapperRef}
	class="draggable-wrapper"
	class:selected={isSelected && !isEditing}
	class:editing={isEditing}
	style:transform="translate({element.x}px, {element.y}px)"
	style:width="{element.width}px"
	style:height="{element.type === 'image' ? element.height + 'px' : 'auto'}"
	style:min-height="{element.type === 'text' ? '1.2em' : 'auto'}"
	style:z-index={element.z || 0}
	onmousedown={onDragStart}
    onclick={handleClick}
	role="button"
	tabindex={isEditing ? -1 : 0}
    style:cursor={isEditing ? 'text' : 'grab'} 
>
	{#if element.type === 'image'}
		<img src={element.url} alt="Elemento de plantilla" class="element-content image-content" draggable="false" />
	{:else if element.type === 'text'}
		<div
			bind:this={textElementRef}
			class="element-content text-content"
			style:font-size="{element.fontSize}px"
			style:color={element.color || '#000000'}
			style:font-family={element.fontFamily || 'Arial, sans-serif'}
			style:font-weight={element.isBold ? 'bold' : 'normal'}
			style:font-style={element.isItalic ? 'italic' : 'normal'}
			style:text-decoration={element.isUnderlined ? 'underline' : 'none'}
			style:text-align={element.textAlign || 'left'}
			contenteditable={isEditing ? 'true' : 'false'}
			oninput={handleInput}
			onmousedown={(e) => { if (!isEditing) onDragStart(e); else e.stopPropagation(); }} 
            ondblclick={handleDoubleClick}
            onfocus={stopPropagation}
            onblur={handleBlur}
			spellcheck="false"
		>
			{@html element.content}
		</div>
	{/if}
	<div class="resize-handle" onmousedown={onResizeStart}></div>
</div>

<style>
	/* conserva tus estilos tal cual */
	.draggable-wrapper { position: absolute; cursor: grab; border: 1px dashed transparent; transition: border-color 0.2s ease, box-shadow 0.2s ease; user-select: none; box-sizing: border-box; contain: layout style paint; }
	.draggable-wrapper:hover:not(.editing) { border-color: rgba(160, 132, 232, 0.5); box-shadow: 0 0 0 1px rgba(160, 132, 232, 0.3); }
	.draggable-wrapper.selected { border: 1px solid var(--primary-color, #A084E8); box-shadow: 0 0 0 1px var(--primary-color, #A084E8); }
    .draggable-wrapper.editing { border: 1px solid var(--primary-color, #A084E8); cursor: text; box-shadow: none; }
	.element-content { width: 100%; height: 100%; display: block; box-sizing: border-box; }
	.image-content { object-fit: contain; pointer-events: none; }
	.text-content { pointer-events: auto; cursor: default; overflow-wrap: break-word; word-break: break-word; white-space: pre-wrap; outline: none; padding: 2px 4px; min-height: 1.2em; height: auto; line-height: 1.4; }
	.text-content[contenteditable="true"] { cursor: text; }
	.text-content:focus { box-shadow: 0 0 0 2px rgba(160, 132, 232, 0.3); outline: none; }
    .text-content[contenteditable="false"] { cursor: grab; pointer-events: auto; }
	.resize-handle { position: absolute; bottom: -5px; right: -5px; width: 12px; height: 12px; background: var(--primary-color, #A084E8); border: 1.5px solid white; border-radius: 50%; cursor: nwse-resize; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4); z-index: 1001; opacity: 0; transition: opacity 0.2s ease; pointer-events: none; }
    .draggable-wrapper:hover:not(.editing) .resize-handle, .draggable-wrapper.selected .resize-handle { opacity: 1; pointer-events: auto; }

    /* estilos para listas dentro del editable */
    .text-content ul, .text-content ol { margin: 0.5em 0; padding-left: 1.5em; list-style-position: outside; color: inherit; }
    .text-content ul { list-style-type: disc; }
    .text-content ol { list-style-type: decimal; }
</style>