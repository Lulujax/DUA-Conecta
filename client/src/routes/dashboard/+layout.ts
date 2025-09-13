import { redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';

// Esta función se ejecuta ANTES de que la página del dashboard se cargue.
export function load() {
  // POR AHORA, HEMOS COMENTADO LA LÓGICA DE REDIRECCIÓN PARA DEPURAR EL DISEÑO.
  // Una vez que confirmemos que el dashboard se ve bien, podemos descomentar esto.
  /*
  if (browser) {
    // Buscamos la información del usuario en localStorage.
    const user = localStorage.getItem('user');
    
    // Si no hay usuario, lo redirigimos a la página de login.
    if (!user) {
      throw redirect(307, '/login');
    }
  }
  */
}