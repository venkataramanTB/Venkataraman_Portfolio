import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// adapter-node: builds a standalone Node server for Railway.
		// It reads PORT and HOST from the environment at runtime.
		adapter: adapter(),
	},
};

export default config;
