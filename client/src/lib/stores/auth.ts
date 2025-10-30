import { writable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Crea un store de autenticación seguro que se sincroniza con localStorage.
 */
function createAuthStore() {
    let initialUser = null;

    // Solo intentamos leer localStorage si estamos en el navegador
    if (browser) {
        try {
            const storedUser = window.localStorage.getItem('user');
            
            // Verificamos que no sea null, undefined, o la cadena "undefined"
            if (storedUser && storedUser !== 'undefined' && storedUser !== 'null') {
                initialUser = JSON.parse(storedUser);
            }
        } catch (error) {
            // Si JSON.parse falla (datos corruptos), lo ignoramos y limpiamos
            console.error("Error al leer 'user' desde localStorage, limpiando:", error);
            window.localStorage.removeItem('user'); // Limpiamos los datos corruptos
            initialUser = null;
        }
    }

    // Creamos el store con el valor inicial (null si falla o no existe)
    const store = writable(initialUser);

    // Cada vez que el store del usuario cambie, actualizamos localStorage.
    store.subscribe((value) => {
        if (browser) {
            try {
                if (value) {
                    window.localStorage.setItem('user', JSON.stringify(value));
                } else {
                    window.localStorage.removeItem('user');
                }
            } catch (error) {
                console.error("Error al guardar 'user' en localStorage:", error);
            }
        }
    });

    return store;
}

// Exportamos la instancia única del store creado
export const user = createAuthStore();