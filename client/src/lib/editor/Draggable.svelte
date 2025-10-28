<script lang="ts">
	import { BROWSER } from '$app/environment';

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
		onSelect: (id: number, e: MouseEvent | KeyboardEvent) => void; // Allow KeyboardEvent for focusing
		allElements?: any[];
		onShowSnapLine?: (line: { type: 'vertical' | 'horizontal'; position: number | null }) => void;
	}>();

	const snapThreshold = 5;
	let isEditing = $state(false); // Estado para controlar contenteditable
	let textElementRef: HTMLElement | null = $state(null); // Referencia al div de texto

	// --- MANEJO DE CLICS/DOBLE CLICS ---
	let clickTimeout: number | null = null;

	function handleClick(e: MouseEvent) {
		// Prevenir comportamiento por defecto si es necesario (ej. selección de texto)
		// e.preventDefault();

		if (clickTimeout === null) {
			// Iniciar temporizador para detectar doble clic
			clickTimeout = window.setTimeout(() => {
				clickTimeout = null;
				// Acción de un solo clic: Seleccionar elemento
                if (!isEditing) { // Solo seleccionar si no estamos ya editando
				    onSelect(element.id, e);
                }
			}, 250); // Tiempo típico para detectar doble clic (ms)
		} else {
			// Doble clic detectado
			window.clearTimeout(clickTimeout);
			clickTimeout = null;
			handleDoubleClick(e);
		}
	}

	function handleDoubleClick(e: MouseEvent) {
		if (element.type === 'text') {
			isEditing = true;
			// Enfocar el elemento para empezar a editar inmediatamente
			// Usar $effect para asegurar que el elemento existe en el DOM
			$effect(() => {
				if (isEditing && textElementRef) {
					textElementRef.focus();
					// Opcional: Seleccionar todo el texto
					// window.getSelection()?.selectAllChildren(textElementRef);
				}
			});
		}
        // No llamamos a onSelect en doble clic, ya fue llamado en el primer clic
	}

	// --- LÓGICA DE ARRASTRE ---
	function onDragStart(e: MouseEvent) {
		// Permitir arrastre solo si NO estamos editando texto
		if (e.button !== 0 || isEditing) return; // No arrastrar con clic derecho o si se edita texto

        // Si hacemos clic en el texto pero NO estamos editando,
        // queremos iniciar el arrastre del contenedor, no la edición.
        // El handleClick gestionará la selección. No prevenimos aquí.

		// e.preventDefault(); // Comentado - Prevenía la selección normal
		// onSelect(element.id, e); // Se maneja en handleClick

		const startX = e.clientX;
		const startY = e.clientY;
		const startElX = element.x;
		const startElY = element.y;
		let currentX = startElX;
		let currentY = startElY;
        let didMove = false; // Flag para saber si realmente se arrastró

		function onDragMove(e: MouseEvent) {
            didMove = true; // Marcar que hubo movimiento
			currentX = startElX + (e.clientX - startX);
			currentY = startElY + (e.clientY - startY);
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

			// Buscar alineaciones verticales
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

			// Buscar alineaciones horizontales
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

			onUpdate(element.id, { x: finalX, y: finalY }, false); // Intermedio
			onShowSnapLine({ type: 'vertical', position: showVerticalLine });
			onShowSnapLine({ type: 'horizontal', position: showHorizontalLine });

			currentX = finalX;
			currentY = finalY;
		}

		function onDragEnd() {
			window.removeEventListener('mousemove', onDragMove);
			window.removeEventListener('mouseup', onDragEnd);
			onShowSnapLine({ type: 'vertical', position: null });
			onShowSnapLine({ type: 'horizontal', position: null });
            // Solo guardar historial si hubo movimiento
            if (didMove) {
			    onUpdate(element.id, { x: currentX, y: currentY }, true); // Final
            }
		}

		window.addEventListener('mousemove', onDragMove);
		window.addEventListener('mouseup', onDragEnd);
	}

	// --- LÓGICA DE REDIMENSIONAMIENTO --- (Sin cambios funcionales, solo onUpdate)
	function onResizeStart(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		const startX = e.clientX;
		const startY = e.clientY;
		const startWidth = element.width;
		const startHeight = element.height;
		let newWidth = startWidth;
		let newHeight = startHeight;
        let didResize = false;

		function onResizeMove(e: MouseEvent) {
            didResize = true;
			newWidth = Math.max(50, startWidth + (e.clientX - startX));
			newHeight = startHeight + (e.clientY - startY);

			if (element.type === 'image') {
				const aspectRatio = startHeight > 0 ? startWidth / startHeight : 0;
				if (aspectRatio > 0) {
					if (Math.abs(e.clientX - startX) > Math.abs(e.clientY - startY)) { newHeight = newWidth / aspectRatio; }
                    else { newWidth = newHeight * aspectRatio; newWidth = Math.max(50, newWidth); newHeight = newWidth / aspectRatio; }
				} else { newHeight = Math.max(30, newHeight); }
			} else { newHeight = Math.max(30, newHeight); }

			onUpdate(element.id, { width: newWidth, height: newHeight }, false); // Intermedio
		}
		function onResizeEnd() {
			window.removeEventListener('mousemove', onResizeMove);
			window.removeEventListener('mouseup', onResizeEnd);
            if (didResize) {
			    onUpdate(element.id, { width: newWidth, height: newHeight }, true); // Final
            }
		}
		window.addEventListener('mousemove', onResizeMove);
		window.addEventListener('mouseup', onResizeEnd);
	}

	// --- LÓGICA DE EDICIÓN DE TEXTO ---
	function handleInput(e: Event) {
		const target = e.target as HTMLElement;
		if (element.content !== target.innerText) {
			onUpdate(element.id, { content: target.innerText }, true); // Guardar historial en cada input
		}
	}

    // Terminar edición al hacer clic fuera (blur)
    function handleBlur() {
        isEditing = false;
        // Opcional: Podrías guardar el estado final aquí si handleInput no lo hiciera siempre
        // onUpdate(element.id, { content: textElementRef?.innerText ?? element.content }, true);
    }

	function stopPropagation(e: MouseEvent | FocusEvent) {
		e.stopPropagation();
	}
</script>

<div
	class="draggable-wrapper"
	class:selected={isSelected && !isEditing} class:editing={isEditing}
	style:transform="translate({element.x}px, {element.y}px)"
	style:width="{element.width}px"
	style:height="{element.type === 'image' ? element.height + 'px' : 'auto'}"
	style:min-height="{element.type === 'text' ? '1.2em' : 'auto'}"
	style:z-index={element.z || 0}
	onmousedown={onDragStart}
    onclick={handleClick} role="button"
	tabindex="0"
>
	{#if element.type === 'image'}
		<img src={element.url} alt="Elemento de plantilla" class="element-content image-content" draggable="false" />
	{:else if element.type === 'text'}
		<div
			bind:this={textElementRef} class="element-content text-content"
			style:font-size="{element.fontSize}px"
			style:color={element.color || '#000000'}
			style:font-family={element.fontFamily || 'Arial, sans-serif'}
			style:font-weight={element.isBold ? 'bold' : 'normal'}
			style:font-style={element.isItalic ? 'italic' : 'normal'}
			style:text-decoration={element.isUnderlined ? 'underline' : 'none'}
			style:text-align={element.textAlign || 'left'}
			contenteditable={isEditing ? 'true' : 'false'} oninput={handleInput}
			onmousedown={stopPropagation} onfocus={stopPropagation}
            onblur={handleBlur} spellcheck="false"
		>
			{element.content}
		</div>
	{/if}

	{#if isSelected && !isEditing} <div class="resize-handle" onmousedown={onResizeStart}></div>
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
	.draggable-wrapper:hover:not(.editing) { /* No mostrar hover si se edita */
		border-color: rgba(160, 132, 232, 0.5);
	}
	.draggable-wrapper.selected {
		border: 1px solid var(--primary-color, #A084E8);
	}
    /* Estilo específico cuando se está editando */
    .draggable-wrapper.editing {
        border-color: var(--primary-color, #A084E8); /* Borde sólido al editar */
        cursor: default; /* Cursor normal al editar */
    }

	.draggable-wrapper:active:not(.editing) { /* Solo cursor grabbing si no se edita */
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
		pointer-events: auto; /* Siempre auto para poder hacer clic/doble clic */
		cursor: text; /* Cambiado a text */
		overflow-wrap: break-word;
		word-break: break-word;
		white-space: pre-wrap;
		outline: none;
		padding: 2px 4px;
		min-height: 1.2em;
		height: auto;
		line-height: 1.4;
	}
    /* Quitar borde al editar, ya lo pone el wrapper */
	.text-content:focus {
		 outline: none;
         /* Opcional: Cambiar fondo ligeramente al editar */
         /* background-color: rgba(160, 132, 232, 0.05); */
	}
    /* Hacer el texto no editable por defecto visualmente */
    .text-content[contenteditable="false"] {
        cursor: grab; /* Cursor de arrastre si no se edita */
        pointer-events: none; /* Pasa los clics al wrapper si no es editable */
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
		box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
		z-index: 1001;
	}
</style>