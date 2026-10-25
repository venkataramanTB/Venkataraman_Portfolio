<script>
	/**
	 * Section header. One shape for every section, so a reader learns it once.
	 * The eyebrow answers "where am I", the title answers "what's here", and
	 * the optional note carries the one line of context that stops the section
	 * from needing a paragraph of explanation.
	 */
	import { reveal } from '$lib/actions/reveal.js';
	import Icon from './Icon.svelte';

	export let eyebrow = '';
	export let icon = '';
	export let title = '';
	export let note = '';
	/** Right-aligned slot content (a filter, a count) sits on the title line. */
	export let aside = false;
</script>

<header class="head" class:head-split={aside} use:reveal>
	<div class="head-main">
		{#if eyebrow}
			<p class="t-eyebrow">
				{#if icon}<Icon name={icon} size={14} />{/if}
				<span>{eyebrow}</span>
			</p>
		{/if}
		<h2 class="t-display">{title}</h2>
		{#if note}
			<p class="t-lead head-note">{note}</p>
		{/if}
	</div>

	{#if aside}
		<div class="head-aside">
			<slot />
		</div>
	{/if}
</header>

<style>
	.head {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: clamp(2.25rem, 5vh, 3.5rem);
		max-width: 46rem;
	}

	.head-split {
		flex-direction: row;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
		max-width: none;
	}

	.head-main {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		min-width: 0;
	}

	.head-note {
		margin-top: 0.25rem;
	}

	.head-aside {
		flex-shrink: 0;
		padding-bottom: 0.25rem;
	}

	@media (max-width: 48rem) {
		.head-split {
			flex-direction: column;
			align-items: stretch;
		}
		.head-aside {
			padding-bottom: 0;
		}
	}
</style>
