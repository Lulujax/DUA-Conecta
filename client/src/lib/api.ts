import { browser } from '$app/environment';
import { PUBLIC_API_URL } from '$env/static/public';

const BASE_URL = PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';

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
        credentials: 'include' 
    };

    // Auto-read token from localStorage if not explicitly provided.
    // Most endpoints rely on this automatic injection; pass `token` explicitly
    // only when you need to override the stored token.
    const authToken = token || (browser ? localStorage.getItem(TOKEN_KEY) : null);

    if (data) {
        opts.headers = { 'Content-Type': 'application/json' };
        opts.body = JSON.stringify(data);
    }

    if (authToken) {
        // @ts-ignore
        opts.headers['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const res = await fetch(`${BASE_URL}${path}`, opts);
        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
            console.error("API Error: unexpected non-JSON response", res.status, await res.text().catch(() => ''));
            return { error: "Respuesta inválida del servidor", _status: res.status };
        }
        const json = await res.json();
        // Attach the HTTP status so callers can check it without re-fetching
        return { ...json, _status: res.status };
    } catch (err) {
        console.error("API Error:", err);
        return { error: "Error de conexión con el servidor", _status: 0 };
    }
}

export const api = {
    get: (path: string) => send({ method: 'GET', path }),
    delete: (path: string) => send({ method: 'DELETE', path }),
    post: (path: string, data: any) => send({ method: 'POST', path, data }),
    put: (path: string, data: any) => send({ method: 'PUT', path, data })
};