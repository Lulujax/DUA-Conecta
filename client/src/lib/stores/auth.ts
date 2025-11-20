import { writable } from 'svelte/store';
import { api } from '$lib/api';
import { browser } from '$app/environment';

interface User {
    name: string;
    email?: string;
    id?: number;
    // No guardamos el token aquí, solo info de perfil
}

export const isAuthLoading = writable(true);

function createAuthStore() {
    // 1. Intentamos recuperar la sesión del navegador al iniciar
    let initialUser = null;
    if (browser) {
        try {
            const stored = localStorage.getItem('user_profile');
            if (stored) initialUser = JSON.parse(stored);
        } catch (e) {
            console.error("Error leyendo localStorage");
        }
    }

    // Si encontramos usuario en localStorage, ya no estamos "cargando" (isAuthLoading = false)
    // Esto evita el parpadeo o la expulsión al login.
    if (initialUser) {
        isAuthLoading.set(false);
    }

    const { subscribe, set } = writable<User | null>(initialUser);

    return {
        subscribe,
        set,
        
        // Verificar sesión real con el servidor (Cookie)
        checkAuth: async () => {
            if (!browser) return;
            // No ponemos isAuthLoading a true aquí si ya tenemos usuario local
            // para evitar que la UI parpadee. Lo hacemos silencioso.
            
            try {
                const res = await api.get('/auth/me');
                if (res.user) {
                    // Sesión válida: Actualizamos datos frescos
                    set(res.user);
                    localStorage.setItem('user_profile', JSON.stringify(res.user));
                } else {
                    // Sesión inválida: Limpiamos
                    throw new Error("Sesión expirada");
                }
            } catch (e) {
                // Si falla la cookie, borramos todo y ahí sí expulsamos
                set(null);
                localStorage.removeItem('user_profile');
            } finally {
                isAuthLoading.set(false);
            }
        },

        loginSuccess: (userData: User) => {
            set(userData);
            if (browser) {
                localStorage.setItem('user_profile', JSON.stringify(userData));
            }
            isAuthLoading.set(false);
        },
        
        logout: async () => {
            try {
                await api.post('/auth/logout', {});
            } finally {
                set(null);
                if (browser) {
                    localStorage.removeItem('user_profile');
                    window.location.href = '/login';
                }
            }
        }
    };
}

export const user = createAuthStore();