import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// --- FUNCIÓN SEGURA PARA INICIALIZAR EL STORE ---
function createAuthStore() {
    let initialUser = null;

    // Solo intentamos leer localStorage si estamos en el navegador
    if (browser) {
        try {
            const storedUser = window.localStorage.getItem('user');
            if (storedUser) {
                initialUser = JSON.parse(storedUser);
            }
        } catch (error) {
            // Si JSON.parse falla (datos corruptos), lo ignoramos y dejamos initialUser = null
            console.error("Error al parsear usuario desde localStorage:", error);
            window.localStorage.removeItem('user'); // Limpiamos los datos corruptos
        }
    }

    const store = writable(initialUser);

    // Cada vez que el store del usuario cambie, actualizamos localStorage.
    store.subscribe((value) => {
        if (browser) {
            if (value) {
                window.localStorage.setItem('user', JSON.stringify(value));
            } else {
                window.localStorage.removeItem('user');
            }
        }
    });

    return store;
}

export const user = createAuthStore();