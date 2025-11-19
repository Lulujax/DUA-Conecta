import { writable } from 'svelte/store';
import { api } from '$lib/api'; // Usamos nuestro nuevo cliente
import { browser } from '$app/environment';

interface User {
    name: string;
    email?: string;
    id?: number;
}

function createAuthStore() {
    const { subscribe, set, update } = writable<User | null>(null);

    return {
        subscribe,
        set,
        // Función para verificar sesión al cargar la app
        checkAuth: async () => {
            if (!browser) return;
            try {
                const res = await api.get('/auth/me');
                if (res.user) {
                    set(res.user);
                } else {
                    set(null);
                }
            } catch (e) {
                console.log("No hay sesión activa.");
                set(null);
            }
        },
        // Función de login (solo actualiza el store, la cookie ya la puso el navegador)
        loginSuccess: (userData: User) => {
            set(userData);
        },
        logout: async () => {
            try {
                await api.post('/auth/logout', {});
            } finally {
                set(null);
                if (browser) window.location.href = '/login';
            }
        }
    };
}

export const user = createAuthStore();