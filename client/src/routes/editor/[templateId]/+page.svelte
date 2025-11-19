<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import TemplateEditor from '$lib/components/TemplateEditor.svelte';
    import Loader from '$lib/components/ui/Loader.svelte';
    import { api } from '$lib/api';

    // Obtenemos parámetros de la URL
    const templateId = $page.params.templateId;
    const activityIdParam = $page.url.searchParams.get('activityId');
    const activityNameParam = $page.url.searchParams.get('name');

    let baseElements = null;
    let isLoading = true;
    let errorMsg = '';

    onMount(async () => {
        try {
            // 1. Cargar la plantilla base (SIEMPRE NECESARIA)
            const templateRes = await api.get(`/templates/${templateId}`);
            if (!templateRes.template) throw new Error("Plantilla no encontrada");

            // 2. Si estamos editando una actividad existente, cargar sus datos
            if (activityIdParam) {
                const activityRes = await api.get(`/api/activities/${activityIdParam}`);
                if (activityRes.activity) {
                    // Mezclar datos: usamos los elementos guardados
                    baseElements = activityRes.activity.elements;
                }
            } else {
                // Es nueva: usamos los elementos base de la plantilla
                baseElements = templateRes.template.base_elements;
            }

        } catch (err) {
            console.error("Error cargando editor:", err);
            errorMsg = "No se pudo cargar el editor. Verifica tu conexión.";
        } finally {
            isLoading = false;
        }
    });
</script>

<svelte:head>
    <title>Editor - DUA-Conecta</title>
</svelte:head>

{#if isLoading}
    <Loader />
{:else if errorMsg}
    <div class="error-screen">
        <h2>Ups</h2>
        <p>{errorMsg}</p>
        <a href="/dashboard/plantillas">Volver</a>
    </div>
{:else if baseElements}
    <TemplateEditor {templateId} {baseElements} />
{/if}

<style>
    .error-screen { 
        height: 100vh; display: flex; flex-direction: column; 
        align-items: center; justify-content: center; gap: 1rem; 
    }
    a { color: var(--primary-color); font-weight: bold; }
</style>