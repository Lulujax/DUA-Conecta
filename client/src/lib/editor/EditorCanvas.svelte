<script lang="ts">
	import Draggable from '$lib/editor/Draggable.svelte';
	let { store } = $props<any>();
</script>

<div 
    class="canvas-container" 
    onmousedown={store.deselect} 
    ondragover={store.handleDragOver}
    ondrop={store.handleDrop}
    bind:this={store.canvasContainerRef}
>
    {#each store.elements as element (element.id)}
        <Draggable
            data-element-id={element.id}
            element={element}
            isSelected={element.id === store.selectedElementId}
            onSelect={store.selectElement}
            onUpdate={store.updateElement}
            allElements={store.elements}
            onShowSnapLine={store.handleShowSnapLine} />
    {/each}
    
    {#if store.verticalSnapLine !== null}
        <div class="snap-line vertical" style:left="{store.verticalSnapLine}px"></div>
    {/if}
    {#if store.horizontalSnapLine !== null}
        <div class="snap-line horizontal" style:top="{store.horizontalSnapLine}px"></div>
    {/if}
</div>

<style>
    .canvas-container { 
        position: relative; 
        width: 700px; 
        height: 990px; 
        background-color: white;
        box-shadow: 0 10px 30px rgba(0,0,0,0.15); 
        overflow: hidden; 
        border: 1px solid #ccc; 
        flex-shrink: 0;
    }
    .snap-line { 
        position: absolute; 
        background-color: #ff4d4d; 
        z-index: 10000; 
        pointer-events: none;
    }
    .snap-line.vertical { width: 1px; height: 100%; top: 0; }
    .snap-line.horizontal { height: 1px; width: 100%; left: 0; }
</style>