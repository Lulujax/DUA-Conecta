<script lang="ts">
	import { browser } from '$app/environment';
	import { editorStore } from '../../editor/editor.store.svelte';
    import { onMount } from 'svelte';

	const availableFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Anton', 'Oswald'];
    const lineHeights = [1.0, 1.2, 1.4, 1.6, 2.0];
	
    let isBold = $state(false);
    let isItalic = $state(false);
    let isUnderlined = $state(false);
    let savedRange: Range | null = null;

	function stopToolbarClick(event: MouseEvent) { event.stopPropagation(); }

    function saveSelection() {
        if (!browser) return;
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && (sel.anchorNode?.parentElement?.closest('.text-content'))) {
            savedRange = sel.getRangeAt(0);
        } else { savedRange = null; }
    }

    function restoreSelection(): boolean {
        if (!browser || !savedRange) return false;
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(savedRange);
        return true;
    }

    function dispatchGlobalCommand(command: string, value: string | undefined) {
        if (!editorStore.selectedElementId) return;
        const wrapper = document.querySelector(`[data-element-id="${editorStore.selectedElementId}"]`);
        if (wrapper) wrapper.dispatchEvent(new CustomEvent('exec-cmd', { detail: { command, value }, bubbles: true }));
    }

    function toggleFormat(command: string, value: string | undefined = undefined) {
        const restored = restoreSelection();
        if (restored) {
            document.execCommand(command, false, value);
            const activeEl = document.activeElement;
            if (activeEl && activeEl.classList.contains('text-content')) activeEl.dispatchEvent(new Event('input', { bubbles: true }));
        } else {
            dispatchGlobalCommand(command, value);
        }
        checkActiveFormats();
    }

    function checkActiveFormats() {
        if (!browser) return;
        try {
            if (document.activeElement?.classList.contains('text-content')) {
                isBold = document.queryCommandState('bold');
                isItalic = document.queryCommandState('italic');
                isUnderlined = document.queryCommandState('underline');
            }
        } catch(e) {} 
    }

    onMount(() => {
        document.addEventListener('selectionchange', checkActiveFormats);
        return () => document.removeEventListener('selectionchange', checkActiveFormats);
    });

	async function formatList(command: 'insertUnorderedList' | 'insertOrderedList') {
        toggleFormat(command);
	}
</script>

<div class="text-toolbar" role="toolbar" aria-label="Herramientas de texto" onclick={stopToolbarClick} onmousedown={stopToolbarClick}>
	<select class="toolbar-select" 
        onchange={(e) => editorStore.updateSelectedElement({ fontFamily: e.currentTarget.value }, true)}
        value={editorStore.selectedElement?.fontFamily}>
		{#each availableFonts as font}
			<option value={font} style:font-family={font}>{font}</option>
		{/each}
	</select>

	<div class="font-size-control">
		<button class="icon-button" onclick={() => editorStore.changeFontSize(-1)} title="Reducir tamaño">
			<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13H5v-2h14v2z"></path></svg>
		</button>
		<input type="number" class="toolbar-input font-size-input" min="8" max="120" step="1" value={editorStore.selectedElement?.fontSize || 16} onchange={editorStore.updateFontSizeFromInput} />
		<button class="icon-button" onclick={() => editorStore.changeFontSize(1)} title="Aumentar tamaño">
			<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
		</button>
	</div>
    
    <select class="toolbar-select short" title="Interlineado"
        onchange={(e) => editorStore.changeLineHeight(parseFloat(e.currentTarget.value))}
        value={editorStore.selectedElement?.lineHeight || 1.4}>
        {#each lineHeights as lh}
            <option value={lh}>{lh}</option>
        {/each}
    </select>

    <div class="toolbar-separator"></div>

	<label class="icon-button color-label" title="Color de texto" onmousedown={saveSelection}>
		<span style="font-weight:900; color:currentColor;">A</span>
		<input type="color" class="color-picker-hidden" oninput={(e) => toggleFormat('foreColor', e.currentTarget.value)}/>
		<div class="color-indicator" style:background-color={'#000'}></div>
	</label>

    <label class="icon-button color-label" title="Resaltador (Fondo)" onmousedown={saveSelection}>
		<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M18.5 2.5L14 7l-4-4 4.5-4.5a1.41 1.41 0 0 1 2 0l2 2c.55.55.55 1.45 0 2zM13 8l-9 9 2 2 9-9-2-2zm-2 3L5 17v2h2l6-6-2-2z"/></svg>
		<input type="color" class="color-picker-hidden" oninput={(e) => toggleFormat('hiliteColor', e.currentTarget.value)}/>
		<div class="color-indicator" style:background-color={'yellow'}></div>
	</label>

	<button class="icon-button" class:active={isBold} onmousedown={(e)=>{e.preventDefault(); saveSelection();}} onclick={() => toggleFormat('bold')} title="Negrita (Ctrl+B)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4.25-4H7v14h7.04c2.1 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"></path></svg></button>
	<button class="icon-button" class:active={isItalic} onmousedown={(e)=>{e.preventDefault(); saveSelection();}} onclick={() => toggleFormat('italic')} title="Cursiva (Ctrl+I)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"></path></svg></button>
	<button class="icon-button" class:active={isUnderlined} onmousedown={(e)=>{e.preventDefault(); saveSelection();}} onclick={() => toggleFormat('underline')} title="Subrayado (Ctrl+U)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"></path></svg></button>

	<div class="toolbar-separator"></div>

	<button class="icon-button" onmousedown={(e)=>{e.preventDefault(); saveSelection();}} onclick={() => formatList('insertUnorderedList')} title="Lista con viñetas"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h2v2H4zm0 6h2v2H4zm0 6h2v2H4zm4 1h14v2H8zm0-6h14v2H8zm0-6h14v2H8z"></path></svg></button>
	<button class="icon-button" onmousedown={(e)=>{e.preventDefault(); saveSelection();}} onclick={() => formatList('insertOrderedList')} title="Lista numerada"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 11.9V11H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"></path></svg></button>

	<div class="toolbar-separator"></div>

	<button class="icon-button" class:active={editorStore.selectedElement?.textAlign === 'left'} onclick={() => editorStore.changeTextAlign('left')} title="Alinear Izquierda"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"></path></svg></button>
	<button class="icon-button" class:active={editorStore.selectedElement?.textAlign === 'center'} onclick={() => editorStore.changeTextAlign('center')} title="Centrar"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"></path></svg></button>
	<button class="icon-button" class:active={editorStore.selectedElement?.textAlign === 'right'} onclick={() => editorStore.changeTextAlign('right')} title="Alinear Derecha"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"></path></svg></button>
    <button class="icon-button" class:active={editorStore.selectedElement?.textAlign === 'justify'} onclick={() => editorStore.changeTextAlign('justify')} title="Justificar"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"></path></svg></button>
</div>

<style>
	.text-toolbar { position: absolute; top: 1rem; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.5rem; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); z-index: 1001; white-space: nowrap; }
	.toolbar-select, .toolbar-input { padding: 0.2rem 0.4rem; border-radius: 4px; border: 1px solid var(--border-color); background-color: var(--bg-section); color: var(--text-dark); font-size: 0.75rem; height: 28px; box-sizing: border-box; outline: none; }
	.toolbar-select { min-width: 80px; }
    .toolbar-select.short { min-width: 50px; width: 50px; }
	.font-size-control { display: flex; align-items: center; background-color: var(--bg-section); border: 1px solid var(--border-color); border-radius: 4px; overflow: hidden; }
	.icon-button { width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; padding: 0; background-color: var(--bg-section); border: 1px solid var(--border-color); color: var(--text-light); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0; }
	.icon-button svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; width: 18px; height: 18px; }
	.icon-button:hover:not(:disabled) { border-color: var(--primary-color); color: var(--primary-color); background-color: transparent; }
	.icon-button:disabled { opacity: 0.5; cursor: not-allowed; }
	.font-size-control .icon-button { border: none; border-radius: 0; background-color: transparent; width: 26px; height: 26px; color: var(--text-light); }
	.font-size-control .icon-button:hover:not(:disabled) { background-color: rgba(0,0,0,0.05); color: var(--primary-color); }
	.font-size-input { width: 35px; text-align: center; margin: 0; padding: 0.2rem; border: none; height: 26px; background-color: transparent; }
	.font-size-input::-webkit-outer-spin-button, .font-size-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
	.font-size-input { -moz-appearance: textfield; }
	.text-toolbar .icon-button { width: 28px; height: 28px; background-color: transparent; border-color: transparent; }
	.text-toolbar .icon-button svg { width: 18px; height: 18px; fill: currentColor; }
	.text-toolbar .icon-button:hover:not(:disabled) { background-color: var(--bg-section); color: var(--primary-color); border-color: transparent; }
	.text-toolbar .icon-button.active { background-color: var(--primary-color); color: var(--text-on-primary); border-color: var(--primary-color); }
	.color-label { position: relative; border: 1px solid var(--border-color); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2px; box-sizing: border-box; }
	.color-label svg { width: 16px; height: 12px; margin-bottom: 1px; fill: currentColor; }
	.color-label:hover { background-color: var(--bg-section); }
	.color-picker-hidden { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
	.color-indicator { width: 100%; height: 4px; border-radius: 1px; margin-top: auto; border: 1px solid rgba(0,0,0,0.1); box-sizing: border-box; }
	.toolbar-separator { width: 1px; height: 18px; background-color: var(--border-color); margin: 0 0.3rem; }
</style>