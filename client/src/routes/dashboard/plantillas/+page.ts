import { error } from '@sveltejs/kit';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    try {
        const response = await fetch(`${API_URL}/templates`);
        
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