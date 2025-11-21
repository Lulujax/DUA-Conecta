<script lang="ts">
	import { tick } from 'svelte';
    import html2canvas from 'html2canvas';
	import { user } from '../../stores/auth';
	import { editorStore } from '../../editor/editor.store.svelte';
	import { apiService } from '../../editor/apiService';
	import { pdfService } from '../../editor/pdfService';
    import InputModal from '../ui/InputModal.svelte';
    import ImageSearchModal from '../ui/ImageSearchModal.svelte';
	
	let { templateId, canvasContainerRef } = $props<{
		templateId: string;
		canvasContainerRef: HTMLDivElement | null;
	}>();

	let isDownloading = $state(false);
    let isSaving = $state(false);
    
    // Modales
    let showNameModal = $state(false);
    let showSearchModal = $state(false);
    let modalMode = $state<'pdf' | 'save'>('pdf');
    let modalTitle = $state('');
    let modalDefault = $state('');

    function requestPdfName() {
        modalMode = 'pdf';
        modalTitle = "Nombre del archivo PDF";
        modalDefault = editorStore.activityName;
        showNameModal = true;
    }

    function requestSaveName() {
        if (editorStore.currentActivityId) {
            executeSave(editorStore.activityName);
        } else {
            modalMode = 'save';
            modalTitle = "Nombre de la Actividad";
            modalDefault = editorStore.activityName;
            showNameModal = true;
        }
    }

    async function handleNameModalConfirm(value: string) {
        showNameModal = false;
        if (modalMode === 'pdf') await executePdfDownload(value);
        else if (modalMode === 'save') await executeSave(value);
    }

	async function executePdfDownload(name: string) {
		const sanitizedName = name.trim().replace(/[^a-z0-9_-\s]/gi, '').replace(/\s+/g, '_');
		const finalFilename = `DUA-Conecta_${sanitizedName}.pdf`;
		try {
			isDownloading = true;
			editorStore.deselect();
			await tick();
			await pdfService.downloadPdf(canvasContainerRef!, finalFilename);
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
        isSaving = true;
        let previewImg = null;
        if (canvasContainerRef) {
            try {
                editorStore.deselect();
                await tick();
                const canvas = await html2canvas(canvasContainerRef, { scale: 0.8, logging: false, useCORS: true });
                previewImg = canvas.toDataURL('image/jpeg', 0.6);
            } catch (e) { console.error("No se pudo generar preview", e); }
        }
        await apiService.saveChanges(templateId, previewImg);
        isSaving = false;
    }

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.[0]) editorStore.addImage(input.files[0]);
		input.value = '';
	}

    function handleImageSelect(url: string) {
        editorStore.addImageFromUrl(url); 
    }
</script>

<InputModal 
    isOpen={showNameModal} 
    title={modalTitle} 
    defaultValue={modalDefault}
    confirmLabel={modalMode === 'pdf' ? 'Descargar' : 'Guardar'}
    onConfirm={handleNameModalConfirm}
    onCancel={() => showNameModal = false}
/>

<ImageSearchModal 
    isOpen={showSearchModal}
    onSelect={handleImageSelect}
    onClose={() => showSearchModal = false}
/>

<aside class="editor-sidebar">
    <div class="sidebar-header">
        <a href="/dashboard/plantillas" class="back-button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Salir</span>
        </a>
        <div class="history-controls">
            <button class="icon-btn-small" onclick={editorStore.undo} disabled={!editorStore.canUndo} title="Deshacer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg></button>
            <button class="icon-btn-small" onclick={editorStore.redo} disabled={!editorStore.canRedo} title="Rehacer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg></button>
        </div>
    </div>

    <div class="sidebar-content">
        
        <div class="section-title">Agregar Elementos</div>
        <div class="tools-grid">
            <button class="tool-card" onclick={editorStore.addText}>
                <span class="icon">T</span>
                <span class="label">Texto</span>
            </button>
            
            <label for="image-upload" class="tool-card">
                <span class="icon">📁</span>
                <span class="label">Subir</span>
            </label>
            <button class="tool-card" onclick={() => showSearchModal = true}>
                <span class="icon">🔍</span>
                <span class="label">Buscar</span>
            </button>
            <input type="file" id="image-upload" accept="image/*" onchange={handleFileInput} />

            <button class="tool-card" onclick={() => editorStore.addShape('rectangle')}>
                <div class="shape-icon rect"></div>
                <span class="label">Caja</span>
            </button>
            <button class="tool-card" onclick={() => editorStore.addShape('circle')}>
                <div class="shape-icon circle"></div>
                <span class="label">Círculo</span>
            </button>
            <button class="tool-card" onclick={() => editorStore.addShape('line')}>
                <div class="shape-icon line"></div>
                <span class="label">Línea</span>
            </button>
        </div>

        </div>

    <div class="sidebar-footer">
        <button class="btn-action secondary" onclick={requestSaveName} disabled={!editorStore.hasUnsavedChanges || isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
        <button class="btn-action primary" onclick={requestPdfName} disabled={isDownloading}>
            {isDownloading ? 'Generando...' : 'Descargar PDF'}
        </button>
    </div>
</aside>

<style>
    /* LAYOUT PRINCIPAL - AHORA CON VARIABLES CSS PARA MODO OSCURO */
	.editor-sidebar { 
        width: 280px; 
        background-color: var(--bg-card); /* Variable */
        border-right: 1px solid var(--border-color); /* Variable */
        display: flex; 
        flex-direction: column; 
        z-index: 100;
        box-shadow: 2px 0 10px rgba(0,0,0,0.02);
    }

    /* HEADER */
    .sidebar-header {
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--border-color); /* Variable */
    }
    .back-button {
        text-decoration: none; color: var(--text-light); /* Variable */ font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 0.4rem;
    }
    .back-button:hover { color: var(--primary-color); }
    
    .history-controls { display: flex; gap: 0.5rem; }
    .icon-btn-small {
        background: none; border: none; color: var(--text-light); /* Variable */ cursor: pointer; padding: 4px; border-radius: 4px;
    }
    .icon-btn-small:hover:not(:disabled) { background-color: var(--bg-section); color: var(--text-dark); /* Variables */ }
    .icon-btn-small:disabled { opacity: 0.3; }
    .icon-btn-small svg { width: 18px; height: 18px; }

    /* CONTENIDO SCROLLABLE */
    .sidebar-content {
        flex: 1;
        padding: 1.5rem 1rem;
        overflow-y: auto;
    }

    .section-title {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-light); opacity: 0.8; /* Variable */
        font-weight: 700;
        margin-bottom: 0.8rem;
    }

    /* GRID DE HERRAMIENTAS */
    .tools-grid {
        display: grid;
        grid-template-columns: 1fr 1fr; /* 2 columnas */
        gap: 0.8rem;
    }

    .tool-card {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background-color: var(--bg-section); /* Variable */
        border: 1px solid var(--border-color); /* Variable */
        border-radius: 8px; padding: 1rem 0.5rem; gap: 0.5rem;
        cursor: pointer; transition: all 0.2s; 
        color: var(--text-dark); /* Variable */
        height: 80px; /* Altura fija uniforme */
    }
    .tool-card:hover {
        border-color: var(--primary-color); color: var(--primary-color); transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    .tool-card .icon { font-size: 1.5rem; }
    .tool-card .label { font-size: 0.8rem; font-weight: 600; }

    /* Iconos de Formas CSS - Usan currentColor para adaptarse al tema */
    .shape-icon { border: 2px solid currentColor; }
    .shape-icon.rect { width: 20px; height: 16px; }
    .shape-icon.circle { width: 18px; height: 18px; border-radius: 50%; }
    .shape-icon.line { width: 20px; height: 0; border-top: 2px solid currentColor; border-bottom: none; border-left: none; border-right: none;}

    /* FOOTER (Botones Guardar/Descargar) */
    .sidebar-footer {
        padding: 1rem;
        border-top: 1px solid var(--border-color); /* Variable */
        background-color: var(--bg-card); /* Variable */
        display: flex; flex-direction: column; gap: 0.8rem;
    }

    .btn-action {
        width: 100%; padding: 0.8rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; border: none; transition: all 0.2s;
    }
    .btn-action.primary {
        background: var(--primary-color); color: white;
    }
    .btn-action.primary:hover { opacity: 0.9; }
    .btn-action.secondary {
        background: var(--bg-section); color: var(--text-dark); /* Variables */
    }
    .btn-action.secondary:hover { background: var(--border-color); }

    input[type="file"] { display: none; }

    /* RESPONSIVE MÓVIL */
    @media (max-width: 768px) {
        .editor-sidebar {
            width: 100%; height: auto; flex-direction: row; 
            border-right: none; border-top: 1px solid var(--border-color);
            overflow-x: auto; padding: 0.5rem;
        }
        .sidebar-header, .sidebar-footer, .section-title { display: none; }
        .sidebar-content { flex-direction: row; padding: 0; overflow: visible; }
        .tools-grid { display: flex; gap: 0.5rem; }
        .tool-card { width: 60px; height: 60px; padding: 0.5rem; }
        .tool-card .icon { font-size: 1.2rem; }
        .tool-card .label { font-size: 0.65rem; }
    }
</style>