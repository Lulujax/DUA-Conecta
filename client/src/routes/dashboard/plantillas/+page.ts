import { error } from '@sveltejs/kit';
import { PUBLIC_API_URL } from '$env/static/public';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    try {
        const response = await fetch(`${PUBLIC_API_URL}/templates`);
        
        if (!response.ok) {
            throw error(response.status, 'No se pudieron cargar las plantillas');
        }

        const data = await response.json();
        
        // Devolvemos los datos para que la página (+page.svelte) los use
        return {
            allTemplates: data.templates
        };

    } catch (err) {
        console.error("Error de carga:", err);
        throw error(500, 'Error de conexión con el servidor');
    }
}