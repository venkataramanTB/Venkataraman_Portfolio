<script>
	/**
	 * Root layout.
	 *
	 * Deliberately thin. The previous layout painted fixed decorative grid
	 * guides, corner registration marks, a global noise film and a custom
	 * cursor on every page. All four are gone:
	 *
	 *  - the guides and registration marks belonged to the print system this
	 *    redesign replaced;
	 *  - a full-viewport noise overlay costs a composited layer on every
	 *    scroll frame for a texture nobody is looking at;
	 *  - a custom cursor replaces a control the operating system already
	 *    tuned, breaks the platform convention a reader relies on, and is the
	 *    first thing that reads as a portfolio template.
	 *
	 * What's left: the stylesheet, the theme lifecycle, and the deferred
	 * assistant.
	 */
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { initTheme } from '$lib/theme.js';

	let ChatWidget = null;
	let stopTheme;

	onMount(async () => {
		// Substrate first: syncs the store with what app.html already applied
		// before paint, then tracks OS and cross-tab changes.
		stopTheme = initTheme();

		// The assistant is a secondary affordance — it must not sit on the
		// critical path for first paint.
		const mod = await import('$lib/components/ChatWidget.svelte');
		ChatWidget = mod.default;
	});

	onDestroy(() => stopTheme?.());
</script>

<slot />

{#if ChatWidget}
	<svelte:component this={ChatWidget} />
{/if}
