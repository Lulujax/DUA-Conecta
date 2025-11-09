<script lang="ts">
	// Importamos el store usando la ruta relativa correcta
	import { editorStore } from '../../editor/editor.store.svelte';

	// Función para evitar que al hacer clic en la barra se deseleccione el elemento
	function stopToolbarClick(event: MouseEvent) { 
		event.stopPropagation(); 
	}

	// Función para formatear el valor de opacidad (ej. 0.8 -> 80%)
	function formatOpacity(value: number | undefined): number {
		if (value === undefined) value = 1;
		return Math.round(value * 100);
	}

	// Función para actualizar el store desde el slider (ej. 80 -> 0.8)
	function updateOpacity(e: Event) {
		const value = parseInt((e.currentTarget as HTMLInputElement).value);
		editorStore.updateSelectedElement({ opacity: value / 100 }, true);
	}
</script>

<div class="toolbar-wrapper" role="toolbar" aria-label="Herramientas de Imagen" onclick={stopToolbarClick} onmousedown={stopToolbarClick}>
	
	<label class="toolbar-label" title="Opacidad de la imagen">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M12 21a9 9 0 0 1 0-18v18z"></path>
			<path d="M12 3a9 9 0 0 1 0 18"></path>
		</svg>
	</label>
	<input 
		type="range" 
		class="toolbar-slider" 
		min="0" 
		max="100" 
		value={formatOpacity(editorStore.selectedElement.opacity)} 
		oninput={updateOpacity}
	/>
	<span class="toolbar-value">{formatOpacity(editorStore.selectedElement.opacity)}%</span>
	
</div>

<style>
	/* Estilos base de la barra (idénticos a las otras toolbars) */
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
	.toolbar-label svg {
		color: var(--text-dark); /* Color del icono */
	}

	/* Estilos para el slider de opacidad */
	.toolbar-slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100px;
		height: 6px;
		background: var(--bg-section);
		border: 1px solid var(--border-color);
		border-radius: 3px;
		outline: none;
		cursor: pointer;
	}
	.toolbar-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		background: var(--primary-color);
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid var(--bg-card);
	}
	.toolbar-slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		background: var(--primary-color);
		border-radius: 50%;
		cursor: pointer;
		border: 2px solid var(--bg-card);
	}

	/* Estilo para el valor (ej. 80%) */
	.toolbar-value {
		font-size: 0.75rem;
		color: var(--text-dark);
		font-weight: 600;
		width: 35px; /* Ancho fijo para alinear */
		text-align: right;
	}
</style>