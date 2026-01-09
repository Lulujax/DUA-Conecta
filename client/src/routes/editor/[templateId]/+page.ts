import { error } from '@sveltejs/kit';
import { api } from '$lib/api'; 

// Función de carga (Server Load)
export const load = async ({ params }) => {
    // CORRECCIÓN VITAL: Leemos 'templateId' porque así llamaste a la carpeta [templateId]
    const id = params.templateId;

    console.log("🔍 Intentando cargar plantilla con ID:", id);

    if (!id) {
        throw error(400, 'ID de plantilla requerido');
    }

    try {
        // Petición al Backend
        const response = await api('GET', `/templates/${id}`);
        
        if (response.error) {
            console.error("❌ El backend respondió con error:", response.error);
            throw error(404, 'La plantilla no existe o no se pudo cargar');
        }

        // Si todo sale bien, retornamos los datos al componente Svelte
        return {
            template: response.template
        };

    } catch (err) {
        console.error("💥 Error de conexión en load:", err);
        throw error(500, 'Error conectando con el servidor para cargar la plantilla');
    }
};