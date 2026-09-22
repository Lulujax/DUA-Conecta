import { browser } from '$app/environment';
import { PUBLIC_API_URL } from '$env/static/public';

const BASE_URL = PUBLIC_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TOKEN_KEY = 'auth_token';

export const API_BASE_URL = BASE_URL;

type SendOptions = {
	method: string;
	path: string;
	data?: any;
	token?: string;
};

async function send({ method, path, data, token }: SendOptions): Promise<any> {
	const headers: Record<string, string> = {};

	if (data) {
		headers['Content-Type'] = 'application/json';
	}

	// Lee el token almacenado automáticamente si no se pasa uno explícito.
	// La mayoría de endpoints dependen de esta inyección; pasa `token` solo
	// cuando necesites sobreescribir el token guardado.
	const authToken = token || (browser ? localStorage.getItem(TOKEN_KEY) : null);
	if (authToken) {
		headers['Authorization'] = `Bearer ${authToken}`;
	}

	const opts: RequestInit = {
		method,
		headers,
		credentials: 'include',
		body: data ? JSON.stringify(data) : undefined
	};

	try {
		const res = await fetch(`${BASE_URL}${path}`, opts);
		const status = res.status;
		const contentType = res.headers.get('content-type') ?? '';
		if (!contentType.includes('application/json')) {
			console.error('API Error: respuesta no JSON', status, await res.text().catch(() => ''));
			return { error: 'Respuesta inválida del servidor', status, _status: status };
		}

		const json = await res.json();
		// `status` y `_status` son el mismo valor; se exponen ambos para
		// compatibilidad con el código existente que usa cualquiera de los dos.
		if (!res.ok) {
			return { error: json.error || `Error HTTP ${status}`, status, _status: status };
		}
		return { ...json, status, _status: status };
	} catch (err) {
		console.error('API Error:', err);
		return { error: 'Error de conexión con el servidor', status: 0, _status: 0 };
	}
}

export const api = {
	get: (path: string) => send({ method: 'GET', path }),
	delete: (path: string) => send({ method: 'DELETE', path }),
	post: (path: string, data: any) => send({ method: 'POST', path, data }),
	put: (path: string, data: any) => send({ method: 'PUT', path, data })
};