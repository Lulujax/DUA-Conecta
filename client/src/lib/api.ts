import { PUBLIC_API_URL } from '$env/static/public';

const BASE_URL = PUBLIC_API_URL || 'http://localhost:3000';

// 1. La lógica central (el motor)
const coreRequest = async (method: string, path: string, data?: any, token?: string) => {
    const opts: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data) {
        opts.body = JSON.stringify(data);
    }

    if (token) {
        (opts.headers as any)['Authorization'] = `Bearer ${token}`;
    }

    opts.credentials = 'include'; // Vital para cookies/sesión

    try {
        const res = await fetch(`${BASE_URL}${path}`, opts);
        const responseData = await res.json().catch(() => ({}));

        if (!res.ok) {
            return { error: responseData.error || `Error ${res.status}: ${res.statusText}` };
        }

        return responseData;
    } catch (e) {
        console.error("Error de red:", e);
        return { error: "Error de conexión con el servidor" };
    }
};

// 2. LA MAGIA HÍBRIDA
// Esto crea una variable 'api' que puede usarse de las dos formas:
// Forma A: api('GET', '/ruta')
// Forma B: api.post('/ruta', datos)

export const api = Object.assign(
    // Función principal (para compatibilidad con lo que te pasé antes)
    (method: string, path: string, data?: any, token?: string) => coreRequest(method, path, data, token),
    
    // Métodos extra (para que funcione api.post, api.get, etc.)
    {
        get: (path: string, token?: string) => coreRequest('GET', path, undefined, token),
        post: (path: string, data: any, token?: string) => coreRequest('POST', path, data, token),
        put: (path: string, data: any, token?: string) => coreRequest('PUT', path, data, token),
        delete: (path: string, token?: string) => coreRequest('DELETE', path, undefined, token),
    }
);