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
	import { muted, toggleMute, play } from '$lib/sound.js';

	let ChatWidget = null;
	let Companion = null;
	let stopTheme;

	onMount(async () => {
		// Substrate first: syncs the store with what app.html already applied
		// before paint, then tracks OS and cross-tab changes.
		stopTheme = initTheme();

		// Both the assistant and the guide are secondary affordances — neither
		// belongs on the critical path for first paint.
		const [chat, companion] = await Promise.all([
			import('$lib/components/ChatWidget.svelte'),
			import('$lib/character/Companion.svelte')
		]);
		ChatWidget = chat.default;
		Companion = companion.default;
	});

	onDestroy(() => stopTheme?.());
</script>

<!-- The grid, drawn one shade up from the field. Fixed and inert: it is a
     description of the column structure the layout actually uses, not a
     decoration laid over it. -->
<div class="guides" aria-hidden="true">
	<div class="guides-inner">
		{#each Array(24) as _, i}
			<span class="guide-col" class:guide-extra={i >= 4}></span>
		{/each}
	</div>
</div>

<slot />

<!-- Sound is opt-in and starts muted, so this is the only way it ever turns
     on. Bottom-right, out of the character's lane on the left. -->
<button
	class="sound no-print"
	on:click={() => {
		const nowMuted = toggleMute();
		if (nowMuted) play('back');
	}}
	aria-pressed={!$muted}
	title={$muted ? 'Turn sound on' : 'Turn sound off'}
	aria-label={$muted ? 'Turn sound on' : 'Turn sound off'}
>
	{#if $muted}
		<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M11 5 6 9H3v6h3l5 4z" />
			<path d="M17 9l4 6M21 9l-4 6" />
		</svg>
	{:else}
		<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M11 5 6 9H3v6h3l5 4z" />
			<path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
		</svg>
	{/if}
</button>

{#if ChatWidget}
	<svelte:component this={ChatWidget} />
{/if}

{#if Companion}
	<svelte:component this={Companion} />
{/if}

<style>
	/* The guide count has to match --cols, which steps down on narrow
	   screens; the extras simply stop being drawn. */
	.guide-extra {
		display: none;
	}
	@media (min-width: 34.0625rem) {
		.guides-inner .guide-col:nth-child(-n + 6) {
			display: block;
		}
	}
	@media (min-width: 60.0625rem) {
		.guides-inner .guide-col:nth-child(-n + 12) {
			display: block;
		}
	}

	.sound {
		position: fixed;
		right: max(1rem, env(safe-area-inset-right));
		bottom: calc(max(1rem, env(safe-area-inset-bottom)) + 3.5rem);
		z-index: var(--z-overlay);
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--r-full);
		border: 1.5px solid var(--ink);
		background: var(--field);
		color: var(--ink);
		box-shadow: var(--e1);
		cursor: pointer;
		transition: transform 140ms var(--ease-out), box-shadow 140ms var(--ease-out);
	}
	.sound:hover {
		transform: translate(-1px, -1px);
		box-shadow: var(--e2);
	}
	.sound:active {
		transform: translate(3px, 3px);
		box-shadow: 0 0 0 var(--shadow-ink);
	}
	.sound[aria-pressed='true'] {
		background: var(--ink);
		color: var(--field);
	}

	@media (prefers-reduced-motion: reduce) {
		.sound:hover,
		.sound:active {
			transform: none;
		}
	}
</style>
