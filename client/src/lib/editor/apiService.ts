// src/lib/editor/apiService.ts
import { PUBLIC_API_URL } from '$env/static/public';
import { editorStore } from './editor.store.svelte';

/**
 * Carga una actividad guardada desde la API.
 * Actualiza el store si tiene éxito, o resetea el store si falla.
 */
async function loadActivity(id: number, token: string) {
	if (!token) {
		alert("No autenticado. Imposible cargar actividad.");
		return;
	}

	try {
		const response = await fetch(`${PUBLIC_API_URL}/api/activities/${id}`, {
			method: 'GET',
			headers: { 'Authorization': `Bearer ${token}` }
		});
		if (!response.headers.get('content-type')?.includes('application/json')) {
				throw new Error(`Respuesta inesperada del servidor. Código: ${response.status}`);
		}
		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.error || 'Error al cargar la actividad.');
		}
		
		// --- Éxito: Usar el store para setear los datos cargados ---
		editorStore.setLoadedActivity(result.activity.id, result.activity.name, result.activity.elements);
		
	} catch (error) {
		console.error('Fallo al cargar la actividad:', error);
		let errorMsg = 'Error al cargar la actividad guardada.';
			if (error instanceof SyntaxError) {
				errorMsg += " Respuesta inesperada del servidor.";
		} else if (error instanceof Error) {
				errorMsg += ` ${error.message}`;
		}
		alert(`${errorMsg} Se ha cargado la plantilla base.`);
		// --- Fracaso: Usar el store para resetear ---
		editorStore.resetToBase();
	}
}

/**
 * Guarda o actualiza una actividad en la API.
 * Lee el estado actual desde el store.
 */
async function saveChanges(token: string, templateId: string) {
	if (!token) {
		alert("No estás autenticado. Por favor, inicia sesión.");
		return;
	}
	
	let targetUrl: string;
	let method: 'POST' | 'PUT';
	
	// Lee el estado actual desde el store
	const currentId = editorStore.currentActivityId;
	let nameToSave = editorStore.activityName.trim();

	if (currentId) {
		targetUrl = `${PUBLIC_API_URL}/api/activities/${currentId}`;
		method = 'PUT';
	} else {
		const inputName = prompt("Ingresa un nombre para guardar tu nueva actividad:", nameToSave);
		if (!inputName || inputName.trim() === "") {
			alert("El guardado fue cancelado. Debes proporcionar un nombre.");
			return;
		}
		nameToSave = inputName.trim();
		targetUrl = `${PUBLIC_API_URL}/api/activities/save`;
		method = 'POST';
	}

	// --- Usar el store para obtener el payload ---
	const payload = editorStore.getActivityPayload(templateId);
	payload.name = nameToSave; // Asegurarse de que el nombre actualizado se use

	try {
		const response = await fetch(targetUrl, {
			method: method,
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify(payload),
		});

		if (!response.headers.get('content-type')?.includes('application/json')) {
				throw new Error(`Respuesta inesperada del servidor. Código: ${response.status}`);
		}
		const body = await response.json();
		
		if (!response.ok) {
			throw new Error(body.error || `Error ${method === 'PUT' ? 'al actualizar' : 'al guardar'} la actividad.`);
		}

		// --- Usar el store para actualizar estado post-guardado ---
		if (method === 'POST' && body.activityId) {
			editorStore.setSavedAsNew(body.activityId, nameToSave);
		} else {
			editorStore.setChangesSaved();
			editorStore.updateActivityName(nameToSave); // Actualizar nombre si cambió
		}
		
		alert(body.message || `¡Actividad "${nameToSave}" guardada con éxito!`);
	} catch (error) {
		console.error('Error en el guardado:', error);
		let errorMsg = 'Fallo al guardar/actualizar la actividad:';
			if (error instanceof SyntaxError) {
				errorMsg += " Respuesta inesperada del servidor.";
		} else if (error instanceof Error) {
				errorMsg += ` ${error.message}`;
		}
		alert(errorMsg);
	}
}

// Exportamos las funciones en un objeto servicio
export const apiService = {
	loadActivity,
	saveChanges
};