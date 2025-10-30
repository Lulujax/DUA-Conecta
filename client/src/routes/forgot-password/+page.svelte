<script lang="ts">
    // --- AÑADIDO ---
    import { PUBLIC_API_URL } from '$env/static/public';

    let isLoading = false;
    let emailSent = false;
    let formError = '';
    let email = '';

    async function handleSubmit() {
        isLoading = true;
        formError = '';

        try {
            // --- MODIFICADO ---
            const response = await fetch(`${PUBLIC_API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email }),
            });
            const result = await response.json();

            if (!response.ok) {
                 if (!response.headers.get('content-type')?.includes('application/json')) {
                     // No mostramos error específico aquí por seguridad, pero podrías loggearlo
                     console.error(`Error inesperado del servidor: ${response.status}`);
                     // Mantenemos la lógica de seguridad original:
                     emailSent = true; // Siempre muestra éxito
                     return; // Salimos temprano
                 }
                // Incluso si hay error JSON conocido, mostramos éxito por seguridad
                console.warn("Error API forgot-password:", result.error);
                // throw new Error(result.error || 'Ocurrió un error en el servidor.'); // Original, pero menos seguro
                emailSent = true; // Por seguridad, siempre muestra éxito
            } else {
                 // Éxito real
                 emailSent = true;
            }

        } catch (error) {
            // Incluso si hay un error de fetch, por seguridad mostramos éxito.
             console.error("Fetch error en forgot-password:", error);
            emailSent = true;
        } finally {
            isLoading = false;
        }
    }
</script>