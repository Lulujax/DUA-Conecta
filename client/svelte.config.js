import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),

		// --- Esta es la línea que soluciona el error ---
		prerender: {
			handleMissingId: 'ignore'
		}
	}
};

export default config;