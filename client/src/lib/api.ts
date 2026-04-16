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
    return localStorage.getItem(TOKEN_KEY);
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
        return json; // Retorna la respuesta del servidor (success, error, etc.)
    } catch (err) {
        console.error("API Error:", err);
        return { error: "Error de conexión con el servidor" };
    }
}

export const api = {
    get: (path: string) => send({ method: 'GET', path }),
    delete: (path: string) => send({ method: 'DELETE', path }),
    post: (path: string, data: any) => send({ method: 'POST', path, data }),
    put: (path: string, data: any) => send({ method: 'PUT', path, data })
};
