<script lang="ts">
    import { user } from '$lib/stores/auth';
    // --- AÑADIDO ---
    import { PUBLIC_API_URL } from '$env/static/public';

    let currentUser = { name: '', email: '', token: '' };
    user.subscribe(value => {
        if (value) {
            currentUser = value;
        }
    });
    let isLoading = false;
    let formMessage = '';
    let messageType = 'success';

    let oldPasswordFieldType = 'password';
    let newPasswordFieldType = 'password';
    let formData = {
        currentPassword: '',
        newPassword: ''
    };
    function toggleOldPassword() { oldPasswordFieldType = oldPasswordFieldType === 'password' ? 'text' : 'password'; }
    function toggleNewPassword() { newPasswordFieldType = newPasswordFieldType === 'password' ? 'text' : 'password'; }

    async function handleChangePassword() {
        isLoading = true;
        formMessage = '';

        // --- AÑADIDO: Validación básica de token ---
         if (!currentUser || !currentUser.token) {
             messageType = 'error';
             formMessage = "No estás autenticado.";
             isLoading = false;
             return;
         }

        try {
            // --- MODIFICADO ---
            const response = await fetch(`${PUBLIC_API_URL}/api/user/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser.token}`
                },
                body: JSON.stringify(formData)
            });

             if (!response.headers.get('content-type')?.includes('application/json')) {
                 throw new Error(`Respuesta inesperada del servidor. Código: ${response.status}`);
             }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ocurrió un error.');
            }

            messageType = 'success';
            formMessage = result.message;
            formData.currentPassword = '';
            formData.newPassword = '';

        } catch (error) {
            messageType = 'error';
             if (error instanceof SyntaxError && error.message.includes("JSON")) {
                 formMessage = "Respuesta inesperada del servidor.";
             } else if (error instanceof Error) {
                 formMessage = error.message;
             } else {
                 formMessage = "Ocurrió un error desconocido.";
             }
        } finally {
            isLoading = false;
        }
    }
</script>