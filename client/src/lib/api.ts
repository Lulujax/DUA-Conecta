import { error } from '@sveltejs/kit';

// Detecta la URL de la API: Si hay variable de entorno la usa, si no, localhost.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type SendOptions = {
    method: string;
    path: string;
    data?: any;
    token?: string;
}

async function send({ method, path, data, token }: SendOptions) {
    const opts: RequestInit = { 
        method, 
        headers: {},
        // --- ESTA ES LA CLAVE PARA QUE EL LOGIN FUNCIONE ---
        credentials: 'include' 
    };

    if (data) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(data);
    }

    if (token) {
        // @ts-ignore
        opts.headers['Authorization'] = `Bearer ${token}`;
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