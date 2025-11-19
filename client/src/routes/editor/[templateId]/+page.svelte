<script lang="ts">
    import { onMount } from 'svelte';
    import TemplateEditor from '$lib/components/TemplateEditor.svelte';
    
    // Recibimos los datos YA CARGADOS desde +page.ts
    /** @type {import('./$types').PageData} */
    export let data;

    // Desestructuramos los datos limpios
    let { templateId, baseElements } = data;
</script>

<svelte:head>
    <title>Editor - DUA-Conecta</title>
</svelte:head>

<TemplateEditor {templateId} {baseElements} />