/** @type {import('./$types').PageLoad} */
export async function load() {
    // Devolvemos un objeto vacío intencionalmente.
    // La carga de datos se hará en el componente (+page.svelte) 
    // para garantizar que las cookies del navegador se envíen correctamente.
    return {};
}