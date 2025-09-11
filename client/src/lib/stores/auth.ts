import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Este store guardará la información del usuario (token, nombre, etc.)
// Lo inicializamos con los datos de localStorage para mantener la sesión entre recargas.
const initialValue = browser ? window.localStorage.getItem('user') : null;
export const user = writable(initialValue ? JSON.parse(initialValue) : null);

// Cada vez que el store del usuario cambie, actualizamos localStorage.
user.subscribe((value) => {
  if (browser) {
    if (value) {
      window.localStorage.setItem('user', JSON.stringify(value));
    } else {
      window.localStorage.removeItem('user');
    }
  }
});