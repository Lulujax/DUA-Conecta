import { error } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch, url }) {
    const { templateId } = params;
    
    // Chequeamos si es una edición de actividad existente o una nueva desde plantilla
    const activityId = url.searchParams.get('activityId');

    try {
        // 1. Pedimos la plantilla Base (Siempre necesaria)
        const response = await fetch(`${PUBLIC_API_URL}/templates/${templateId}`);
        if (!response.ok) throw error(404, 'Plantilla no encontrada');
        const data = await response.json();
        
        // Devolvemos los datos listos
        return {
            templateId,
            baseElements: data.template.base_elements,
            // Pasamos query params útiles
            activityId: activityId ? parseInt(activityId) : null,
            activityName: url.searchParams.get('name')
        };

    } catch (err) {
        console.error("Error cargando editor:", err);
        throw error(404, 'No se pudo cargar el editor');
    }
}