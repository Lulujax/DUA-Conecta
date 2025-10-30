import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),

		// --- AÑADE ESTO ---
		prerender: {
			handleMissingId: 'ignore'
		}
		// --- FIN DE LO AÑADIDO ---
	}
};

export default config;