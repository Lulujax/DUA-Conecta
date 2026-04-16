import { PUBLIC_API_URL } from '$env/static/public';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    try {
        const response = await fetch(`${PUBLIC_API_URL}/templates`);

        if (!response.ok) {
            console.error('Error cargando plantillas (SSR):', response.status);
            return { allTemplates: [] };
        }

        const data = await response.json();

        return {
            allTemplates: data.templates ?? []
        };

    } catch (err) {
        console.error("Error de carga (SSR):", err);
        // Return empty list so the page still renders; client-side will retry
        return { allTemplates: [] };
    }
}