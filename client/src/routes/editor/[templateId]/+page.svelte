<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import TemplateEditor from '$lib/components/TemplateEditor.svelte';
    // Importamos el Loader que acabamos de asegurar
    import Loader from '$lib/components/ui/Loader.svelte';
    // Importamos la API para hablar con el backend
    import { api } from '$lib/api';

    // Obtenemos los IDs de la URL
    const templateId = $page.params.templateId;
    const activityIdParam = $page.url.searchParams.get('activityId');

    // Estado: Empezamos sin datos (null) y cargando (true)
    let baseElements = null;
    let isLoading = true;
    let errorMsg = '';

    onMount(async () => {
        console.log("🔌 Iniciando editor para plantilla:", templateId);
        try {
            // 1. Pedir la estructura de la plantilla a la DB
            const templateRes = await api.get(`/templates/${templateId}`);
            
            if (!templateRes.template) {
                throw new Error("Plantilla no encontrada en la base de datos.");
            }

            console.log("✅ Plantilla base cargada:", templateRes.template.name);

            // 2. Decidir qué cargar: ¿Es una edición vieja o una nueva?
            if (activityIdParam) {
                console.log("✏️ Cargando actividad guardada ID:", activityIdParam);
                try {
                    const activityRes = await api.get(`/api/activities/${activityIdParam}`);
                    if (activityRes.activity) {
                        baseElements = activityRes.activity.elements;
                    }
                } catch (e) {
                    console.warn("⚠️ Falló cargar actividad guardada, usando base.");
                    baseElements = templateRes.template.base_elements;
                }
            } else {
                // Es nueva: usamos los elementos base de la plantilla
                baseElements = templateRes.template.base_elements;
            }

        } catch (err) {
            console.error("❌ Error fatal cargando editor:", err);
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
        <h2>Ups 😢</h2>
        <p>{errorMsg}</p>
        <a href="/dashboard/plantillas" class="btn-back">Volver a la biblioteca</a>
    </div>
{:else if baseElements}
    <TemplateEditor {templateId} {baseElements} />
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