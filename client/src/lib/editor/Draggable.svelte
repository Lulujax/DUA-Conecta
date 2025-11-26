<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { editorStore } from './editor.store.svelte';

	let {
		element,
		isSelected,
		onSelect,
		allElements = [],
		onShowSnapLine = (line: { type: 'vertical' | 'horizontal'; position: number | null }) => {}
	} = $props<{
		element: any;
		isSelected: boolean;
		onSelect: (id: number, e: MouseEvent | KeyboardEvent | TouchEvent) => void;
		onUpdate: (id: number, data: any, isFinalChange: boolean) => void; 
		allElements?: any[];
		onShowSnapLine?: (line: { type: 'vertical' | 'horizontal'; position: number | null }) => void;
	}>();

	const snapThreshold = 5;
	let isEditing = $state(false);
	let textElementRef: HTMLElement | null = $state(null);
	let wrapperRef: HTMLElement | null = null;
	let clickTimeout: number | null = null;

	$effect(() => {
		if (textElementRef && element.type === 'text') {
			if (textElementRef.innerHTML !== element.content) {
				textElementRef.innerHTML = element.content || '';
			}
		}
	});

    $effect(() => {
        if (!isSelected && isEditing) {
            saveChanges();
            isEditing = false;
            window.getSelection()?.removeAllRanges();
        }
    });

	function getCoords(e: MouseEvent | TouchEvent) {
		if ('touches' in e) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
		return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
	}

	function handleClick(e: MouseEvent | TouchEvent) {
		if (e.type === 'click' && 'ontouchstart' in window) return;
		if (isEditing && (e.target as HTMLElement)?.closest('.text-content')) return;
		if (isEditing && !(e.target as HTMLElement)?.closest('.text-content')) {
			handleBlur();
			onSelect(element.id, e);
			return;
		}
		if (clickTimeout === null) {
			clickTimeout = window.setTimeout(() => { clickTimeout = null; if (!isEditing) onSelect(element.id, e); }, 250);
		} else {
			window.clearTimeout(clickTimeout); clickTimeout = null; handleDoubleClick(e);
		}
	}

	function handleDoubleClick(e: Event) {
		if (element.type === 'text' && (e.target as HTMLElement)?.closest('.text-content')) {
			isEditing = true;
			$effect(() => {
				requestAnimationFrame(() => {
					if (isEditing && textElementRef) {
						textElementRef.focus();
						document.execCommand('selectAll', false, undefined);
					}
				});
			});
		}
	}

    function onExecCmd(ev: CustomEvent) {
        const { command, value } = ev.detail;
        if (!textElementRef) return;
        if (!isEditing) {
            isEditing = true;
            requestAnimationFrame(() => {
                textElementRef?.focus();
                document.execCommand('selectAll', false, undefined);
                document.execCommand(command, false, value);
                saveChanges();
                isEditing = false;
                 window.getSelection()?.removeAllRanges();
            });
        } else {
             textElementRef.focus();
             document.execCommand(command, false, value);
             handleInput(null); 
        }
    }

    onMount(() => { if (wrapperRef) {
        wrapperRef.addEventListener('toggle-list', onToggleListEvent as EventListener);
        wrapperRef.addEventListener('exec-cmd', onExecCmd as EventListener);
    }});
    
    onDestroy(() => { if (wrapperRef) {
        wrapperRef.removeEventListener('toggle-list', onToggleListEvent as EventListener);
        wrapperRef.removeEventListener('exec-cmd', onExecCmd as EventListener);
    }});

    function handleInput(e: Event | null) {
		if (!textElementRef) return;
        editorStore.updateElement(element.id, { content: textElementRef.innerHTML }, false);
	}

    function saveChanges() {
        if (textElementRef) editorStore.updateElement(element.id, { content: textElementRef.innerHTML }, true);
    }

	function onDragStart(e: MouseEvent | TouchEvent) {
		if (e instanceof MouseEvent && e.button !== 0) return;
		if (isEditing) return;
		if ((e.target as HTMLElement)?.classList.contains('resize-handle') || (e.target as HTMLElement)?.classList.contains('rotate-handle')) return;
		
		e.preventDefault();
        
        if (!isSelected) {
            onSelect(element.id, e);
        }
		
		const coords = getCoords(e);
		let lastX = coords.x;
        let lastY = coords.y;
		let didMove = false;

		function onDragMove(ev: MouseEvent | TouchEvent) {
			const moveCoords = getCoords(ev);
            const dx = moveCoords.x - lastX;
            const dy = moveCoords.y - lastY;

			if (!didMove && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) { 
                if (clickTimeout !== null) { window.clearTimeout(clickTimeout); clickTimeout = null; }
                didMove = true; 
            }

            if (didMove) {
                editorStore.moveSelected(dx / 1, dy / 1);
                lastX = moveCoords.x;
                lastY = moveCoords.y;
            }
		}

		function onDragEnd(ev: MouseEvent | TouchEvent) {
			window.removeEventListener('mousemove', onDragMove); window.removeEventListener('mouseup', onDragEnd);
			window.removeEventListener('touchmove', onDragMove); window.removeEventListener('touchend', onDragEnd);
            if (didMove) {
                editorStore.moveSelected(0, 0, true); 
            } else if (clickTimeout !== null) { 
                window.clearTimeout(clickTimeout); clickTimeout = null; onSelect(element.id, ev); 
            }
		}
		window.addEventListener('mousemove', onDragMove); window.addEventListener('mouseup', onDragEnd);
		window.addEventListener('touchmove', onDragMove, { passive: false }); window.addEventListener('touchend', onDragEnd);
	}

	function onResizeStart(e: MouseEvent | TouchEvent, handleType: 'tl' | 'tr' | 'bl' | 'br') {
		e.preventDefault(); e.stopPropagation();
		const coords = getCoords(e);
		const startX = coords.x; const startY = coords.y;
		const startElX = element.x; const startElY = element.y;
		const startWidth = element.width; const startHeight = element.height;
		let didResize = false;

		function onResizeMove(ev: MouseEvent | TouchEvent) {
			didResize = true;
			const moveCoords = getCoords(ev);
			const deltaX = moveCoords.x - startX; const deltaY = moveCoords.y - startY;
			let newX = startElX; let newY = startElY;
			let newWidth = startWidth; let newHeight = startHeight;

			switch (handleType) {
				case 'br': newWidth = Math.max(10, startWidth + deltaX); newHeight = Math.max(10, startHeight + deltaY); break;
				case 'bl': newWidth = Math.max(10, startWidth - deltaX); newHeight = Math.max(10, startHeight + deltaY); newX = startElX + deltaX; break;
				case 'tr': newWidth = Math.max(10, startWidth + deltaX); newHeight = Math.max(10, startHeight - deltaY); newY = startElY + deltaY; break;
				case 'tl': newWidth = Math.max(10, startWidth - deltaX); newHeight = Math.max(10, startHeight - deltaY); newX = startElX + deltaX; newY = startElY + deltaY; break;
			}
			if (element.type === 'shape' && element.shapeType === 'circle') {
				const size = Math.max(10, Math.max(newWidth, newHeight));
				newWidth = size; newHeight = size;
				if (handleType.includes('l')) newX = (startElX + startWidth / 2) - size / 2;
                if (handleType.includes('t')) newY = (startElY + startHeight / 2) - size / 2;
			}
			editorStore.updateElement(element.id, { x: newX, y: newY, width: newWidth, height: newHeight }, false);
		}
		function onResizeEnd() { 
			window.removeEventListener('mousemove', onResizeMove); window.removeEventListener('mouseup', onResizeEnd);
			window.removeEventListener('touchmove', onResizeMove); window.removeEventListener('touchend', onResizeEnd);
			if (didResize) editorStore.updateElement(element.id, { x: element.x, y: element.y, width: element.width, height: element.height }, true);
		}
		window.addEventListener('mousemove', onResizeMove); window.addEventListener('mouseup', onResizeEnd);
		window.addEventListener('touchmove', onResizeMove, { passive: false }); window.addEventListener('touchend', onResizeEnd);
	}

	const snapAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
	function onRotateStart(e: MouseEvent | TouchEvent) {
		e.preventDefault(); e.stopPropagation();
		if (!wrapperRef) return;
		const rect = wrapperRef.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
		const coords = getCoords(e);
		const startAngle = Math.atan2(coords.y - centerY, coords.x - centerX) * 180 / Math.PI;
		const initialRotation = element.rotation || 0;
		
		function onRotateMove(ev: MouseEvent | TouchEvent) {
			const mCoords = getCoords(ev);
			const angle = Math.atan2(mCoords.y - centerY, mCoords.x - centerX) * 180 / Math.PI;
			let newRotation = (initialRotation + (angle - startAngle)) % 360;
			if (newRotation < 0) newRotation += 360;
			for (const snap of snapAngles) { if (Math.abs(newRotation - snap) < 5) { newRotation = snap; break; } }
			editorStore.updateElement(element.id, { rotation: Math.round(newRotation) }, false);
		}
		function onRotateEnd() { 
			window.removeEventListener('mousemove', onRotateMove); window.removeEventListener('mouseup', onRotateEnd);
			window.removeEventListener('touchmove', onRotateMove); window.removeEventListener('touchend', onRotateEnd);
			editorStore.updateElement(element.id, { rotation: element.rotation || 0 }, true);
		}
		window.addEventListener('mousemove', onRotateMove); window.addEventListener('mouseup', onRotateEnd);
		window.addEventListener('touchmove', onRotateMove, { passive: false }); window.addEventListener('touchend', onRotateEnd);
	}

	function handleBlur() {
		if (isEditing) {
			isEditing = false;
			editorStore.updateElement(element.id, { content: textElementRef?.innerHTML ?? element.content }, true);
		}
	}

	function onToggleListEvent(ev: CustomEvent) {
		const type = ev.detail?.type;
		if (type === 'ul' || type === 'ol') toggleList(type);
	}

	async function toggleList(listType: 'ul' | 'ol') {
		if (!textElementRef) return;
		if (!isEditing) { isEditing = true; await tick(); }
		textElementRef.focus();
		document.execCommand(listType === 'ul' ? 'insertUnorderedList' : 'insertOrderedList');
		editorStore.updateElement(element.id, { content: textElementRef.innerHTML }, true);
	}

	function renderShapeSVG(el: any) {
		const stroke = el.stroke || '#000'; const strokeWidth = el.strokeWidth || 4;
		const w = el.width || 100; const h = el.height || 20;
		if (el.shapeType === 'line') return `<svg width="${w}" height="${Math.max(1, strokeWidth)}" viewBox="0 0 ${w} ${Math.max(1, strokeWidth)}" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="50%" x2="${w}" y2="50%" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/></svg>`;
		if (el.shapeType === 'arrow') return `<svg width="${w}" height="${Math.max(h, 18)}" viewBox="0 0 ${w} ${Math.max(h, 18)}" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="50%" x2="${w-10}" y2="50%" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round"/><polygon points="${w-12},${(h/2)-5} ${w},${h/2} ${w-12},${(h/2)+5}" fill="${stroke}"/></svg>`;
		if (el.shapeType === 'circle') return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><circle cx="50%" cy="50%" r="${Math.min(w,h)/2 - strokeWidth/2}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${el.fill || 'transparent'}" /></svg>`;
		return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${w}" height="${h}" stroke="${stroke}" stroke-width="${strokeWidth}" fill="${el.fill || 'transparent'}" /></svg>`;
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
	style:height="{element.type === 'text' ? 'auto' : (element.height + 'px')}"
	style:min-height="{element.type === 'text' ? '1.2em' : 'auto'}"
	style:z-index={element.z ?? 0}
	style:opacity={element.opacity ?? 1} 
	onmousedown={onDragStart}
	ontouchstart={onDragStart} 
	onclick={handleClick}
	role="button"
	tabindex={isEditing ? -1 : 0}
	style:cursor={isEditing ? 'text' : 'grab'}
>
    <div class="flip-wrapper" style:transform={element.flipX ? "scaleX(-1)" : "none"}>
        {#if element.type === 'image'}
            <img src={element.url} alt="Elemento" class="element-content image-content" draggable="false" />
        {:else if element.type === 'text'}
            <div
                bind:this={textElementRef}
                class="element-content text-content"
                style:font-size="{element.fontSize}px"
                style:color={element.color || '#000000'}
                style:font-family={element.fontFamily || 'Arial, sans-serif'}
                style:text-align={element.textAlign || 'left'}
                style:line-height={element.lineHeight || 1.4}
                contenteditable={isEditing ? 'true' : 'false'}
                oninput={handleInput}
                onmousedown={(e) => { if (!isEditing) onDragStart(e); else e.stopPropagation(); }}
                ontouchstart={(e) => { if (!isEditing) onDragStart(e); else e.stopPropagation(); }}
                ondblclick={handleDoubleClick}
                onblur={handleBlur}
                spellcheck="false"
            ></div> 
        {:else if element.type === 'shape'}
            <div class="element-content shape-content" style:width="100%" style:height="100%">
                {@html renderShapeSVG(element)}
            </div>
        {/if}
    </div>

	{#if isSelected && !isEditing}
		<div class="rotate-handle" onmousedown={onRotateStart} ontouchstart={onRotateStart} title="Rotar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"></path><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></div>
		<div class="resize-handle tl" onmousedown={(e) => onResizeStart(e, 'tl')} ontouchstart={(e) => onResizeStart(e, 'tl')}></div>
		<div class="resize-handle tr" onmousedown={(e) => onResizeStart(e, 'tr')} ontouchstart={(e) => onResizeStart(e, 'tr')}></div>
		<div class="resize-handle bl" onmousedown={(e) => onResizeStart(e, 'bl')} ontouchstart={(e) => onResizeStart(e, 'bl')}></div>
		<div class="resize-handle br" onmousedown={(e) => onResizeStart(e, 'br')} ontouchstart={(e) => onResizeStart(e, 'br')}></div>
	{/if}
</div>

<style>
	.draggable-wrapper { position: absolute; cursor: grab; border: 1px dashed transparent; transition: border-color 0.2s ease, box-shadow 0.2s ease; user-select: none; box-sizing: border-box; touch-action: none; }
    .flip-wrapper { width: 100%; height: 100%; }
	.draggable-wrapper:hover:not(.editing) { border-color: rgba(160, 132, 232, 0.5); box-shadow: 0 0 0 1px rgba(160, 132, 232, 0.3); }
	.draggable-wrapper.selected { border: 1px solid var(--primary-color, #A084E8); box-shadow: 0 0 0 1px var(--primary-color, #A084E8); pointer-events: auto; }
	.draggable-wrapper.editing { border: 1px solid var(--primary-color, #A084E8); cursor: text; box-shadow: none; }
	.element-content { width: 100%; height: 100%; display: block; box-sizing: border-box; position: relative; }
	.image-content { object-fit: contain; pointer-events: none; width: 100%; height: 100%; }
	.text-content { pointer-events: auto; cursor: default; overflow-wrap: break-word; word-break: break-word; white-space: pre-wrap; outline: none; padding: 2px 4px; min-height: 1.2em; height: auto; }
    .text-content :global(ul), .text-content :global(ol) { margin: 0; padding-left: 1.5em; }
	.text-content[contenteditable="true"] { cursor: text; }
	.text-content:focus { box-shadow: 0 0 0 2px rgba(160, 132, 232, 0.3); outline: none; }
	.text-content[contenteditable="false"] { cursor: grab; pointer-events: auto; }
	.resize-handle, .rotate-handle { position: absolute; width: 24px; height: 24px; background: black; border: 2px solid white; border-radius: 50%; box-shadow: 0 1px 4px rgba(0,0,0,0.6); z-index: 1005; pointer-events: auto; display: flex; align-items: center; justify-content: center; }
	.rotate-handle { top: -40px; left: 50%; transform: translateX(-50%); cursor: grab; }
	.rotate-handle:active { cursor: grabbing; background-color: #333; }
	.rotate-handle::before { content: ''; position: absolute; width: 2px; height: 14px; background: black; top: 24px; left: 50%; transform: translateX(-50%); z-index: -1; }
	.rotate-handle svg { width: 16px; height: 16px; color: white; flex-shrink: 0; }
	.resize-handle.tl { top: -12px; left: -12px; cursor: nwse-resize; }
	.resize-handle.tr { top: -12px; right: -12px; cursor: nesw-resize; }
	.resize-handle.bl { bottom: -12px; left: -12px; cursor: nesw-resize; }
	.resize-handle.br { bottom: -12px; right: -12px; cursor: nwse-resize; }
	.shape-content { display:flex; align-items:center; justify-content:center; overflow: visible; pointer-events: none; }
</style>