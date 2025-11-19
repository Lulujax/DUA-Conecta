import { PUBLIC_API_URL } from '$env/static/public';

type FetchOptions = RequestInit & {
    token?: string; // Por si queremos forzar un token manual (raro ahora)
};

async function request(endpoint: string, options: FetchOptions = {}) {
    const url = `${PUBLIC_API_URL}${endpoint}`;

    const headers = new Headers(options.headers);
    
    // Configuración por defecto
    headers.set('Content-Type', 'application/json');

    // NOTA: Ya no enviamos 'Authorization: Bearer ...' automáticamente
    // porque confiamos en la cookie. 

    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include', // <--- LA CLAVE: Envía las cookies al backend
    };

    const response = await fetch(url, config);

    // Manejo básico de errores
    if (!response.ok) {
        // Si es 401 (No autorizado), podríamos disparar un logout aquí
        if (response.status === 401) {
            // Opcional: window.location.href = '/login';
        }
        
        // Intentamos leer el error del JSON
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

export const api = {
    get: (endpoint: string) => request(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: any) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint: string, body: any) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),
};