import { writable } from 'svelte/store';
import { api } from '$lib/api';
import { browser } from '$app/environment';

export interface User {
    name: string;
    email?: string;
    id?: number;
}

export const isAuthLoading = writable(true);

function createAuthStore() {
    // 1. Intentamos recuperar la sesión del navegador al iniciar
    let initialUser: User | null = null;
    if (browser) {
        try {
            const stored = localStorage.getItem('user_profile');
            if (stored) initialUser = JSON.parse(stored);
        } catch (e) {
            console.error("Error leyendo localStorage");
        }
    }

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
            
            try {
                const res = await api.get('/auth/me');
                if (res && res.user) {
                    // Sesión válida: Actualizamos datos frescos
                    set(res.user);
                    localStorage.setItem('user_profile', JSON.stringify(res.user));
                } else {
                    // Sesión inválida pero quizás teníamos datos viejos en local
                    // No lanzamos error para no romper la app, solo limpiamos silenciosamente
                    set(null);
                    localStorage.removeItem('user_profile');
                }
            } catch (e) {
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
            } catch(e) { /* ignorar error de red al salir */ }
            
            set(null);
            if (browser) {
                localStorage.removeItem('user_profile');
                window.location.href = '/login'; 
            }
        }
    };
}

export const user = createAuthStore();