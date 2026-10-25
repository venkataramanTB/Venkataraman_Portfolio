import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Railway runs the app as a standalone Node server; Vercel needs its own
// serverless output. Pick the adapter from the build environment so the same
// commit deploys cleanly to either host.
const adapter = process.env.VERCEL ? adapterVercel() : adapterNode();

// Base path. Empty by default, so `npm run dev` and the Vercel deployment are
// both served from the root exactly as before.
//
// Set ADMIN_BASE_PATH=/admin at build time to mount the console under a path
// on another origin — which is how it rides along on the portfolio's Railway
// service instead of needing a service of its own. The value is baked in at
// build time: SvelteKit resolves every asset and route URL against it during
// prerender and bundling, so it cannot be a runtime variable.
// Normalised: accepts 'admin', '/admin' or '' and always yields either an
// empty string or a path with exactly one leading slash and no trailing one.
// SvelteKit rejects anything else outright.
const raw = (process.env.ADMIN_BASE_PATH ?? '').trim();
const base = raw ? `/${raw.replace(/^\/+|\/+$/g, '')}` : '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter,
    paths: { base },
  },
};

export default config;
