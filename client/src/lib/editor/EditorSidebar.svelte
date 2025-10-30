<script lang="ts">
    // Este componente recibe el store completo como un objeto
	let { store } = $props<any>();
</script>

<aside class="editor-sidebar">
    <a href="/dashboard/plantillas" class="back-button">
        <svg width="18" height="18" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        <span>Volver</span>
    </a>
    <div class="tool-section history-controls">
        <button class="icon-button" onclick={store.undo} disabled={!store.canUndo} title="Deshacer (Ctrl+Z)"><svg viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg></button>
        <button class="icon-button" onclick={store.redo} disabled={!store.canRedo} title="Rehacer (Ctrl+Y)"><svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>
    </div>
    <div class="tool-section">
        <h3>Añadir</h3>
        <button class="btn-secondary" onclick={store.addText}>+ Texto</button>
        <label for="image-upload" class="btn-secondary btn-upload">+ Imagen</label>
        <input type="file" id="image-upload" accept="image/*" onchange={store.handleFileInput} />
        <div style="margin-top:8px;">
            <button class="btn-secondary" onclick={() => store.addShape('arrow')}>+ Flecha</button>
            <button class="btn-secondary" onclick={() => store.addShape('line')}>+ Línea</button>
            <button class="btn-secondary" onclick={() => store.addShape('circle')}>+ Círculo</button>
        </div>
    </div>
    {#if store.selectedElement}
        <div class="tool-section">
            <h3>Seleccionado</h3>
            {@const el = store.selectedElement}
            {#if el.type === 'image'}<p class="prop-label" style="margin-top:0;">Imagen</p><p style="font-size: 0.8rem; color: var(--text-light);">Arrastra para mover, usa la esquina para redimensionar.</p>{/if}
            {#if el.type === 'text'}<p class="prop-label" style="margin-top:0;">Texto</p><p style="font-size: 0.8rem; color: var(--text-light);">Edita en la barra superior.</p>{/if}
            {#if el.type === 'shape'}
                <p class="prop-label" style="margin-top:0;">Forma</p>
                <label style="display:flex;gap:8px;align-items:center;">
                    Tipo:
                    <select value={el.shapeType} onchange={(e) => store.updateElement(el.id, { shapeType: (e.currentTarget as HTMLSelectElement).value }, true)}>
                        <option value="arrow">Flecha</option>
                        <option value="line">Línea</option>
                        <option value="circle">Círculo</option>
                    </select>
                </label>
                <label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
                    Color:
                    <input type="color" value={el.stroke || '#000000'} oninput={(e) => store.updateElement(el.id, { stroke: (e.currentTarget as HTMLInputElement).value }, true)} />
                </label>
                <label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
                    Grosor:
                    <input type="number" min="1" max="40" value={el.strokeWidth || 4} onchange={(e) => store.updateElement(el.id, { strokeWidth: parseInt((e.currentTarget as HTMLInputElement).value) || 1 }, true)} />
                </label>
                <label style="display:flex;gap:8px;align-items:center;margin-top:6px;">
                    Rotación:
                    <input type="range" min="0" max="360" value={el.rotation || 0} onchange={(e) => store.updateElement(el.id, { rotation: parseInt((e.currentTarget as HTMLInputElement).value) || 0 }, true)} />
                    <span style="width:36px;text-align:center">{el.rotation || 0}°</span>
                </label>
            {/if}
            <button class="btn-secondary btn-delete" onclick={store.deleteSelected} title="Eliminar (Supr/Borrar)">Eliminar</button>
        </div>
    {/if}
    <div class="tool-section actions">
        <h3>Acciones</h3>
        <button class="btn-secondary" onclick={store.saveChanges} disabled={!store.hasUnsavedChanges}>
            {#if store.hasUnsavedChanges}
                {store.currentActivityId ? 'Actualizar' : 'Guardar Nueva'}
            {:else}
                Guardado ✓
            {/if}
        </button>
        <button class="btn-primary" onclick={store.downloadPdf}>Descargar PDF</button>
    </div>
</aside>

<style>
	.editor-sidebar { width: 280px;
 flex-shrink: 0; background-color: var(--bg-card); border-right: 1px solid var(--border-color); padding: 1.5rem; overflow-y: auto;
 display: flex; flex-direction: column; gap: 1rem;
 }
	.back-button { text-decoration: none; color: var(--text-light); font-weight: 600; display: flex; align-items: center; gap: 0.5rem;
 margin-bottom: 0rem; transition: color 0.2s ease;
 }
    .back-button svg { flex-shrink: 0; fill: none; stroke: currentColor;
 stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
 }
	.back-button:hover { color: var(--primary-color); }
	.history-controls { display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border-color);
 padding-bottom: 1rem; }
	.icon-button { width: 32px;
 height: 32px; display: flex; justify-content: center; align-items: center; padding: 0; background-color: var(--bg-section);
 border: 1px solid var(--border-color); color: var(--text-light); border-radius: 6px;
 cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;}
	.icon-button svg { fill: none;
 stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
 width: 18px; height: 18px;}
	.icon-button:hover:not(:disabled) { border-color: var(--primary-color); color: var(--primary-color); background-color: transparent;
 }
	.icon-button:disabled { opacity: 0.5; cursor: not-allowed;
 }
	.tool-section h3 { font-size: 1rem; font-weight: 700; color: var(--text-dark); margin: 0 0 1rem 0;
 padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color);
 }
	.editor-sidebar button:not(.icon-button), .editor-sidebar .btn-upload { width: 100%; text-align: center; padding: 0.6rem 1rem; font-size: 0.85rem;
 margin-bottom: 0.5rem;
 }
	.editor-sidebar input[type="file"] { display: none; }
	.prop-label { font-size: 0.85rem; font-weight: 600; color: var(--text-light); margin-top: 0.8rem; margin-bottom: 0.3rem;
 display: block;
 }
	.btn-delete { background-color: #f15e5e; color: white; border-color: #f15e5e; margin-top: 1rem; }
	.btn-delete:hover { background-color: #e53e3e; border-color: #e53e3e;
 }
	.actions { margin-top: auto;
 padding-top: 1.5rem; border-top: 1px solid var(--border-color); }
	.actions button:first-child { margin-bottom: 0.75rem;
 }
 .btn-secondary { display:inline-block; padding:0.5rem 0.8rem; margin-right:4px; margin-top:6px; }
</style>