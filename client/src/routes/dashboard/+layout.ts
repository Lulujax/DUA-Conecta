import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';

// Esta función se ejecuta en el servidor y en el navegador ANTES de que la página se cargue.
export function load() {
  if (browser) {
    // Buscamos la información del usuario en localStorage.
    const user = localStorage.getItem('user');
    
    // Si no hay usuario, lo redirigimos a la página de login.
    if (!user) {
      throw redirect(307, '/login');
    }
  }
}