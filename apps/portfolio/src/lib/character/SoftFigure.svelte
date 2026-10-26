<script>
	/**
	 * The character, drawn and animated in the Soft system.
	 *
	 * Two layers of motion, kept separate:
	 *   1. the ANIMATION samples a target pose from the clock;
	 *   2. a SPRING PER JOINT chases that target.
	 *
	 * The springs are why switching animation mid-stride looks right: a cut
	 * from `walk` to `panic` doesn't snap, because every joint already carries
	 * velocity and simply re-aims. It also means no animation has to know what
	 * preceded it, so poses stay independent data.
	 *
	 * Geometry comes from softrig.js; every pose and animation still comes
	 * from rig.js, unchanged.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { Spring, prefersReducedMotion } from '$lib/motion/spring.js';
	import { JOINTS, REST, sample, animationDone } from './rig.js';
	import { SOFT_SKELETON } from './softrig.js';
	import SoftBone from './SoftBone.svelte';

	export let animation = 'idle';
	/** Whole-figure lean, degrees. */
	export let lean = 0;
	/** 1 faces right, −1 faces left. */
	export let facing = 1;
	/** Pupil offset, −1…1. */
	export let lookX = 0;
	export let lookY = 0;
	export let onDone = () => {};

	const TRACKED = [...JOINTS, 'y', 'rot'];
	const springs = {};
	for (const n of TRACKED) {
		springs[n] = new Spring(n === 'y' || n === 'rot' ? 0 : (REST[n] ?? 0), {
			bounce: 0.1,
			response: 0.24
		});
	}

	let pose = { ...REST, y: 0, rot: 0 };
	let raf = 0;
	let started = 0;
	let current = animation;
	let doneFired = false;
	let reduced = false;

	$: if (animation !== current) {
		current = animation;
		started = performance.now();
		doneFired = false;
		if (reduced) snap();
	}

	function snap() {
		const t = sample(current, 0);
		for (const k of TRACKED) springs[k].set(t[k] ?? 0);
		pose = { ...t };
	}

	function frame(now) {
		const elapsed = now - started;
		const target = sample(current, elapsed);
		const next = {};
		for (const k of TRACKED) {
			const s = springs[k];
			s.setTarget(target[k] ?? 0);
			// Fixed timestep: these springs are stiff, and one long frame after
			// a background tab would otherwise fling a limb through the body.
			s.step(1 / 60);
			next[k] = s.value;
		}
		pose = next;

		if (!doneFired && animationDone(current, elapsed)) {
			doneFired = true;
			onDone(current);
		}
		raf = requestAnimationFrame(frame);
	}

	onMount(() => {
		reduced = prefersReducedMotion();
		if (reduced) {
			snap();
			return;
		}
		started = performance.now();
		raf = requestAnimationFrame(frame);
	});

	onDestroy(() => raf && cancelAnimationFrame(raf));

	// Measured from the skeleton: he stands on y = 0 about the pelvis, the
	// hair reaches about −70 and the soles about +52.
	const VB = { x: -58, y: -80, w: 116, h: 142 };
</script>

<svg
	class="soft"
	viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
	preserveAspectRatio="xMidYMax meet"
	role="img"
	aria-label="An illustration of Venkataraman"
	style={`--lean:${lean}deg; --lx:${lookX}; --ly:${lookY}`}
>
	<!-- A soft contact shadow, squashed as he leaves the ground so a jump
	     reads as a jump rather than a float. -->
	<ellipse
		class="shadow"
		cx="0"
		cy="54"
		rx={22 - Math.min(Math.abs(pose.y ?? 0) * 0.16, 9)}
		ry={4 - Math.min(Math.abs(pose.y ?? 0) * 0.025, 1.8)}
		opacity={0.14 - Math.min(Math.abs(pose.y ?? 0) / 700, 0.07)}
	/>

	<g transform={`scale(${facing} 1)`}>
		<g transform={`translate(0 ${pose.y ?? 0}) rotate(${pose.rot ?? 0})`}>
			<g class="rig">
				<SoftBone bone={SOFT_SKELETON} {pose} parentLen={0} />
			</g>
		</g>
	</g>
</svg>

<style>
	.soft {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
		transform: rotate(var(--lean));
		transform-origin: 50% 100%;
		transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.shadow {
		fill: #1f1d1b;
	}

	/* Pupils track the pointer. Done in CSS off two custom properties so it
	   costs nothing in the animation loop. */
	.rig :global(circle[id^='eye']) {
		transform: translate(calc(var(--lx) * 2px), calc(var(--ly) * 1.6px));
		transition: transform 130ms linear;
	}

	@media (prefers-reduced-motion: reduce) {
		.soft,
		.rig :global(circle[id^='eye']) {
			transition: none;
		}
	}
</style>
