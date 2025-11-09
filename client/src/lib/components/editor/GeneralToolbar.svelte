<script lang="ts">
	// Importamos el store para llamar a las funciones
	import { editorStore } from '../../editor/editor.store.svelte';

	function stopToolbarClick(event: MouseEvent) { 
		event.stopPropagation(); 
	}
</script>

<div class="toolbar-wrapper" role="toolbar" aria-label="Herramientas Generales" onclick={stopToolbarClick} onmousedown={stopToolbarClick}>
	
	<button class="icon-button" onclick={editorStore.bringToFront} title="Traer al frente">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="8" y="8" width="12" height="12" rx="2" ry="2" fill="currentColor" stroke="none"></rect>
			<rect x="4" y="4" width="12" height="12" rx="2" ry="2"></rect>
		</svg>
	</button>

	<button class="icon-button" onclick={editorStore.moveForward} title="Mover hacia adelante">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
			<path d="M4 16V6a2 2 0 0 1 2-2h8"></path>
		</svg>
	</button>

	<button class="icon-button" onclick={editorStore.moveBackward} title="Mover hacia atrás">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
			<path d="M16 4h-8a2 2 0 0 0-2 2v8"></path>
		</svg>
	</button>

	<button class="icon-button" onclick={editorStore.sendToBack} title="Enviar al fondo">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="4" y="4" width="12" height="12" rx="2" ry="2" fill="currentColor" stroke="none"></rect>
			<rect x="8" y="8" width="12" height="12" rx="2" ry="2"></rect>
		</svg>
	</button>

	<div class="toolbar-separator"></div>

	<button class="icon-button" onclick={editorStore.duplicateSelectedElement} title="Duplicar">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
			<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
		</svg>
	</button>
	<div class="toolbar-separator"></div>
	
	<button class="icon-button delete" onclick={editorStore.deleteSelected} title="Eliminar (Supr/Borrar)">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="3 6 5 6 21 6"></polyline>
			<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
		</svg>
	</button>

</div>

<style>
	.toolbar-wrapper { 
		position: absolute;
		top: 1rem; 
		/* Ajustamos la posición para que quepa el nuevo botón y separador */
		left: calc(50% - 320px); 
		transform: translateX(-100%); 
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
	.icon-button svg rect[fill="currentColor"] {
		fill: currentColor;
	}

	.toolbar-separator { 
		width: 1px; 
		height: 18px; 
		background-color: var(--border-color); 
		margin: 0 0.3rem; 
	}
	.icon-button.delete:hover {
		color: #e53e3e; /* Rojo al pasar el mouse */
		border-color: #e53e3e;
	}
</style>