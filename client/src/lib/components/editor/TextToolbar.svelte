<script lang="ts">
	import { browser } from '$app/environment';
	// Importamos el store usando la ruta relativa correcta
	import { editorStore } from '../../editor/editor.store.svelte';
	// Movemos las constantes y funciones que solo usa la barra de herramientas
	const availableFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Comic Sans MS', 'Anton', 'Oswald'];
	function stopToolbarClick(event: MouseEvent) { 
		event.stopPropagation(); 
	}

	async function formatList(command: 'insertUnorderedList' | 'insertOrderedList') {
		if (!browser || !editorStore.selectedElement || editorStore.selectedElement.type !== 'text' || editorStore.selectedElementId === null) return;
		const normalized = command === 'insertUnorderedList' ? 'ul' : 'ol';
		
		// Encontramos el elemento wrapper del Draggable
		const wrapper = document.querySelector(`[data-element-id="${editorStore.selectedElementId}"]`);
		if (!wrapper) return;

		// Despachamos el evento custom que el componente Draggable está escuchando
		wrapper.dispatchEvent(new CustomEvent('toggle-list', { detail: { type: normalized }, bubbles: true }));
	}
</script>

<div class="text-toolbar" role="toolbar" aria-label="Herramientas de texto" onclick={stopToolbarClick} onmousedown={stopToolbarClick}>
	<select class="toolbar-select" value={editorStore.selectedElement.fontFamily} onchange={(e) => editorStore.updateSelectedElement({ fontFamily: e.currentTarget.value }, true)}>
		{#each availableFonts as font}
			<option value={font} style:font-family={font}>{font}</option>
		{/each}
	</select>
	<div class="font-size-control">
		<button class="icon-button" onclick={() => editorStore.changeFontSize(-1)} title="Reducir tamaño" disabled={editorStore.selectedElement.fontSize <= 8}>
			<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13H5v-2h14v2z"></path></svg>
		</button>
		<input type="number" class="toolbar-input font-size-input" min="8" max="120" step="1" value={editorStore.selectedElement.fontSize} onchange={editorStore.updateFontSizeFromInput} onblur={editorStore.updateFontSizeFromInput} onkeydown={(e) => { if(e.key === 'Enter') { e.preventDefault(); editorStore.updateFontSizeFromInput(e); (e.target as HTMLElement).blur();} }}/>
		<button class="icon-button" onclick={() => editorStore.changeFontSize(1)} title="Aumentar tamaño" disabled={editorStore.selectedElement.fontSize >= 120}>
			<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
		</button>
	</div>
	<label class="icon-button color-label" title="Color de texto">
		<svg viewBox="0 0 24 24"><path fill="currentColor" d="M17.75 11.25a.75.75 0 000-1.5h-11.5a.75.75 0 000 1.5h11.5zm.75 1.5a.75.75 0 01-.75.75H6a.75.75 0 010-1.5h11.75a.75.75 0 01.75.75zm0 3a.75.75 0 01-.75.75H6a.75.75 0 010-1.5h11.75a.75.75 0 01.75.75zM12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zM12 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"></path></svg>
		
		<input 
			type="color" 
			class="color-picker-hidden" 
			value={editorStore.selectedElement.color} 
			oninput={(e) => editorStore.updateSelectedElement({ color: e.currentTarget.value }, false)} 
			onchange={(e) => editorStore.updateSelectedElement({ color: e.currentTarget.value }, true)}
		/>
		<div class="color-indicator" style:background-color={editorStore.selectedElement.color || '#000000'}></div>
	</label>
	<button class="icon-button" class:active={editorStore.selectedElement.isBold} onclick={() => editorStore.toggleStyle('isBold')} title="Negrita (Ctrl+B)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4.25-4H7v14h7.04c2.1 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"></path></svg></button>
	<button class="icon-button" class:active={editorStore.selectedElement.isItalic} onclick={() => editorStore.toggleStyle('isItalic')} title="Cursiva (Ctrl+I)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"></path></svg></button>
	<button class="icon-button" class:active={editorStore.selectedElement.isUnderlined} onclick={() => editorStore.toggleStyle('isUnderlined')} title="Subrayado (Ctrl+U)"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"></path></svg></button>
	<div class="toolbar-separator"></div>
	<button class="icon-button" onclick={(e) => { e.preventDefault(); e.stopPropagation(); formatList('insertUnorderedList'); }} title="Lista con viñetas"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 4h2v2H4zm0 6h2v2H4zm0 6h2v2H4zm4 1h14v2H8zm0-6h14v2H8zm0-6h14v2H8z"></path></svg></button>
	<button class="icon-button" class:active={false} onclick={(e) => { e.preventDefault(); e.stopPropagation(); formatList('insertOrderedList'); }} title="Lista numerada"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 11.9V11H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z"></path></svg></button>
	<div class="toolbar-separator"></div>
	<button class="icon-button" class:active={editorStore.selectedElement?.textAlign === 'left'} onclick={() => editorStore.changeTextAlign('left')} title="Alinear Izquierda"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"></path></svg></button>
	<button class="icon-button" class:active={editorStore.selectedElement?.textAlign === 'center'} onclick={() => editorStore.changeTextAlign('center')} title="Centrar"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z"></path></svg></button>
	<button class="icon-button" class:active={editorStore.selectedElement?.textAlign === 'right'} onclick={() => editorStore.changeTextAlign('right')} title="Alinear Derecha"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"></path></svg></button>
	<button class="icon-button" class:active={editorStore.selectedElement?.textAlign === 'justify'} onclick={() => editorStore.changeTextAlign('justify')} title="Justificar"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"></path></svg></button>
</div>

<style>
	.text-toolbar { 
		position: absolute;
		top: 1rem; 
		left: 50%; 
		transform: translateX(-50%); 
		display: flex; 
		align-items: center; 
		gap: 0.4rem; 
		padding: 0.3rem 0.5rem; 
		background-color: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 8px; 
		box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
		z-index: 1001; 
		white-space: nowrap;
	}
	.toolbar-select, .toolbar-input { 
		padding: 0.2rem 0.4rem; 
		border-radius: 4px; 
		border: 1px solid var(--border-color); 
		background-color: var(--bg-section); 
		color: var(--text-dark); 
		font-size: 0.75rem; 
		height: 28px;
		box-sizing: border-box; 
		outline: none; 
	}
	.toolbar-select { min-width: 80px; }
	.font-size-control { 
		display: flex; 
		align-items: center; 
		background-color: var(--bg-section); 
		border: 1px solid var(--border-color);
		border-radius: 4px; 
		overflow: hidden; 
	}
	.icon-button { 
		width: 32px; 
		height: 32px; 
		display: flex; 
		justify-content: center; 
		align-items: center; 
		padding: 0; 
		background-color: var(--bg-section);
		border: 1px solid var(--border-color); 
		color: var(--text-light); 
		border-radius: 6px; 
		cursor: pointer; 
		transition: all 0.2s ease; 
		flex-shrink: 0;
	}
	.icon-button svg { 
		fill: none; 
		stroke: currentColor; 
		stroke-width: 2; 
		stroke-linecap: round; 
		stroke-linejoin: round; 
		width: 18px; 
		height: 18px;
	}
	.icon-button:hover:not(:disabled) { 
		border-color: var(--primary-color); 
		color: var(--primary-color); 
		background-color: transparent; 
	}
	.icon-button:disabled { opacity: 0.5; cursor: not-allowed; }
	.font-size-control .icon-button { 
		border: none;
		border-radius: 0; 
		background-color: transparent; 
		width: 26px; 
		height: 26px; 
		color: var(--text-light); 
	}
	.font-size-control .icon-button:hover:not(:disabled) { 
		background-color: rgba(0,0,0,0.05); 
		color: var(--primary-color);
	}
	.font-size-control .icon-button:disabled { opacity: 0.4; }
	.font-size-control .icon-button svg { width: 16px; height: 16px; }
	.font-size-input { 
		width: 35px; 
		text-align: center;
		margin: 0; 
		padding: 0.2rem; 
		border: none; 
		height: 26px; 
		background-color: transparent; 
	}
	.font-size-input::-webkit-outer-spin-button, .font-size-input::-webkit-inner-spin-button { 
		-webkit-appearance: none; 
		margin: 0;
	}
	.font-size-input { -moz-appearance: textfield; }
	.text-toolbar .icon-button { 
		width: 28px; 
		height: 28px; 
		background-color: transparent; 
		border-color: transparent;
	}
	.text-toolbar .icon-button svg { width: 18px; height: 18px; fill: currentColor; }
	.text-toolbar .icon-button:hover:not(:disabled) { 
		background-color: var(--bg-section); 
		color: var(--primary-color); 
		border-color: transparent;
	}
	.text-toolbar .icon-button.active { 
		background-color: var(--primary-color); 
		color: var(--text-on-primary); 
		border-color: var(--primary-color);
	}
	.color-label { 
		position: relative; 
		border: 1px solid var(--border-color); 
		display: flex;
		flex-direction: column; 
		align-items: center; 
		justify-content: center; 
		padding: 2px; 
		box-sizing: border-box;
	}
	.color-label svg { width: 16px; height: 12px; margin-bottom: 1px;
		fill: currentColor; }
	.color-label:hover { background-color: var(--bg-section); }
	.color-picker-hidden { 
		position: absolute; 
		top: 0; 
		left: 0; 
		width: 100%; 
		height: 100%; 
		opacity: 0;
		cursor: pointer; 
	}
	.color-indicator { 
		width: 100%; 
		height: 4px; 
		border-radius: 1px; 
		margin-top: auto; 
		border: 1px solid rgba(0,0,0,0.1); 
		box-sizing: border-box;
	}
	.toolbar-separator { 
		width: 1px; 
		height: 18px; 
		background-color: var(--border-color); 
		margin: 0 0.3rem; 
	}
</style>