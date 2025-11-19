<script lang="ts">
	import { tick } from 'svelte';
	import { user } from '../../stores/auth';
	import { editorStore } from '../../editor/editor.store.svelte';
	import { apiService } from '../../editor/apiService';
	import { pdfService } from '../../editor/pdfService';
    // Importamos nuestro nuevo Modal
    import InputModal from '../ui/InputModal.svelte';
	
	let { templateId, canvasContainerRef } = $props<{
		templateId: string;
		canvasContainerRef: HTMLDivElement | null;
	}>();

	// --- ESTADO LOCAL ---
	let isDownloading = $state(false);
    
    // Estado para el Modal
    let showModal = $state(false);
    let modalMode = $state<'pdf' | 'save'>('pdf'); // Para saber qué estamos pidiendo
    let modalTitle = $state('');
    let modalDefault = $state('');

    // --- HANDLERS (Abrir Modal) ---
    
    function requestPdfName() {
        modalMode = 'pdf';
        modalTitle = "Nombre del archivo PDF";
        modalDefault = editorStore.activityName;
        showModal = true;
    }

    function requestSaveName() {
        // Si ya tiene ID (es edición), guardamos directo sin preguntar nombre
        if (editorStore.currentActivityId) {
            executeSave(editorStore.activityName);
        } else {
            // Si es nueva, pedimos nombre
            modalMode = 'save';
            modalTitle = "Nombre de la Actividad";
            modalDefault = editorStore.activityName;
            showModal = true;
        }
    }

    // --- EJECUCIÓN (Lo que pasa al confirmar el Modal) ---

    async function handleModalConfirm(value: string) {
        showModal = false; // Cerramos modal
        
        if (modalMode === 'pdf') {
            await executePdfDownload(value);
        } else if (modalMode === 'save') {
            await executeSave(value);
        }
    }

	async function executePdfDownload(name: string) {
		const sanitizedName = name.trim().replace(/[^a-z0-9_-\s]/gi, '').replace(/\s+/g, '_');
		const finalFilename = `DUA-Conecta_${sanitizedName}.pdf`;

		try {
			isDownloading = true;
			editorStore.deselect();
			await tick();
			await pdfService.downloadPdf(canvasContainerRef, finalFilename);
		} catch (error) {
			alert('Hubo un error al generar el PDF.');
		} finally {
			isDownloading = false;
		}
	}

    async function executeSave(name: string) {
        if (name !== editorStore.activityName) {
            editorStore.updateActivityName(name);
        }
        
        // CORRECCIÓN: Llamamos a saveChanges SOLO con templateId
        // (El token ya no se pasa porque va en la cookie)
        await apiService.saveChanges(templateId);
    }

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.[0]) editorStore.addImage(input.files[0]);
		input.value = '';
	}
</script>

<InputModal 
    isOpen={showModal} 
    title={modalTitle} 
    defaultValue={modalDefault}
    confirmLabel={modalMode === 'pdf' ? 'Descargar' : 'Guardar'}
    onConfirm={handleModalConfirm}
    onCancel={() => showModal = false}
/>

<aside class="editor-sidebar">
	<a href="/dashboard/plantillas" class="back-button">
		<svg width="18" height="18" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
		<span>Volver</span>
	</a>
	<div class="tool-section history-controls">
		<button class="icon-button" onclick={editorStore.undo} disabled={!editorStore.canUndo} title="Deshacer (Ctrl+Z)">
			<svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
		</button>
		<button class="icon-button" onclick={editorStore.redo} disabled={!editorStore.canRedo} title="Rehacer (Ctrl+Y)">
			<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
		</button>
	</div>
	
	<div class="tool-section add-panel">
		<h3>Añadir</h3>
		
		<div class="tool-grid">
			<button class="tool-button" onclick={editorStore.addText}>
				<span class="tool-icon">T</span> <span class="tool-label">Texto</span>
			</button>
			<label for="image-upload" class="tool-button">
				<span class="tool-icon">🖼️</span> <span class="tool-label">Imagen</span>
			</label>
			<input type="file" id="image-upload" accept="image/*" onchange={handleFileInput} />
			<button class="tool-button" onclick={() => editorStore.addShape('rectangle')}>
				<span class="tool-icon">⬜</span> <span class="tool-label">Forma</span>
			</button>
			<button class="tool-button" onclick={() => editorStore.addShape('circle')}>
				<span class="tool-icon">⚪</span> <span class="tool-label">Círculo</span>
			</button>
			<button class="tool-button" onclick={() => editorStore.addShape('line')}>
				<span class="tool-icon">/</span> <span class="tool-label">Línea</span>
			</button>
			<button class="tool-button" onclick={() => editorStore.addShape('arrow')}>
				<span class="tool-icon">→</span> <span class="tool-label">Flecha</span>
			</button>
		</div>
	</div>

	{#if editorStore.selectedElement}
		<div class="tool-section">
			<h3>Seleccionado</h3>
			{#if editorStore.selectedElement.type === 'image'}
				<p class="prop-label" style="margin-top:0;">Imagen</p>
				<p class="help-text">Edita la opacidad en la barra superior.</p>
			{/if}
			{#if editorStore.selectedElement.type === 'text'}
				<p class="prop-label" style="margin-top:0;">Texto</p>
				<p class="help-text">Edita el estilo en la barra superior.</p>
			{/if}
			{#if editorStore.selectedElement.type === 'shape'}
				<p class="prop-label" style="margin-top:0;">Forma</p>
				<p class="help-text">Edita los colores y grosor en la barra superior.</p>
			{/if}
			<button class="btn-secondary btn-delete" onclick={editorStore.deleteSelected} title="Eliminar (Supr/Borrar)">Eliminar</button>
		</div>
	{/if}

	<div class="tool-section actions">
		<h3>Acciones</h3>
		<button 
			class="btn-secondary" 
			onclick={requestSaveName} 
			disabled={!editorStore.hasUnsavedChanges}
		>
			{#if editorStore.hasUnsavedChanges}
				{editorStore.currentActivityId ? 'Actualizar' : 'Guardar Nueva'}
			{:else}
				Guardado ✓
			{/if}
		</button>
		
		<button 
			class="btn-primary" 
			onclick={requestPdfName} 
			disabled={isDownloading}
			style:opacity={isDownloading ? 0.7 : 1}
			style:cursor={isDownloading ? 'wait' : 'pointer'}
		>
			{#if isDownloading}
				⏳ Generando...
			{:else}
				Descargar PDF
			{/if}
		</button>
	</div>
</aside>

<style>
    /* (Mantén los estilos de antes, son perfectos) */
	.editor-sidebar { width: 280px; flex-shrink: 0; background-color: var(--bg-card); border-right: 1px solid var(--border-color); padding: 1.5rem; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; }
	.back-button { text-decoration: none; color: var(--text-light); font-weight: 600; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0rem; transition: color 0.2s ease; }
    .back-button svg { flex-shrink: 0; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
	.back-button:hover { color: var(--primary-color); }
	.history-controls { display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; }
	.icon-button { width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; padding: 0; background-color: var(--bg-section); border: 1px solid var(--border-color); color: var(--text-light); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0; }
	.icon-button svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; width: 18px; height: 18px; }
	.icon-button:hover:not(:disabled) { border-color: var(--primary-color); color: var(--primary-color); background-color: transparent; }
	.icon-button:disabled { opacity: 0.5; cursor: not-allowed; }
	.tool-section h3 { font-size: 1rem; font-weight: 700; color: var(--text-dark); margin: 0 0 1rem 0; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
	.tool-grid { display: grid; grid-template-columns: repeat(3, minmax(60px, 1fr)); gap: 0.5rem; }
	.tool-button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; padding: 0.75rem 0.25rem; background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s ease; color: var(--text-light); font-size: 0.75rem; font-weight: 600; font-family: var(--font-main); }
	.tool-button:hover { border-color: var(--primary-color); color: var(--primary-color); background-color: var(--bg-section); }
	.tool-icon { font-size: 1.25rem; line-height: 1.2; }
	.editor-sidebar input[type="file"] { display: none; }
	.prop-label { font-size: 0.85rem; font-weight: 600; color: var(--text-light); margin-top: 0.8rem; margin-bottom: 0.3rem; display: block; }
	.help-text { font-size: 0.8rem; color: var(--text-light); }
	.btn-delete { background-color: #f15e5e; color: white; border-color: #f15e5e; margin-top: 1rem; }
	.btn-delete:hover { background-color: #e53e3e; border-color: #e53e3e; }
	.actions { margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
    .actions .btn-secondary, .actions .btn-primary { width: 100%; text-align: center; padding: 0.6rem 1rem; font-size: 0.85rem; margin: 0 0 0.75rem 0; }
</style>