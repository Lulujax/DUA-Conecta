<script lang="ts">
    import { goto } from '$app/navigation';
    // --- AÑADIDO ---
    import { PUBLIC_API_URL } from '$env/static/public';

    let isLoading = false;
    let passwordFieldType = 'password';
    let confirmPasswordFieldType = 'password';
    let formError = '';
    let formData = {
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    };

    function togglePasswordVisibility() {
        passwordFieldType = passwordFieldType === 'password' ? 'text' : 'password';
    }

    function toggleConfirmPasswordVisibility() {
        confirmPasswordFieldType = confirmPasswordFieldType === 'password' ? 'text' : 'password';
    }

    async function handleSubmit() {
        isLoading = true;
        formError = '';

        if (formData.password !== formData.confirmPassword) {
            formError = 'Las contraseñas no coinciden.';
            isLoading = false;
            return;
        }

        try {
            // --- MODIFICADO ---
            const response = await fetch(`${PUBLIC_API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });
            const result = await response.json();

            if (!response.ok) {
                 if (!response.headers.get('content-type')?.includes('application/json')) {
                     throw new Error(`Error inesperado del servidor. Código: ${response.status}`);
                 }
                throw new Error(result.error || 'Ocurrió un error al registrar el usuario.');
            }
            // Si el registro es exitoso, podrías querer hacer login automáticamente
            // o redirigir a login. Por ahora, redirigimos a dashboard
            // (asumiendo que el backend retorna token o algo similar si hace autologin)
            // Si NO hace autologin, mejor redirigir a /login con un mensaje.
            // Por simplicidad, asumiremos que no hay autologin y redirige a login:
             alert('¡Registro exitoso! Ahora puedes iniciar sesión.'); // Mensaje temporal
             await goto('/login');
            // await goto('/dashboard'); // Descomentar si el backend hace autologin tras registro

        } catch (error) {
             if (error instanceof SyntaxError && error.message.includes("JSON")) {
                 formError = "Respuesta inesperada del servidor. Intenta de nuevo más tarde.";
             } else if (error instanceof Error) {
                 formError = error.message;
             } else {
                 formError = "Ocurrió un error desconocido.";
             }
        } finally {
            isLoading = false;
        }
    }
</script>