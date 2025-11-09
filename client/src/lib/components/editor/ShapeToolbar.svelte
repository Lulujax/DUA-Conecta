<script lang="ts">
	import { editorStore } from '../../editor/editor.store.svelte';

	function stopToolbarClick(event: MouseEvent) { 
		event.stopPropagation(); 
	}

	// --- *** NUEVA FUNCIÓN (Para el botón Sin Relleno) *** ---
	function setFillTransparent() {
		// Al poner 'null', el SVG lo renderizará como 'transparent'
		editorStore.updateSelectedElement({ fill: null }, true);
	}
</script>

<div class="toolbar-wrapper" role="toolbar" aria-label="Herramientas de Forma" onclick={stopToolbarClick} onmousedown={stopToolbarClick}>
	
	<label class="toolbar-label">Tipo:</label>
	<select 
		class="toolbar-select" 
		value={editorStore.selectedElement.shapeType} 
		onchange={(e) => editorStore.updateSelectedElement({ shapeType: (e.currentTarget as HTMLSelectElement).value }, true)}
	>
		<option value="rectangle">Rectángulo</option>
		<option value="circle">Círculo</option>
		<option value="line">Línea</option>
		<option value="arrow">Flecha</option>
	</select>

	<div class="toolbar-separator"></div>

	<label class="toolbar-label" title="Color de Borde">
		Borde:
		<input 
			type="color" 
			class="color-picker-input" 
			value={editorStore.selectedElement.stroke || '#000000'} 
			oninput={(e) => editorStore.updateSelectedElement({ stroke: (e.currentTarget as HTMLInputElement).value }, false)} 
			onchange={(e) => editorStore.updateSelectedElement({ stroke: (e.currentTarget as HTMLInputElement).value }, true)} 
		/>
	</label>

	{#if editorStore.selectedElement.shapeType === 'rectangle' || editorStore.selectedElement.shapeType === 'circle'}
		<label class="toolbar-label" title="Color de Relleno">
			Relleno:
			<input 
				type="color" 
				class="color-picker-input" 
				value={editorStore.selectedElement.fill || '#EEEEEE'} 
				oninput={(e) => editorStore.updateSelectedElement({ fill: (e.currentTarget as HTMLInputElement).value }, false)} 
				onchange={(e) => editorStore.updateSelectedElement({ fill: (e.currentTarget as HTMLInputElement).value }, true)} 
			/>
		</label>

		<button 
			class="icon-button"
			class:active={editorStore.selectedElement.fill === null}
			title="Sin relleno (Transparente)"
			onclick={setFillTransparent}
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M2 2l20 20"></path>
				<path d="M22 2 2 22"></path>
			</svg>
		</button>
		{/if}

	<div class="toolbar-separator"></div>

	<label class="toolbar-label">Grosor:</label>
	<input 
		type="number" 
		class="toolbar-input" 
		min="1" 
		max="50" 
		value={editorStore.selectedElement.strokeWidth || 4} 
		onchange={(e) => editorStore.updateSelectedElement({ strokeWidth: parseInt((e.currentTarget as HTMLInputElement).value) || 1 }, true)} 
	/>
</div>

<style>
	.toolbar-wrapper { 
		position: absolute;
		top: 1rem; 
		left: 50%; 
		transform: translateX(-50%); 
		display: flex; 
		align-items: center; 
		gap: 0.5rem; 
		padding: 0.3rem 0.5rem; 
		background-color: var(--bg-card);
		border: 1px solid var(--border-color);
		border-radius: 8px; 
		box-shadow: 0 4px 15px rgba(0,0,0,0.1); 
		z-index: 1001; 
		white-space: nowrap;
	}
	.toolbar-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-light);
		display: flex;
		align-items: center;
		gap: 0.3rem;
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
	.toolbar-input {
		width: 45px; 
	}
	.color-picker-input {
		width: 28px;
		height: 28px;
		padding: 2px;
		border: 1px solid var(--border-color);
		background: var(--bg-section);
		border-radius: 4px;
		cursor: pointer;
	}
	.color-picker-input::-webkit-color-swatch-wrapper {
		padding: 0;
	}
	.color-picker-input::-webkit-color-swatch {
		border: none;
		border-radius: 2px;
	}
	.color-picker-input::-moz-color-swatch {
		border: none;
		border-radius: 2px;
	}

	.toolbar-separator { 
		width: 1px; 
		height: 18px; 
		background-color: var(--border-color); 
		margin: 0 0.3rem; 
	}

	/* --- *** INICIO DEL CAMBIO (Estilos del botón "Sin Relleno") *** --- */
	.icon-button { 
		width: 28px; 
		height: 28px; 
		display: flex; 
		justify-content: center; 
		align-items: center; 
		padding: 0; 
		background-color: transparent; 
		border: 1px solid var(--border-color); 
		color: var(--text-light); 
		border-radius: 4px; 
		cursor: pointer; 
		transition: all 0.2s ease; 
	}
	.icon-button svg { 
		width: 18px; 
		height: 18px;
	}
	.icon-button:hover:not(:disabled) { 
		border-color: var(--primary-color); 
		color: var(--primary-color); 
	}
	.icon-button.active { 
		background-color: var(--primary-color); 
		color: var(--text-on-primary); 
		border-color: var(--primary-color);
	}
	/* --- *** FIN DEL CAMBIO *** --- */
</style>