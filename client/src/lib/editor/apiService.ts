import { editorStore } from './editor.store.svelte';
import { api } from '$lib/api';
import { toast } from '$lib/stores/toast.svelte';

async function loadActivity(id: number) {
	try {
		const result = await api.get(`/api/activities/${id}`);
        // Verificación de seguridad
        if (result && result.activity) {
            const elements = result.activity.elements || [];
            editorStore.setLoadedActivity(result.activity.id, result.activity.name, elements);
        } else {
            throw new Error("Datos incompletos");
        }
	} catch (error) {
		console.error('Fallo al cargar:', error);
		toast.error('Error al cargar la actividad.');
		editorStore.resetToBase();
	}
}

async function saveChanges(templateId: string, previewImg: string | null = null) {
	const nameToSave = editorStore.activityName.trim(); 
    const currentId = editorStore.currentActivityId;

    if (!nameToSave) {
        toast.error("La actividad debe tener un nombre.");
        return;
    }

	const endpoint = currentId 
        ? `/api/activities/${currentId}`
        : `/api/activities/save`;
	
	const payload = editorStore.getActivityPayload(templateId);
    payload.name = nameToSave; 
    
    // @ts-ignore
    payload.previewImg = previewImg;

	try {
        const body = await (currentId 
            ? api.put(endpoint, payload)
            : api.post(endpoint, payload)
        );

		if (!currentId && body.activityId) {
			editorStore.setSavedAsNew(body.activityId, nameToSave);
		} else {
			editorStore.setChangesSaved();
		}
		
		toast.success(body.message || `¡Guardado con éxito!`);
        
	} catch (error) {
		console.error('Error guardando:', error);
        const msg = error instanceof Error ? error.message : 'Fallo al guardar';
		toast.error(msg);
	}
}

export const apiService = {
	loadActivity,
	saveChanges
};