<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { editorStore } from './editor.store.svelte';

	let {
		element,
		isSelected,
		onUpdate,
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
	let applyingLocal = $state(false);

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

	function onDragStart(e: MouseEvent) {
		if (e.button !== 0 || isEditing || (e.target as HTMLElement)?.classList.contains('resize-handle') || (e.target as HTMLElement)?.classList.contains('rotate-handle')) {
			return;
		}
		
		if ((e.target as HTMLElement)?.closest('.text-content')) e.preventDefault();
		
		const startX = e.clientX; const startY = e.clientY;
		const startElX = element.x;
		const startElY = element.y;
		let currentX = startElX; let currentY = startElY; let didMove = false;
		
		function onDragMove(e: MouseEvent) {
			if (!didMove && clickTimeout !== null) { window.clearTimeout(clickTimeout); clickTimeout = null; }
			didMove = true;
			currentX = startElX + (e.clientX - startX); currentY = startElY + (e.clientY - startY);
			let snappedX = null;
			let snappedY = null; let showVerticalLine: number | null = null; let showHorizontalLine: number | null = null;
			
			const draggingCenterH = currentX + element.width / 2; const draggingCenterV = currentY + element.height / 2; const draggingLeft = currentX;
			const draggingRight = currentX + element.width; const draggingTop = currentY; const draggingBottom = currentY + element.height;
			
			for (const other of allElements) {
				if (other.id === element.id) continue;
				
				const otherCenterH = other.x + other.width / 2;
				const otherLeft = other.x;
				const otherRight = other.x + other.width;
				
				if (Math.abs(draggingCenterH - otherCenterH) < snapThreshold) { snappedX = otherCenterH - element.width / 2; showVerticalLine = otherCenterH; break;
				}
				if (Math.abs(draggingLeft - otherLeft) < snapThreshold) { snappedX = otherLeft; showVerticalLine = otherLeft; break;
				}
				if (Math.abs(draggingRight - otherRight) < snapThreshold) { snappedX = otherRight - element.width; showVerticalLine = otherRight; break;
				}
				if (Math.abs(draggingLeft - otherRight) < snapThreshold) { snappedX = otherRight; showVerticalLine = otherRight; break;
				}
				if (Math.abs(draggingRight - otherLeft) < snapThreshold) { snappedX = otherLeft - element.width; showVerticalLine = otherLeft; break;
				}
			}
			for (const other of allElements) {
				if (other.id === element.id) continue;
				const otherCenterV = other.y + other.height / 2;
				const otherTop = other.y; const otherBottom = other.y + other.height;

				if (Math.abs(draggingCenterV - otherCenterV) < snapThreshold) { snappedY = otherCenterV - element.height / 2; showHorizontalLine = otherCenterV; break;
				}
				if (Math.abs(draggingTop - otherTop) < snapThreshold) { snappedY = otherTop; showHorizontalLine = otherTop; break;
				}
				if (Math.abs(draggingBottom - otherBottom) < snapThreshold) { snappedY = otherBottom - element.height; showHorizontalLine = otherBottom; break;
				}
				if (Math.abs(draggingTop - otherBottom) < snapThreshold) { snappedY = otherBottom; showHorizontalLine = otherBottom; break;
				}
				if (Math.abs(draggingBottom - otherTop) < snapThreshold) { snappedY = otherTop - element.height; showHorizontalLine = otherTop; break;
				}
			}
			const finalX = snappedX !== null ? snappedX : currentX; const finalY = snappedY !== null ? snappedY : currentY;
			
			onShowSnapLine({ type: 'vertical', position: showVerticalLine });
			onShowSnapLine({ type: 'horizontal', position: showHorizontalLine });
			
			onUpdate(element.id, { x: finalX, y: finalY }, false);
			currentX = finalX; currentY = finalY;
		}
		function onDragEnd(e: MouseEvent) {
			window.removeEventListener('mousemove', onDragMove); window.removeEventListener('mouseup', onDragEnd);
			
			onShowSnapLine({ type: 'vertical', position: null });
			onShowSnapLine({ type: 'horizontal', position: null });
			
			if (didMove) { onUpdate(element.id, { x: currentX, y: currentY }, true);
			}
			else if (clickTimeout !== null) { window.clearTimeout(clickTimeout); clickTimeout = null; onSelect(element.id, e); }
		}
		window.addEventListener('mousemove', onDragMove); window.addEventListener('mouseup', onDragEnd);
	}

	function onResizeStart(e: MouseEvent, handleType: 'tl' | 'tr' | 'bl' | 'br') {
		e.preventDefault();
		e.stopPropagation();
		const startX = e.clientX;
		const startY = e.clientY;
		const startElX = element.x;
		const startElY = element.y;
		const startWidth = element.width;
		const startHeight = element.height;
		let didResize = false;

		function onResizeMove(e: MouseEvent) {
			didResize = true;
			const deltaX = e.clientX - startX;
			const deltaY = e.clientY - startY;

			let newX = startElX;
			let newY = startElY;
			let newWidth = startWidth;
			let newHeight = startHeight;

			switch (handleType) {
				case 'br': 
					newWidth = Math.max(10, startWidth + deltaX);
					newHeight = Math.max(10, startHeight + deltaY);
					break;
				case 'bl': 
					newWidth = Math.max(10, startWidth - deltaX);
					newHeight = Math.max(10, startHeight + deltaY);
					newX = startElX + deltaX;
					break;
				case 'tr': 
					newWidth = Math.max(10, startWidth + deltaX);
					newHeight = Math.max(10, startHeight - deltaY);
					newY = startElY + deltaY;
					break;
				case 'tl': 
					newWidth = Math.max(10, startWidth - deltaX);
					newHeight = Math.max(10, startHeight - deltaY);
					newX = startElX + deltaX;
					newY = startElY + deltaY;
					break;
			}
			
			if (element.type === 'shape' && element.shapeType === 'circle') {
				const size = Math.max(10, Math.max(newWidth, newHeight));
				newWidth = size;
				newHeight = size;
				if (handleType === 'tl' || handleType === 'bl' || handleType === 'tr') {
					const oldCenterX = startElX + startWidth / 2;
					const oldCenterY = startElY + startHeight / 2;
					newX = oldCenterX - size / 2;
					newY = oldCenterY - size / 2;
				}
			}

			onUpdate(element.id, { x: newX, y: newY, width: newWidth, height: newHeight }, false);
		}
		function onResizeEnd() { 
			window.removeEventListener('mousemove', onResizeMove);
			window.removeEventListener('mouseup', onResizeEnd);
			if (didResize) onUpdate(element.id, { x: element.x, y: element.y, width: element.width, height: element.height }, true); 
		}
		window.addEventListener('mousemove', onResizeMove); window.addEventListener('mouseup', onResizeEnd);
	}

	const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
	const rotationSnapThreshold = 5;

	function onRotateStart(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (!wrapperRef) return;
		
		const rect = wrapperRef.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180 / Math.PI;
		const initialRotation = element.rotation || 0;
		const elCenterX = element.x + element.width / 2;
		const elCenterY = element.y + element.height / 2;
		function onRotateMove(ev: MouseEvent) {
			const angle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI;
			let delta = angle - startAngle;
			let newRotation = (initialRotation + delta) % 360;
			if (newRotation < 0) newRotation += 360;

			let snappedRotation = newRotation;
			let showVerticalLine: number | null = null;
			let showHorizontalLine: number | null = null;

			for (const snapAngle of snapAngles) {
				if (Math.abs(newRotation - snapAngle) < rotationSnapThreshold) {
					snappedRotation = snapAngle;
					break;
				}
			}

			const finalAngle = snappedRotation % 360;
			if (finalAngle === 0 || finalAngle === 180) {
				showHorizontalLine = elCenterY;
			}
			if (finalAngle === 90 || finalAngle === 270) {
				showVerticalLine = elCenterX;
			}
			
			onShowSnapLine({ type: 'vertical', position: showVerticalLine });
			onShowSnapLine({ type: 'horizontal', position: showHorizontalLine });

			onUpdate(element.id, { rotation: Math.round(snappedRotation) }, false);
		}
		
		function onRotateEnd() { 
			window.removeEventListener('mousemove', onRotateMove); 
			window.removeEventListener('mouseup', onRotateEnd);
			onShowSnapLine({ type: 'vertical', position: null });
			onShowSnapLine({ type: 'horizontal', position: null });
			onUpdate(element.id, { rotation: element.rotation || 0 }, true);
		}
		
		window.addEventListener('mousemove', onRotateMove); 
		window.addEventListener('mouseup', onRotateEnd);
	}

	function handleInput(_e: Event) {
		if (applyingLocal) return;
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
		if (!anchorNode) { applyingLocal = false; return;
		}
		if (!textElementRef.contains(anchorNode)) { textElementRef.focus(); applyingLocal = false; return; }

		let node: Node | null = anchorNode;
		while (node && node !== textElementRef && node.parentElement !== textElementRef) node = node.parentNode;
		let blockElement: HTMLElement;
		if (!node || node === textElementRef) {
			const firstChild = Array.from(textElementRef.childNodes).find(n => n.nodeType === Node.ELEMENT_NODE) as HTMLElement | undefined;
			blockElement = firstChild ?? textElementRef;
		} else blockElement = node as HTMLElement;

		const parent = blockElement.parentElement;
		if (parent && (parent.tagName.toLowerCase() === 'ul' || parent.tagName.toLowerCase() === 'ol') && blockElement.tagName.toLowerCase() === 'li') {
			const fragment = document.createDocumentFragment();
			while (blockElement.firstChild) fragment.appendChild(blockElement.firstChild);
			parent.parentElement?.insertBefore(fragment, parent);
			if (parent.childElementCount === 0) parent.remove();
		} else {
			const list = document.createElement(listType === 'ul' ? 'ul' : 'ol');
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

		const range = document.createRange();
		const selection = window.getSelection();
		if (textElementRef.lastChild) {
			range.selectNodeContents(textElementRef.lastChild);
			range.collapse(false);
			selection?.removeAllRanges();
			selection?.addRange(range);
		}

		onUpdate(element.id, { content: textElementRef.innerHTML }, true);
		setTimeout(() => { applyingLocal = false; }, 0);
	}

	function renderShapeSVG(el: any) {
		const stroke = el.stroke || '#000';
		const strokeWidth = el.strokeWidth || 4;
		const w = el.width || 100;
		const h = el.height || 20;
		if (el.shapeType === 'line') {
			const halfH = Math.max(1, strokeWidth / 2);
			const svg = `<svg width="${w}" height="${Math.max(halfH, strokeWidth)}" viewBox="0 0 ${w} ${Math.max(halfH, strokeWidth)}" xmlns="http://www.w3.org/2000/svg">
				<line x1="0" y1="${Math.max(halfH, strokeWidth)/2}" x2="${w}" y2="${Math.max(halfH, strokeWidth)/2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
			</svg>`;
			return svg;
		} else if (el.shapeType === 'arrow') {
			const headSize = Math.min(18, Math.max(8, strokeWidth * 3));
			const shaftLength = Math.max(10, w - headSize);
			const svg = `<svg width="${w}" height="${Math.max(h, headSize)}" viewBox="0 0 ${w} ${Math.max(h, headSize)}" xmlns="http://www.w3.org/2000/svg">
				<line x1="0" y1="${Math.max(h, headSize)/2}" x2="${shaftLength}" y2="${Math.max(h, headSize)/2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/>
				<polygon points="${shaftLength},${Math.max(h, headSize)/2 - headSize/2} ${w},${Math.max(h, headSize)/2} ${shaftLength},${Math.max(h, headSize)/2 + headSize/2}" fill="${stroke}"/>
			</svg>`;
			return svg;
		} else if (el.shapeType === 'circle') {
			const size = Math.max(w, h);
			const r = Math.max(2, (size - strokeWidth) / 2);
			const cx = size / 2;
			const cy = size / 2;
			const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
				<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${el.fill || 'transparent'}" />
			</svg>`;
			return svg;
		
		} else if (el.shapeType === 'rectangle') {
			const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
				<rect x="0" y="0" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${el.fill || 'transparent'}" />
			</svg>`;
			return svg;
		}

		return '';
	}
</script>

<div
	data-element-id={element.id}
	bind:this={wrapperRef}
	class="draggable-wrapper"
	class:selected={isSelected && !isEditing}
	class:editing={isEditing}
	style:transform="translate({element.x}px, {element.y}px) rotate({element.rotation || 0}deg)"
	style:width="{element.width}px"
	style:height="{element.type === 'image' ? element.height + 'px' : element.type === 'shape' && element.shapeType === 'circle' ? element.height + 'px' : (element.height ? element.height + 'px' : 'auto')}"
	style:min-height="{element.type === 'text' ? '1.2em' : 'auto'}"
	
	style:z-index={element.z ?? 0}
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
			style:line-height={element.lineHeight || 1.4}
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
	{:else if element.type === 'shape'}
		<div class="element-content shape-content"
			style:width={element.width + 'px'}
			style:height={element.shapeType === 'circle' ?
				element.height + 'px' : (element.height ? element.height + 'px' : 'auto')}
		>
		{@html renderShapeSVG(element)}
		</div>
	{/if}

	{#if isSelected && !isEditing}
		<div class="rotate-handle" onmousedown={onRotateStart} title="Rotar">
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M23 4v6h-6"></path>
				<path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
			</svg>
		</div>
	
		<div class="resize-handle tl" onmousedown={(e) => onResizeStart(e, 'tl')}></div>
		<div class="resize-handle tr" onmousedown={(e) => onResizeStart(e, 'tr')}></div>
		<div class="resize-handle bl" onmousedown={(e) => onResizeStart(e, 'bl')}></div>
		<div class="resize-handle br" onmousedown={(e) => onResizeStart(e, 'br')}></div>
	{/if}
</div>

<style>
	.draggable-wrapper { 
		position: absolute; 
		cursor: grab; 
		border: 1px dashed transparent; 
		transition: border-color 0.2s ease, box-shadow 0.2s ease; 
		user-select: none; 
		box-sizing: border-box;
	}
	.draggable-wrapper:hover:not(.editing) { 
		border-color: rgba(160, 132, 232, 0.5); 
		box-shadow: 0 0 0 1px rgba(160, 132, 232, 0.3);
	}
	.draggable-wrapper.selected { 
		border: 1px solid var(--primary-color, #A084E8); 
		box-shadow: 0 0 0 1px var(--primary-color, #A084E8);
		pointer-events: auto; 
	}
	.draggable-wrapper.editing { 
		border: 1px solid var(--primary-color, #A084E8); 
		cursor: text; 
		box-shadow: none; 
	}
	.element-content { 
		width: 100%; 
		height: 100%; 
		display: block;
		box-sizing: border-box; 
		position: relative; 
	}
	.image-content { 
		object-fit: contain; 
		pointer-events: none; 
	}

	.text-content { 
		pointer-events: auto;
		cursor: default; 
		overflow-wrap: break-word; 
		word-break: break-word;
		white-space: pre-wrap; 
		outline: none; 
		padding: 2px 4px; 
		min-height: 1.2em; 
		height: auto; 
		line-height: 1.4;
	}
	
	.text-content[contenteditable="true"] { cursor: text; }
	.text-content:focus { box-shadow: 0 0 0 2px rgba(160, 132, 232, 0.3); outline: none; }
	.text-content[contenteditable="false"] { cursor: grab; pointer-events: auto; }

	/* --- Estilos para Rotación y Redimensión --- */

	.resize-handle, .rotate-handle {
		position: absolute;
		width: 20px;
		height: 20px;
		background: black;
		border: 2px solid white;
		border-radius: 50%;
		box-shadow: 0 1px 4px rgba(0,0,0,0.6);
		/* --- *** INICIO DE LA CORRECCIÓN *** --- */
		/* Los handles SÍ deben estar por encima del elemento seleccionado */
		z-index: 1005; 
		/* --- *** FIN DE LA CORRECCIÓN *** --- */
		pointer-events: auto; 
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.rotate-handle {
		width: 24px;
		height: 24px;
		top: -40px; 
		left: 50%;
		transform: translateX(-50%);
		cursor: grab;
	}
	.rotate-handle:active {
		cursor: grabbing;
		background-color: #333;
	}
	.rotate-handle::before {
		content: '';
		position: absolute;
		width: 2px;
		height: 14px; 
		background: black;
		top: 24px; 
		left: 50%;
		transform: translateX(-50%);
		z-index: -1; 
	}
	.rotate-handle svg {
		width: 16px; 
		height: 16px;
		color: white; 
		flex-shrink: 0;
	}

	.resize-handle.tl { 
		top: -10px; 
		left: -10px; 
		cursor: nwse-resize;
	}
	.resize-handle.tr { 
		top: -10px;
		right: -10px;
		cursor: nesw-resize;
	}
	.resize-handle.bl { 
		bottom: -10px;
		left: -10px;
		cursor: nesw-resize;
	}
	.resize-handle.br { 
		bottom: -10px;
		right: -10px;
		cursor: nwse-resize;
	}
	
	.shape-content { 
		display:flex; 
		align-items:center; 
		justify-content:center; 
		overflow: visible; 
		pointer-events: none;
	}

	.text-content ul, .text-content ol { 
		margin: 0.5em 0; 
		padding-left: 1.5em; 
		list-style-position: outside; 
		color: inherit; 
	}
	.text-content ul { list-style-type: disc; }
	.text-content ol { list-style-type: decimal; }
</style>