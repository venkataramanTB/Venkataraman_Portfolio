<script>
	/**
	 * The character, in three dimensions.
	 *
	 * A DROP-IN REPLACEMENT for SoftFigure: same props, same `onDone`
	 * contract, same meaning for `facing` and `lookX/lookY`. That is the
	 * whole design constraint. Companion.svelte owns position, dragging,
	 * speech, tricks and the script, and none of it knows or cares that the
	 * figure stopped being an SVG — the one line that mounts the figure is
	 * the only line that changed.
	 *
	 * The two-layer motion model carries over unchanged:
	 *   1. a POSE is sampled (here: looked up, since the model has no clips);
	 *   2. a SPRING PER BONE CHANNEL chases it.
	 * So cutting from `wave` to `panic` mid-gesture still resolves smoothly,
	 * because every channel already carries velocity and simply re-aims.
	 *
	 * If anything at all goes wrong — no WebGL, the 3.5MB model fails to
	 * arrive, a driver gives up — this renders nothing and tells the parent,
	 * which puts the SVG character back. A portfolio that shows an empty box
	 * on a locked-down work laptop is worse than one that shows a drawing.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { prefersReducedMotion } from '$lib/motion/spring.js';
	import { BONES, REST3D, resolvePose, ONE_SHOT, ONE_SHOT_MS } from './akazaPoses.js';

	export let animation = 'idle';
	/** Whole-figure lean, degrees. */
	export let lean = 0;
	/** 1 faces right, −1 faces left. */
	export let facing = 1;
	/** Pointer offset, −1…1. */
	export let lookX = 0;
	export let lookY = 0;
	export let onDone = () => {};
	/** Raised when the 3D path cannot run, so the parent can fall back. */
	export let onFail = () => {};

	const MODEL = '/models/akaza.glb';

	let canvas;
	let ready = false;
	let raf = 0;
	let teardown = [];

	/* Set by the loader, read by the frame loop. */
	let bones = {};
	let api = null;

	/** Spring state per bone channel: {x,y,z} current + velocity. */
	const springs = {};
	const SPRING = { stiffness: 170, damping: 22 };

	let current = animation;
	let startedAt = 0;
	let doneFired = false;

	$: if (api && animation !== current) {
		current = animation;
		startedAt = performance.now();
		doneFired = false;
	}

	onMount(async () => {
		if (!hasWebGL()) return fail();

		let THREE, GLTFLoader;
		try {
			THREE = await import('three');
			({ GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js'));
		} catch {
			return fail();
		}

		const reduced = prefersReducedMotion();

		const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.outputColorSpace = THREE.SRGBColorSpace;

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
		// Kept in step with the framing maths below.
		camera.fov = 34;

		/* Lighting is doing a specific job: this is a toon-shaded model lifted
		   from a game, so it has no sculpted highlights of its own and goes
		   completely flat under a single light. Key plus a cold rim plus a
		   warm bounce is the minimum that gives it an edge against a black
		   page. The rim is gold on purpose — it ties him to the lanterns. */
		const key = new THREE.DirectionalLight(0xfff4e2, 2.1);
		key.position.set(2.4, 3.4, 3.2);
		const rim = new THREE.DirectionalLight(0xd9b45e, 2.6);
		rim.position.set(-2.8, 1.6, -2.4);
		const fill = new THREE.DirectionalLight(0x8899ff, 0.5);
		fill.position.set(-1.5, -1, 2);
		scene.add(key, rim, fill, new THREE.AmbientLight(0xffffff, 0.75));

		/* ─── Load ───────────────────────────────────────────────────────── */
		let gltf;
		try {
			gltf = await new Promise((res, rej) => new GLTFLoader().load(MODEL, res, undefined, rej));
		} catch {
			return fail();
		}
		// The component can be torn down while a 3.5MB file is in flight.
		if (!canvas) return;

		const model = gltf.scene;

		/* Normalise whatever the exporter decided. Sketchfab models arrive at
		   arbitrary scale and offset, so MEASURE the thing and fit it, rather
		   than trusting a magic number that breaks the moment anyone
		   re-exports the file.
		   
		   The figure is framed to head-and-chest, not full body. He sits in a
		   box about 90px wide beside a speech bubble: framed head to toe the
		   face is nine pixels tall and the whole point of having a character
		   is gone. So he is scaled up until a head-and-shoulders crop fills
		   the frame, and positioned by his TOP edge rather than his centre —
		   what has to stay put as the camera crops is the top of his head. */
		const box = new THREE.Box3().setFromObject(model);
		const size = box.getSize(new THREE.Vector3());
		const centre = box.getCenter(new THREE.Vector3());

		// Model height in world units. 5.4 against a frame that shows ~3.2
		// means we see the top ~60% of him: head, shoulders, chest, hands.
		const FIGURE_H = 5.4;
		const scale = FIGURE_H / Math.max(size.y, 0.0001);
		model.scale.setScalar(scale);

		// Half the frame height at the model's depth, from the camera's own
		// numbers so this stays correct if the lens ever changes.
		const CAM_Z = 5.2;
		const FOV = 34;
		const halfH = CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));
		// Leave a little headroom above the hair so he isn't scalped by the
		// top edge of the canvas.
		const topY = halfH - 0.16;

		model.position.set(
			-centre.x * scale,
			topY - (box.max.y * scale),
			-centre.z * scale
		);

		const root = new THREE.Group();
		root.add(model);
		scene.add(root);

		/* ─── Find the bones we drive ────────────────────────────────────── */
		/* Prefix match, because the exporter suffixes every name with its own
		   index and those numbers are not stable across re-exports. */
		const byPrefix = {};
		model.traverse((o) => {
			if (!o.isBone) return;
			for (const [key, prefix] of Object.entries(BONES)) {
				if (!byPrefix[key] && o.name.startsWith(prefix)) byPrefix[key] = o;
			}
		});
		bones = byPrefix;

		// If the rig is not what we think it is, a silent wrong-limb puppet is
		// the worst outcome. Fall back instead.
		if (!bones.head || !bones.upperArmR) return fail();

		// Everything is measured from the bind pose, so each driven bone
		// remembers where it started.
		for (const [key, bone] of Object.entries(bones)) {
			springs[key] = {
				base: bone.rotation.clone(),
				cur: { x: 0, y: 0, z: 0 },
				vel: { x: 0, y: 0, z: 0 }
			};
		}

		/* ─── Size to the box ────────────────────────────────────────────── */
		const resize = () => {
			const r = canvas.getBoundingClientRect();
			const w = Math.max(1, r.width);
			const h = Math.max(1, r.height);
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h, false);
		};
		camera.position.set(0, 0, CAM_Z);
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(canvas);
		teardown.push(() => ro.disconnect());

		/* ─── Pause off-screen ───────────────────────────────────────────── */
		let onScreen = true;
		const io = new IntersectionObserver(
			([e]) => {
				onScreen = e.isIntersecting;
				if (onScreen && !reduced && !raf) raf = requestAnimationFrame(frame);
			},
			{ rootMargin: '200px' }
		);
		io.observe(canvas);
		teardown.push(() => io.disconnect());

		const tmp = new THREE.Euler();

		const apply = (dt, now) => {
			const target = resolvePose(current);

			for (const [key, s] of Object.entries(springs)) {
				const want = target[key] ?? REST3D[key] ?? [0, 0, 0];
				for (let i = 0; i < 3; i++) {
					const axis = i === 0 ? 'x' : i === 1 ? 'y' : 'z';
					// Critically-ish damped spring, fixed timestep. Fixed,
					// because one long frame after a background tab would
					// otherwise fling an arm through the torso.
					const a = (want[i] - s.cur[axis]) * SPRING.stiffness - s.vel[axis] * SPRING.damping;
					s.vel[axis] += a * dt;
					s.cur[axis] += s.vel[axis] * dt;
				}
			}

			// Idle breathing, and a little sway. Without it a settled spring
			// is a mannequin — the single clearest tell that a 3D figure is
			// dead rather than standing still.
			const breath = Math.sin(now * 0.0016) * 0.022;
			const sway = Math.sin(now * 0.0009) * 0.02;

			for (const [key, bone] of Object.entries(bones)) {
				const s = springs[key];
				tmp.set(s.base.x + s.cur.x, s.base.y + s.cur.y, s.base.z + s.cur.z);
				if (key === 'spine1') tmp.x += breath;
				if (key === 'spine3') tmp.z += sway * 0.5;
				bone.rotation.copy(tmp);
			}

			/* The head tracks the pointer ON TOP of whatever the pose set,
			   which is why it is added here rather than folded into the pose
			   data. Clamped hard: a head that can turn to look behind itself
			   is horror, not charm. */
			if (bones.head) {
				bones.head.rotation.y += lookX * 0.34 * facing;
				bones.head.rotation.x += lookY * 0.2;
			}
			if (bones.neck) {
				bones.neck.rotation.y += lookX * 0.18 * facing;
				bones.neck.rotation.x += lookY * 0.1;
			}

			// `facing` mirrors the whole figure, matching the SVG's scale(±1).
			root.scale.x = facing >= 0 ? 1 : -1;
			root.rotation.z = (-lean * Math.PI) / 180;

			renderer.render(scene, camera);

			if (!doneFired && ONE_SHOT.has(current) && now - startedAt > ONE_SHOT_MS) {
				doneFired = true;
				onDone(current);
			}
		};

		let last = performance.now();
		const frame = (now) => {
			if (!onScreen) {
				raf = 0;
				return;
			}
			// Clamped so a stalled tab resumes instead of exploding.
			const dt = Math.min((now - last) / 1000, 1 / 30);
			last = now;
			apply(dt, now);
			raf = requestAnimationFrame(frame);
		};

		api = { apply };
		startedAt = performance.now();

		if (reduced) {
			// Settle the springs without drawing 60 frames a second, then
			// paint the resulting pose once.
			for (let i = 0; i < 90; i++) apply(1 / 60, 0);
		} else {
			raf = requestAnimationFrame(frame);
		}

		ready = true;
		teardown.push(() => {
			renderer.dispose();
			model.traverse((o) => {
				o.geometry?.dispose?.();
				const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
				for (const mt of mats) {
					for (const k of Object.keys(mt)) if (mt[k]?.isTexture) mt[k].dispose();
					mt.dispose();
				}
			});
		});
	});

	onDestroy(() => {
		if (raf) cancelAnimationFrame(raf);
		for (const fn of teardown) fn();
		teardown = [];
	});

	function fail() {
		onFail();
		return false;
	}

	function hasWebGL() {
		try {
			const c = document.createElement('canvas');
			return !!(c.getContext('webgl2') || c.getContext('webgl'));
		} catch {
			return false;
		}
	}
</script>

<canvas
	bind:this={canvas}
	class="akaza"
	class:ready
	role="img"
	aria-label="A 3D figure of the site's guide, standing beside the text"
></canvas>

<style>
	.akaza {
		display: block;
		width: 100%;
		height: 100%;
		opacity: 0;
		transition: opacity 600ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));
	}
	.akaza.ready {
		opacity: 1;
	}

	@media (prefers-reduced-motion: reduce) {
		.akaza {
			transition: none;
		}
	}
</style>
