import { writable } from 'svelte/store';
import { api } from '$lib/api';
import { browser } from '$app/environment';

export interface User {
    name: string;
    email?: string;
    id?: number;
    token?: string;
}

export const isAuthLoading = writable(true);
const PROFILE_KEY = 'user_profile';
const TOKEN_KEY = 'auth_token';

function createAuthStore() {
    // 1. Intentamos recuperar la sesión del navegador al iniciar
    let initialUser: User | null = null;
    if (browser) {
        try {
            const stored = localStorage.getItem(PROFILE_KEY);
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
                    localStorage.setItem(PROFILE_KEY, JSON.stringify(res.user));
                } else {
                    // Sesión inválida pero quizás teníamos datos viejos en local
                    // No lanzamos error para no romper la app, solo limpiamos silenciosamente
                    set(null);
                    localStorage.removeItem(PROFILE_KEY);
                    localStorage.removeItem(TOKEN_KEY);
                }
            } catch (e) {
                set(null);
                localStorage.removeItem(PROFILE_KEY);
                localStorage.removeItem(TOKEN_KEY);
            } finally {
                isAuthLoading.set(false);
            }
        },

        loginSuccess: (userData: User, token?: string) => {
            set(userData);
            if (browser) {
                localStorage.setItem(PROFILE_KEY, JSON.stringify(userData));
                if (token) {
                    localStorage.setItem(TOKEN_KEY, token);
                }
            }
            isAuthLoading.set(false);
        },
        
        logout: async (redirectTo: string = '/login') => {
            try {
                await api.post('/auth/logout', {});
            } catch(e) { /* ignorar error de red al salir */ }
            
            set(null);
            if (browser) {
                localStorage.removeItem(PROFILE_KEY);
                localStorage.removeItem(TOKEN_KEY);
                window.location.href = redirectTo;
            }
        }
    };
}

export const user = createAuthStore();
