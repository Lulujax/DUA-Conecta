<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  export let value: string = '';
  const dispatch = createEventDispatcher();

  let editor: HTMLDivElement | null = null;
  let isApplying = false;

  // Guard para evitar reentradas rápidas
  function applyList(type: 'ul' | 'ol') {
    if (!editor) return;
    if (isApplying) return;
    isApplying = true;

    // Asegurar foco en editor para que execCommand actúe correctamente
    editor.focus();

    // Ejecutar el comando correspondiente
    try {
      if (type === 'ul') {
        document.execCommand('insertUnorderedList');
      } else {
        document.execCommand('insertOrderedList');
      }
    } catch (e) {
      console.error('execCommand fallo:', e);
    }

    // Esperar a que el navegador aplique los cambios
    requestAnimationFrame(() => {
      // Sincroniza value con el contenido del editor
      value = editor!.innerHTML;
      dispatch('input', { value });

      // Pequeña espera para evitar reentradas instantáneas
      setTimeout(() => {
        isApplying = false;
      }, 0);
    });
  }

  function onInput() {
    // Si estamos aplicando un comando, no propagar update para evitar loops
    if (isApplying) return;
    if (!editor) return;
    value = editor.innerHTML;
    dispatch('input', { value });
  }

  onMount(() => {
    // Para debugging: si ves "mounted" repetido es señal de montajes múltiples
    console.log('Editor mounted');
  });
</script>

<div class="editor-toolbar">
  <!-- Usamos modificadores para prevenir burbujeo y default -->
  <button aria-label="Viñeta"
          on:click|preventDefault|stopPropagation={() => applyList('ul')}>
    • Viñeta
  </button>

  <button aria-label="Numeración"
          on:click|preventDefault|stopPropagation={() => applyList('ol')}>
    1. Numeración
  </button>
</div>

<div class="editor"
     contenteditable="true"
     bind:this={editor}
     on:input={onInput}
     on:paste|preventDefault={() => { /* opcional: manejar paste aquí */ }}>
  {@html value}
</div>

<style>
  .editor { min-height: 120px; border: 1px solid #ddd; padding: 8px; }
  .editor-toolbar { margin-bottom: 8px; }
  .editor-toolbar button { margin-right: 8px; }
</style>