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
	import { BONES, REST3D, REST_FIX, resolvePose, ONE_SHOT, ONE_SHOT_MS } from './akazaPoses.js';

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

	// Track prop changes even while the GLB is loading. The frame loop reads
	// `current` once the model is ready, so the latest requested pose is not lost.
	$: if (animation !== current) {
		current = animation;
		startedAt = typeof performance !== 'undefined' ? performance.now() : 0;
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
		   
		   THE WHOLE FIGURE FITS IN THE FRAME. An earlier pass cropped him to
		   head-and-chest to buy a bigger face, and that was a mistake: a
		   canvas is a hard rectangle, so cropping a figure against its edge
		   draws a visible box around him — he stopped reading as a character
		   standing on the page and started reading as a portrait in a frame.
		   The fix for a small face is to make the whole figure bigger, which
		   is what the guide scale now does, not to cut bits off him.
		   
		   Fitted by HEIGHT. He is far taller than he is wide, so height is
		   always the binding constraint and fitting by width would leave him
		   tiny in a tall box. */
		const box = new THREE.Box3().setFromObject(model);
		const size = box.getSize(new THREE.Vector3());
		const centre = box.getCenter(new THREE.Vector3());

		const CAM_Z = 5.2;
		const FOV = 34;
		// Half the frame height at the model's depth, from the camera's own
		// numbers so this stays correct if the lens ever changes.
		const halfH = CAM_Z * Math.tan((FOV / 2) * (Math.PI / 180));

		/* 0.94 of the frame, so there is a little air above his hair and below
		   his feet. Filling it exactly would put his silhouette hard against
		   the canvas edge, which is the same framed look by another route —
		   and poses that reach (point, dance) would clip. */
		const FIGURE_H = halfH * 2 * 0.94;
		const scale = FIGURE_H / Math.max(size.y, 0.0001);
		model.scale.setScalar(scale);

		/* Centred horizontally, and stood on the bottom of the frame rather
		   than centred vertically: .grab scales from `center bottom`, so the
		   bottom of this canvas is the line he appears to stand on at every
		   guide scale. Centring him would have him float above it. */
		model.position.set(
			-centre.x * scale,
			-halfH + 0.03 - box.min.y * scale,
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

		/* Each driven bone remembers where it started — as a QUATERNION, with
		   the T-pose correction from akazaPoses.js already folded in. From
		   here on a pose value of zero means "resting", which is what every
		   pose in that file was written to assume. Composed once, here, so the
		   correction costs nothing per frame. */
		const fixE = new THREE.Euler();
		for (const [key, bone] of Object.entries(bones)) {
			const base = bone.quaternion.clone();
			const fix = REST_FIX[key];
			if (fix) {
				fixE.set(fix[0], fix[1], fix[2], 'XYZ');
				base.multiply(new THREE.Quaternion().setFromEuler(fixE));
			}
			springs[key] = {
				base,
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

		/* HOW FAR THE BODY SINKS, in model units.
		   
		   Forward kinematics has no idea there is a floor. Bending the knees
		   rotates the shins around the knees, which lifts the FEET; it does
		   not lower the hips. Left alone, a deep stance makes him hover with
		   his legs tucked under him. So a pose that bends the knees also says
		   how far the whole figure drops, and the root carries it. Sprung, so
		   he settles into the stance rather than snapping down into it. */
		let dropCur = 0;
		let dropVel = 0;
		const baseY = root.position.y;

		const tmp = new THREE.Euler();
		const tmpQ = new THREE.Quaternion();
		/* How far he turns toward the way he is facing. Shallow on purpose —
		   see the note where it is applied. */
		/* Carries the body's turn as well as which way he faces, because the
		   spine cannot: see the note on POSES.idle. Opened up from 0.38 so he
		   stands at an angle to the reader rather than square to them. */
		const YAW = 0.52;
		let yaw = facing >= 0 ? -YAW : YAW;

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

			/* Compose, do not add.
			   
			   This used to set bone.rotation to base + cur, component by
			   component. Adding Euler angles only equals composing rotations
			   when they share an axis — roughly true for the few degrees a
			   pose asked for, and badly false now the rest correction asks for
			   77. Building a quaternion from the pose and multiplying it onto
			   the base is correct at any angle and costs the same.
			   
			   Breathing and pointer tracking fold in here, on top of whatever
			   the pose set, which is why they are not in the pose data. The
			   look is clamped hard: a head that can turn to look behind itself
			   is horror, not charm. */
			for (const [key, bone] of Object.entries(bones)) {
				const sp = springs[key];
				let ex = sp.cur.x;
				let ey = sp.cur.y;
				let ez = sp.cur.z;

				if (key === 'spine1') ex += breath;
				if (key === 'spine3') ez += sway * 0.5;
				if (key === 'head') {
					ey += lookX * 0.34 * facing;
					ex += lookY * 0.2;
				}
				if (key === 'neck') {
					ey += lookX * 0.18 * facing;
					ex += lookY * 0.1;
				}

				tmp.set(ex, ey, ez, 'XYZ');
				tmpQ.setFromEuler(tmp);
				bone.quaternion.copy(sp.base).multiply(tmpQ);
			}

			/* `facing` TURNS him; it does not mirror him.
			   
			   The SVG did this with scale(±1), which is the right answer in 2D
			   and the wrong one here: a negative scale gives the world matrix a
			   determinant of −1, which inverts winding order and flips every
			   normal, so his shading breaks the moment he faces left — lit from
			   the wrong side, with the toon shading inside out.
			   
			   A yaw also reads better. He is a figure in a space, so turning
			   toward where he is going is what a body actually does; mirroring
			   would swap which hand he gestures with, which on a model with an
			   asymmetric costume is immediately obvious. Kept to a shallow
			   angle so he stays mostly front-on to the reader rather than
			   presenting a shoulder. */
			const yawTarget = facing >= 0 ? -YAW : YAW;
			yaw += (yawTarget - yaw) * Math.min(1, dt * 7);
			root.rotation.y = yaw;

			// Same spring shape as the joints, so the sink is in step with the
			// bend that causes it.
			const dropWant = target.drop ?? 0;
			const da = (dropWant - dropCur) * SPRING.stiffness - dropVel * SPRING.damping;
			dropVel += da * dt;
			dropCur += dropVel * dt;
			root.position.y = baseY - dropCur;
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
