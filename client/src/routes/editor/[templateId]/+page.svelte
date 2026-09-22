<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import TemplateEditor from '$lib/components/TemplateEditor.svelte';
    import Loader from '$lib/components/ui/Loader.svelte';
    import { api } from '$lib/api';

    // Estado local reactivo
    let baseElements = $state(null);
    let isLoading = $state(true);
    let errorMsg = $state('');
    
    // Reactividad: Observamos el ID de la URL
    let currentTemplateId = $derived($page.params.templateId as string);
    let currentActivityId = $derived($page.url.searchParams.get('activityId'));

    async function loadEditorData(tId: string, aId: string | null) {
        isLoading = true;
        errorMsg = '';
        baseElements = null; // Limpiar visualmente
        
        console.log("🔌 Iniciando carga para:", tId, "Actividad:", aId);

        try {
            // 1. Cargar Plantilla Base
            const templateRes = await api.get(`/templates/${tId}`);
            if (!templateRes.template) {
                throw new Error("Plantilla no encontrada en la base de datos.");
            }

            // 2. Decidir qué cargar
            if (aId) {
                const activityRes = await api.get(`/api/activities/${aId}`);
                if (activityRes.activity) {
                    baseElements = activityRes.activity.elements;
                } else if (activityRes.status === 404) {
                    // Actividad inexistente o de otro usuario: avisar, no abrir editor vacío
                    errorMsg = "La actividad no existe o no tienes acceso a ella.";
                } else {
                    // Error de red/servidor al cargar la actividad: usar la plantilla base
                    console.warn("Usando plantilla base por error al cargar actividad", activityRes);
                    baseElements = structuredClone(templateRes.template.base_elements);
                }
            } else {
                // CLAVE: structuredClone rompe la referencia para que no se mezclen
                baseElements = structuredClone(templateRes.template.base_elements);
            }
        } catch (err) {
            console.error("Error cargando editor:", err);
            errorMsg = "No se pudo cargar el editor. Verifica tu conexión.";
        } finally {
            isLoading = false;
        }
    }

    // Efecto que se dispara cada vez que cambia el ID
    $effect(() => {
        if (currentTemplateId) {
            loadEditorData(currentTemplateId, currentActivityId);
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
        <h2>Ups 😢</h2>
        <p>{errorMsg}</p>
        <a href="/dashboard/plantillas" class="btn-back">Volver a la biblioteca</a>
    </div>
{:else if baseElements}
    {#key currentTemplateId + (currentActivityId || '')}
        <TemplateEditor templateId={currentTemplateId} baseElements={baseElements} />
    {/key}
{/if}

<style>
    .error-screen { 
        height: 100vh;
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        gap: 1rem; 
        text-align: center;
    }
    .btn-back { 
        color: white; 
        background-color: var(--primary-color);
        padding: 0.8rem 1.5rem;
        border-radius: 50px;
        text-decoration: none; 
        font-weight: bold; 
    }
</style>