<script>
	/**
	 * Renders the 3D character.
	 *
	 * The defining trick, taken from sebg.ch: render at a deliberately TINY
	 * internal resolution and let CSS scale the canvas up with
	 * `image-rendering: pixelated`. The result is chunky and toy-like, but it
	 * is real geometry underneath — so the figure turns, occludes itself and
	 * catches light in a way no sprite can.
	 *
	 * It also happens to be very cheap: the render target is a few thousand
	 * pixels, so the cost is the scene graph, not the fill rate.
	 *
	 * Pose data comes from ../character/rig.js unchanged — the same library
	 * that drove the 2D rig. Each joint is chased by a spring so switching
	 * animation mid-stride stays continuous.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { Spring, prefersReducedMotion } from '$lib/motion/spring.js';
	import { JOINTS, REST, sample, animationDone } from '$lib/character/rig.js';
	import { buildFigure, applyPose } from './figure.js';

	export let animation = 'idle';
	/** Whole-figure lean, degrees. */
	export let lean = 0;
	/** 1 faces right, −1 faces left. */
	export let facing = 1;
	/** Pointer offset, −1…1. Turns the head rather than moving eyes. */
	export let lookX = 0;
	export let lookY = 0;
	export let onDone = () => {};

	/** Internal render size. Small on purpose — this IS the pixelation. */
	const RW = 150;
	const RH = 215;

	let host;
	let canvas;
	let raf = 0;
	let started = 0;
	let current = animation;
	let doneFired = false;
	let reduced = false;
	let ready = false;

	let three = null; // { renderer, scene, camera, root, joints }
	const TRACKED = [...JOINTS, 'y', 'rot'];
	const springs = {};
	for (const n of TRACKED) {
		springs[n] = new Spring(n === 'y' || n === 'rot' ? 0 : (REST[n] ?? 0), {
			bounce: 0.08,
			response: 0.22
		});
	}

	$: if (animation !== current) {
		current = animation;
		started = performance.now();
		doneFired = false;
	}

	// Yaw and lean are applied to the whole model, outside the pose.
	$: if (three) {
		three.root.rotation.y = facing < 0 ? Math.PI * 0.82 : -Math.PI * 0.18;
	}

	async function init() {
		const THREE = await import('three');

		const renderer = new THREE.WebGLRenderer({
			canvas,
			alpha: true,
			antialias: false // antialiasing would soften exactly the edges we want hard
		});
		renderer.setPixelRatio(1); // never upscale the render target
		renderer.setSize(RW, RH, false);

		const scene = new THREE.Scene();

		// Orthographic: no perspective divergence, which is what makes the
		// figure read as a toy rather than a photographed person.
		// Framed tightly on the figure. The camera half-height is just over
		// half his height, so he fills the render target instead of sitting in
		// a lake of empty pixels — at this resolution every wasted pixel is a
		// visible loss of detail.
		const aspect = RW / RH;
		const h = 6.5;
		const camera = new THREE.OrthographicCamera(-h * aspect, h * aspect, h, -h, 0.1, 100);
		camera.position.set(0, 5.9, 22);
		camera.lookAt(0, 5.9, 0);

		// Three lights: a key to carve the facets, a fill so the dark side is
		// not black, and a rim to lift him off the field behind.
		const key = new THREE.DirectionalLight(0xfff6ee, 2.1);
		key.position.set(4, 9, 7);
		scene.add(key);
		scene.add(new THREE.AmbientLight(0xffd9c9, 1.15));
		const rim = new THREE.DirectionalLight(0xffc9b4, 0.9);
		rim.position.set(-6, 4, -5);
		scene.add(rim);

		const { root, joints } = buildFigure();
		scene.add(root);

		three = { THREE, renderer, scene, camera, root, joints };
		ready = true;
	}

	function frame(now) {
		raf = requestAnimationFrame(frame);
		if (!three) return;

		const elapsed = now - started;
		const target = sample(current, elapsed);

		const pose = {};
		for (const k of TRACKED) {
			const s = springs[k];
			s.setTarget(target[k] ?? 0);
			// Fixed timestep: these springs are stiff, and one long frame after
			// a background tab would otherwise fling a limb through the body.
			s.step(1 / 60);
			pose[k] = s.value;
		}

		applyPose(three.joints, pose);

		// Whole-figure channels.
		three.root.position.y = 5.9 + (pose.y ?? 0) * -0.06;
		three.root.rotation.z = -((pose.rot ?? 0) + lean) * (Math.PI / 180);

		// The head turns toward the pointer — the 3D equivalent of eye
		// tracking, and far more legible at this resolution than moving two
		// three-pixel eyes would be.
		const head = three.joints.head;
		if (head) {
			head.rotation.y = lookX * 0.5;
			head.rotation.x = lookY * 0.28;
		}

		three.renderer.render(three.scene, three.camera);

		if (!doneFired && animationDone(current, elapsed)) {
			doneFired = true;
			onDone(current);
		}
	}

	onMount(async () => {
		reduced = prefersReducedMotion();
		try {
			await init();
		} catch (e) {
			// WebGL can be unavailable or blocked. The character is a flourish,
			// not load-bearing, so failing quietly is correct.
			console.warn('[character] 3D unavailable:', e?.message ?? e);
			return;
		}
		started = performance.now();

		if (reduced) {
			// Hold the first frame: posed, lit and still.
			const target = sample(current, 0);
			for (const k of TRACKED) springs[k].set(target[k] ?? 0);
			applyPose(three.joints, target);
			three.renderer.render(three.scene, three.camera);
			return;
		}
		raf = requestAnimationFrame(frame);
	});

	onDestroy(() => {
		if (raf) cancelAnimationFrame(raf);
		if (three) {
			// WebGL contexts are a finite resource; leaking them across
			// navigations eventually kills the renderer for the whole tab.
			three.renderer.dispose();
			three.scene.traverse((o) => {
				o.geometry?.dispose?.();
				if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
				else o.material?.dispose?.();
			});
		}
	});
</script>

<div class="host" bind:this={host} class:ready>
	<!-- A canvas is already a labellable image surface; adding role="img"
	     on top of it is invalid. The label alone is what assistive tech needs. -->
	<canvas bind:this={canvas} width={RW} height={RH} aria-label="A small 3D character of Venkataraman"></canvas>
</div>

<style>
	.host {
		width: 100%;
		height: 100%;
		display: grid;
		place-items: end center;
		opacity: 0;
		transition: opacity 260ms ease;
	}
	.host.ready {
		opacity: 1;
	}

	canvas {
		width: 100%;
		height: 100%;
		/* The whole point: the small render target is scaled up with hard
		   nearest-neighbour edges instead of being smoothed. */
		image-rendering: pixelated;
		-webkit-user-drag: none;
		user-select: none;
	}
</style>
