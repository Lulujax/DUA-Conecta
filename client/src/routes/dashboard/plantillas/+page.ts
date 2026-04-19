import { PUBLIC_API_URL } from '$env/static/public';

// Use the same URL resolution logic as api.ts so there's a single source of truth.
const API_BASE = PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    try {
        const response = await fetch(`${API_BASE}/templates`);

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