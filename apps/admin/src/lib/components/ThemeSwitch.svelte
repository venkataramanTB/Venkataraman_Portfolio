<script>
	/**
	 * Substrate control. A segmented control rather than a single toggle,
	 * because "follow the system" is a real third choice and hiding it behind
	 * a two-state switch takes that agency away.
	 *
	 * The selection thumb is spring-driven and re-aims from wherever it
	 * currently is, so rapidly clicking across the three options tracks the
	 * clicks continuously instead of restarting a transition each time.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { theme, setTheme, MODES } from '$lib/theme.js';
	import { Spring, drive, SPRINGS, springConfig } from '$lib/motion/spring.js';
	import Icon from './Icon.svelte';

	const LABELS = { auto: 'System', light: 'Light', dark: 'Dark' };
	const ICONS = { auto: 'theme-auto', light: 'theme-light', dark: 'theme-dark' };

	let track;
	/** @type {HTMLButtonElement[]} */
	let buttons = [];
	let thumb;

	const x = new Spring(0, springConfig(SPRINGS.move.bounce, SPRINGS.move.response));
	const w = new Spring(0, springConfig(SPRINGS.move.bounce, SPRINGS.move.response));

	const render = () => {
		if (!thumb) return;
		thumb.style.width = `${w.value}px`;
		thumb.style.transform = `translate3d(${x.value}px, 0, 0)`;
	};

	let ro;
	let current = 'auto';

	function place(mode, animate = true) {
		const i = MODES.indexOf(mode);
		const el = buttons[i];
		if (!el || !track) return;

		const t = track.getBoundingClientRect();
		const b = el.getBoundingClientRect();
		const left = b.left - t.left;

		if (!animate) {
			x.set(left);
			w.set(b.width);
			render();
			return;
		}
		// setTarget, not set: an in-flight thumb keeps its velocity and simply
		// re-aims, which is what makes a fast double-click feel continuous.
		x.setTarget(left);
		w.setTarget(b.width);
		drive([x, w], render);
	}

	const unsub = theme.subscribe((v) => {
		current = v;
		if (thumb) place(v);
	});

	onMount(() => {
		place(current, false);
		// The thumb is positioned in pixels, so it has to be re-measured when
		// the control resizes — a text-size change or a font swap moves it.
		ro = new ResizeObserver(() => place(current, false));
		ro.observe(track);
	});

	onDestroy(() => {
		unsub();
		ro?.disconnect();
	});

	function onKeydown(e) {
		const i = MODES.indexOf(current);
		if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
			e.preventDefault();
			setTheme(MODES[(i + 1) % MODES.length]);
		} else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
			e.preventDefault();
			setTheme(MODES[(i - 1 + MODES.length) % MODES.length]);
		}
	}
</script>

<div
	bind:this={track}
	class="segmented"
	role="radiogroup"
	tabindex="-1"
	aria-label="Colour theme"
	on:keydown={onKeydown}
>
	<span bind:this={thumb} class="segmented-thumb" aria-hidden="true"></span>

	{#each MODES as mode, i}
		<button
			bind:this={buttons[i]}
			class="segment seg"
			role="radio"
			aria-checked={current === mode}
			tabindex={current === mode ? 0 : -1}
			title={LABELS[mode]}
			on:click={() => setTheme(mode)}
		>
			<Icon name={ICONS[mode]} size={15} />
			<span class="seg-text">{LABELS[mode]}</span>
		</button>
	{/each}
</div>

<style>
	.seg {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding-inline: 0.6875rem;
	}

	/* Below the breakpoint the control keeps all three options but drops to
	   icons only — removing a choice to save space would be the wrong trade. */
	@media (max-width: 30rem) {
		.seg-text {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
		}
		.seg {
			padding-inline: 0.5rem;
		}
	}
</style>
