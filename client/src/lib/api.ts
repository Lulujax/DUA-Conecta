import { browser } from '$app/environment';

// Detecta la URL de la API: Si hay variable de entorno la usa, si no, localhost.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';

type SendOptions = {
    method: string;
    path: string;
    data?: any;
    token?: string;
}

function getStoredToken() {
    if (!browser) return null;
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
        console.warn('No se pudo acceder a localStorage.', error);
        return null;
    }
}

async function send({ method, path, data, token }: SendOptions) {
    const headers: Record<string, string> = {};
    const resolvedToken = token || getStoredToken();

    if (data) {
        headers['Content-Type'] = 'application/json';
    }

    if (resolvedToken) {
        headers['Authorization'] = `Bearer ${resolvedToken}`;
    }

    const opts: RequestInit = {
        method,
        headers,
        credentials: 'include'
    };

    if (data) {
        opts.body = JSON.stringify(data);
    }

    try {
        const res = await fetch(`${BASE_URL}${path}`, opts);
        const json = await res.json();
        if (!res.ok) {
            throw new Error(json?.error || 'Error en la solicitud');
        }
        return json;
    } catch (err) {
        console.error("API Error:", err);
        throw err;
    }
}

export const api = {
    get: (path: string) => send({ method: 'GET', path }),
    delete: (path: string) => send({ method: 'DELETE', path }),
    post: (path: string, data: any) => send({ method: 'POST', path, data }),
    put: (path: string, data: any) => send({ method: 'PUT', path, data })
};
