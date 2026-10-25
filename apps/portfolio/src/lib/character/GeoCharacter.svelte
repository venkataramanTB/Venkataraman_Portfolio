<script>
	/**
	 * The character renderer and animator.
	 *
	 * Two layers of motion, deliberately separated:
	 *
	 *   1. The ANIMATION samples a target pose from the clock — a walk cycle
	 *      asks "what should every joint be at 0.4s in?".
	 *   2. A SPRING PER JOINT chases that target.
	 *
	 * The springs are the reason switching animation mid-stride looks right.
	 * A cut from `walk` to `panic` doesn't snap: every joint is already
	 * carrying velocity and simply re-aims, exactly as a body would. It also
	 * means no animation has to know what came before it, so poses stay
	 * independent data instead of a graph of transitions.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { Spring, prefersReducedMotion } from '$lib/motion/spring.js';
	import { JOINTS, REST, sample, resolve, animationDone } from './rig.js';
	import Bone from './Bone.svelte';
	import { SKELETON } from './rig.js';

	/** Name of an animation in ANIMATIONS. */
	export let animation = 'idle';
	/** Whole-figure lean, degrees, added on top of the pose. */
	export let lean = 0;
	/** 1 faces right, -1 faces left. */
	export let facing = 1;
	/** Pupil offset, -1…1, for cursor tracking. */
	export let lookX = 0;
	export let lookY = 0;
	/** Fires when a non-looping animation reaches its last frame. */
	export let onDone = () => {};

	const TRACKED = [...JOINTS, 'y', 'rot'];

	// One spring per joint. Response is a touch slower than the default so
	// limbs have a little weight; a body that arrives instantly reads as a
	// puppet rather than a person.
	const springs = {};
	for (const name of TRACKED) {
		springs[name] = new Spring(name === 'y' || name === 'rot' ? 0 : REST[name] ?? 0, {
			bounce: 0.08,
			response: 0.22
		});
	}

	/** The pose actually rendered this frame. */
	let pose = { ...REST, y: 0, rot: 0 };

	let raf = 0;
	let started = 0;
	let current = animation;
	let reduced = false;
	let doneFired = false;

	// Restart the clock whenever the animation changes, so a non-looping
	// animation always plays from its first frame.
	$: if (animation !== current) {
		current = animation;
		started = performance.now();
		doneFired = false;
		if (reduced) snap();
	}

	/** Reduced motion: hold the animation's first frame, no clock at all. */
	function snap() {
		const target = sample(current, 0);
		for (const k of TRACKED) springs[k].set(target[k] ?? 0);
		pose = { ...target };
	}

	function frame(now) {
		const elapsed = now - started;
		const target = sample(current, elapsed);

		const next = {};
		for (const k of TRACKED) {
			const s = springs[k];
			s.setTarget(target[k] ?? 0);
			// Fixed timestep: joint springs are stiff, and a long frame after a
			// background tab would otherwise fling a limb across the body.
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

	// Measured from the rig, not guessed: the pelvis is the origin, the top of
	// the cap reaches about y=-64 and the soles about y=+65. The box adds a
	// little air around that and nothing more, so he fills his slot.
	const GROUND = 65;
	const VB = { x: -48, y: -72, w: 96, h: 146 };
</script>

<svg
	class="geo"
	viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
	preserveAspectRatio="xMidYMax meet"

	role="img"
	aria-label="A small character of Venkataraman in a cap"
	style={`--lean:${lean}deg`}
>
	<!-- Contact shadow, squashed as he leaves the ground so a jump reads. -->
	<ellipse
		class="shadow"
		cx="0"
		cy={GROUND}
		rx={16 - Math.min(Math.abs(pose.y ?? 0) * 0.14, 7)}
		ry={3.2 - Math.min(Math.abs(pose.y ?? 0) * 0.02, 1.4)}
		opacity={1 - Math.min(Math.abs(pose.y ?? 0) / 90, 0.55)}
	/>

	<!-- facing flips the whole rig; `rot` and `y` are whole-figure channels the
	     poses can drive (a jump lifts, a lunge tilts). -->
	<g transform={`scale(${facing} 1)`}>
		<g transform={`translate(0 ${pose.y ?? 0}) rotate(${pose.rot ?? 0})`}>
			<g
				style={`--lx:${lookX}; --ly:${lookY}`}
				class="rig"
			>
				<Bone bone={SKELETON} {pose} parentLen={0} />
			</g>
		</g>
	</g>
</svg>

<style>
	.geo {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
		transform: rotate(var(--lean));
		transform-origin: 50% 100%;
		transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.shadow {
		fill: rgba(0, 0, 0, 0.2);
	}
	:global(:root[data-theme='dark']) .shadow {
		fill: rgba(0, 0, 0, 0.5);
	}

	/* Pupils track the cursor. Done in CSS off two custom properties so it
	   costs nothing per frame in the animation loop. */
	.rig :global(circle[id^='eye']) {
		transform: translate(calc(var(--lx) * 1.4px), calc(var(--ly) * 1.1px));
		transition: transform 120ms linear;
	}

	@media (prefers-reduced-motion: reduce) {
		.geo {
			transition: none;
		}
		.rig :global(circle[id^='eye']) {
			transition: none;
		}
	}
</style>
