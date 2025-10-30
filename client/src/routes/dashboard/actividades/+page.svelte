<script lang="ts">
    import { onMount } from 'svelte';
    import { user } from '$lib/stores/auth';
    // --- AÑADIDO ---
    import { PUBLIC_API_URL } from '$env/static/public';

    let savedActivities: Array<any> = [];
    let isLoading = true;
    let fetchError: string | null = null;

    onMount(() => {
        fetchActivities();
    });

    async function fetchActivities() {
        isLoading = true;
        fetchError = null;

        const currentUser = $user;
        if (!currentUser || !currentUser.token) {
            isLoading = false;
            fetchError = "No estás autenticado."; // Mensaje más claro
            return;
        }

        try {
            // --- MODIFICADO ---
            const response = await fetch(`${PUBLIC_API_URL}/api/activities`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`
                }
            });

            // Verificamos si la respuesta es JSON antes de intentar parsearla
             if (!response.headers.get('content-type')?.includes('application/json')) {
                 throw new Error(`Respuesta inesperada del servidor. Código: ${response.status}`);
             }

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Ocurrió un error al cargar las actividades.');
            }

            savedActivities = result.activities;
        } catch (error) {
            console.error(error);
             if (error instanceof SyntaxError && error.message.includes("JSON")) {
                 fetchError = "Respuesta inesperada del servidor.";
             } else if (error instanceof Error) {
                 fetchError = error.message;
             } else {
                 fetchError = 'Error desconocido al conectar con el servidor.';
             }
        } finally {
            isLoading = false;
        }
    }

    function formatDate(dateString: string) {
        if (!dateString) return 'N/A';
        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    }
</script>