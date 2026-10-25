<script>
	/**
	 * Cold-start screen.
	 *
	 * The API sleeps when idle, so the first visit after a quiet period waits
	 * on a container waking up. This exists to make that wait honest: it says
	 * what is happening and roughly how long, because an unexplained spinner
	 * for twenty seconds reads as broken rather than as slow.
	 *
	 * `hide()` returns a promise so the caller can await the exit before
	 * swapping in content.
	 */
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from '$lib/motion/spring.js';

	let root;
	let visible = true;
	let elapsed = 0;
	let timer;

	/** Staged copy. A changing message is evidence of progress; a frozen one
	    is evidence of a hang. */
	$: stage =
		elapsed < 4
			? 'Connecting'
			: elapsed < 12
				? 'Waking the server'
				: elapsed < 24
					? 'Still waking — it sleeps when idle'
					: 'Taking longer than usual';

	onMount(() => {
		timer = setInterval(() => (elapsed += 1), 1000);
		return () => clearInterval(timer);
	});

	export function hide() {
		clearInterval(timer);
		return new Promise((resolve) => {
			if (!root || prefersReducedMotion()) {
				visible = false;
				resolve();
				return;
			}
			// Blur and scale animate together, so the screen reads as a material
			// lifting away rather than a rectangle fading out.
			root.style.transition =
				'opacity 420ms var(--ease-in), transform 520ms var(--ease-out), backdrop-filter 420ms var(--ease-in)';
			root.style.opacity = '0';
			root.style.transform = 'scale(1.04)';
			root.style.backdropFilter = 'blur(0px)';
			root.addEventListener(
				'transitionend',
				() => {
					visible = false;
					resolve();
				},
				{ once: true }
			);
			// Belt and braces: if the transition never fires (background tab),
			// the caller must still proceed.
			setTimeout(() => {
				visible = false;
				resolve();
			}, 700);
		});
	}
</script>

{#if visible}
	<div bind:this={root} class="screen" role="status" aria-live="polite">
		<div class="inner">
			<span class="pulse" aria-hidden="true"></span>
			<p class="stage">{stage}</p>
			<p class="t-mono hint">
				{elapsed}s
				{#if elapsed >= 12}
					<span class="dim">· free-tier cold start</span>
				{/if}
			</p>
		</div>
	</div>
{/if}

<style>
	.screen {
		position: fixed;
		inset: 0;
		z-index: var(--z-modal);
		display: grid;
		place-items: center;
		background: var(--bg);
		will-change: opacity, transform;
	}

	.inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
		padding: var(--gutter);
	}

	/* A single breathing dot. No spinner: a spinner implies a known, short
	   wait, and this one is neither. */
	.pulse {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: var(--r-full);
		background: var(--text);
		animation: pulse 1.8s var(--ease-soft) infinite;
	}
	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(0.6);
			opacity: 0.35;
		}
	}

	.stage {
		margin: 0;
		font-size: 1rem;
		font-weight: 540;
		letter-spacing: -0.01em;
		color: var(--text);
	}

	.hint {
		margin: 0;
		color: var(--text-4);
	}
	.dim {
		opacity: 0.75;
	}

	@media (prefers-reduced-motion: reduce) {
		.pulse {
			animation: none;
		}
	}
</style>
