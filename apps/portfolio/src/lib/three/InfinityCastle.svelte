<script>
	/**
	 * The castle, behind the entire page.
	 *
	 * Fixed, full-viewport, pointer-transparent, and pinned to the very back
	 * of the stack. The page's own chapters paint over it — which is the
	 * point, because a chapter with a solid ground should still cut cleanly
	 * against the one before it. The castle shows through where the field is
	 * transparent, and the chapter grounds carry a little alpha so it reads as
	 * depth under the type rather than as a slideshow behind a curtain.
	 *
	 * The camera FALLS. Scroll position maps to Y, continuously, so scrolling
	 * the page is descending through the castle. This is the one piece of
	 * motion that had to be tied to scroll and not to a clock: if the castle
	 * drifted on its own the page would feel like it was playing a video, and
	 * tying it to the scrollbar makes the reader the one moving.
	 *
	 * Everything here is suspended when off-screen, hidden, or when the
	 * reader asked for reduced motion. In the last case the scene is still
	 * built and drawn ONCE — a still of the castle is the right fallback; a
	 * blank page is not. A reader who gets motion sickness still gets the art.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { prefersReducedMotion } from '$lib/motion/spring.js';

	let canvas;
	let raf = 0;
	let teardown = [];
	/** Only fades in once there is something to look at, so the page never
	    flashes a half-built scene. */
	let ready = false;
	/* Set when WebGL or the module import is unavailable. Nothing renders in
	   that case and the painted gradient under the canvas carries the page. */
	let failed = false;

	onMount(async () => {
		// WebGL is not guaranteed. A locked-down browser, a blocklisted
		// driver, or a machine that has simply run out of GL contexts all end
		// up here, and the page must be completely fine without this.
		if (!hasWebGL()) {
			failed = true;
			return;
		}

		let THREE, buildCastle, FIELD;
		try {
			const [three, castleMod] = await Promise.all([import('three'), import('./castle.js')]);
			THREE = three;
			buildCastle = castleMod.buildCastle;
			FIELD = castleMod.FIELD;
		} catch {
			failed = true;
			return;
		}

		const reduced = prefersReducedMotion();

		/* Quality is decided once, from the hardware, and never adapts
		   mid-session: a scene that quietly drops detail while you scroll is
		   more distracting than one that is simply lighter throughout. */
		const small = window.matchMedia('(max-width: 60rem)').matches;
		/* 0.5 was set before the glows stopped costing sixty draw calls. With
		   that fixed there is room for more of the castle on a small screen,
		   and a sparse castle on a phone reads as an empty page rather than as
		   a lighter version of the same place. */
		const quality = small ? 0.7 : 1;

		const renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: !small,
			alpha: true,
			powerPreference: 'high-performance'
		});
		// Capping DPR at 1.5 is the single biggest win available here. A 3x
		// phone renders nine times the pixels of a 1x one for a background
		// that is deliberately out of focus.
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, small ? 1.25 : 1.5));
		renderer.outputColorSpace = THREE.SRGBColorSpace;

		const scene = new THREE.Scene();
		// Fog in the page's own field colour, so the far structure dissolves
		// into the background instead of fading to a grey that isn't there.
		/* Tuned by eye against the page, not picked from a tutorial. Denser
		   and the castle is a black rectangle; thinner and you can see the
		   far edge of the geometry, which ends the illusion instantly. */
		scene.fog = new THREE.FogExp2(FIELD, 0.0135);

		const camera = new THREE.PerspectiveCamera(
			58,
			window.innerWidth / window.innerHeight,
			0.1,
			400
		);

		const castle = buildCastle({ quality });
		scene.add(castle.group);

		const resize = () => {
			const w = window.innerWidth;
			const h = window.innerHeight;
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			renderer.setSize(w, h, false);
		};
		resize();
		window.addEventListener('resize', resize, { passive: true });
		teardown.push(() => window.removeEventListener('resize', resize));

		/* ─── What drives the camera ─────────────────────────────────────── */
		let scrollY = 0;
		const onScroll = () => {
			scrollY = window.scrollY || 0;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		teardown.push(() => window.removeEventListener('scroll', onScroll));

		// A little parallax off the pointer. Kept very small — this is set
		// dressing, and a background that swings about under the cursor makes
		// text genuinely harder to read.
		let px = 0;
		let py = 0;
		const onMove = (e) => {
			px = (e.clientX / window.innerWidth - 0.5) * 2;
			py = (e.clientY / window.innerHeight - 0.5) * 2;
		};
		if (!reduced) {
			window.addEventListener('pointermove', onMove, { passive: true });
			teardown.push(() => window.removeEventListener('pointermove', onMove));
		}

		/* ─── Pause when nobody can see it ───────────────────────────────── */
		let visible = !document.hidden;
		const onVis = () => {
			visible = !document.hidden;
			if (visible && !reduced && !raf) raf = requestAnimationFrame(frame);
		};
		document.addEventListener('visibilitychange', onVis);
		teardown.push(() => document.removeEventListener('visibilitychange', onVis));

		/* How far the camera falls, top of page to bottom. The rooms span a
		   good deal further than this in both directions, so there is always
		   structure overhead and more of it below. */
		const TRAVEL = 92;

		/** How far down the page we are, 0…1. */
		const scrollPos = () => {
			const maxScroll = Math.max(
				1,
				document.documentElement.scrollHeight - window.innerHeight
			);
			return Math.min(Math.max(scrollY / maxScroll, 0), 1);
		};

		let camY = TRAVEL / 2;
		let camYTarget = TRAVEL / 2;
		let cx = 0;
		let cy = 0;

		const draw = (t) => {
			/* Scroll → depth, as a FRACTION of the page rather than a fixed
			   divisor. A fixed one was the first attempt and it was wrong:
			   the depth it produced depended on how long the page happened to
			   be, so on a full page the camera ran out through the bottom of
			   the castle and the last few screens were plain black. Mapping
			   the whole scroll onto the castle's height means the top of the
			   page is the top of the castle and the footer is the bottom of
			   it, whatever the page's length — and when the API fills the
			   page with real projects and it gets longer, the descent simply
			   spreads out instead of overshooting. */
			camYTarget = TRAVEL / 2 - scrollPos() * TRAVEL;
			// Chase rather than snap, so a jumped scroll (a nav link, a
			// keyboard End) glides instead of teleporting.
			camY += (camYTarget - camY) * 0.075;

			cx += (px * 2.6 - cx) * 0.05;
			cy += (-py * 1.8 - cy) * 0.05;

			camera.position.set(cx, camY + cy, 26);
			// A slow roll keyed to depth, not to time. Tied to the clock it
			// would spin on its own while you sat still; tied to depth, the
			// castle turns because you are descending through it.
			camera.rotation.z = camY * 0.0065;
			camera.lookAt(cx * 0.5, camY + cy * 0.5, -10);

			// One uniform drives every lantern's flicker on the GPU.
			castle.setTime(t);

			renderer.render(scene, camera);
		};

		const frame = (t) => {
			if (!visible) {
				raf = 0;
				return;
			}
			draw(t);
			raf = requestAnimationFrame(frame);
		};

		if (reduced) {
			/* One frame, then stop — a still castle rather than a moving one.
			   
			   camY has to be SNAPPED to its target first. draw() normally eases
			   toward the target a fraction per frame, which is right at 60fps
			   and useless when exactly one frame will ever run: the single
			   frame would render 7% of the way into the castle. That is
			   invisible on a cold load at scroll 0 and very visible on a
			   deep link to #contact, which would paint the top of the castle
			   while the reader is at the bottom of the page. */
			camY = camYTarget = TRAVEL / 2 - scrollPos() * TRAVEL;
			draw(0);
			// A still frame does not survive a window resize on its own.
			const redraw = () => {
				resize();
				camY = camYTarget = TRAVEL / 2 - scrollPos() * TRAVEL;
				draw(0);
			};
			window.addEventListener('resize', redraw, { passive: true });
			teardown.push(() => window.removeEventListener('resize', redraw));
		} else {
			raf = requestAnimationFrame(frame);
		}
		ready = true;

		teardown.push(() => {
			castle.dispose();
			renderer.dispose();
		});
	});

	onDestroy(() => {
		if (raf) cancelAnimationFrame(raf);
		for (const fn of teardown) fn();
		teardown = [];
	});

	function hasWebGL() {
		try {
			const c = document.createElement('canvas');
			return !!(c.getContext('webgl2') || c.getContext('webgl'));
		} catch {
			return false;
		}
	}
</script>

<div class="castle" class:ready aria-hidden="true">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.castle {
		position: fixed;
		inset: 0;
		z-index: var(--z-castle);
		pointer-events: none;
		opacity: 0;
		transition: opacity 1200ms var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1));

		/* The painted floor under the WebGL. If the canvas never arrives —
		   slow network, no WebGL, JS off — the page still has depth and the
		   gold still has somewhere to come from, instead of going flat black. */
		background:
			radial-gradient(120% 80% at 50% -10%, rgba(217, 180, 94, 0.1), transparent 60%),
			radial-gradient(90% 60% at 80% 110%, rgba(106, 124, 255, 0.07), transparent 65%),
			var(--field-deep);
	}
	.castle.ready {
		opacity: 1;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	@media (prefers-reduced-motion: reduce) {
		.castle {
			transition: none;
		}
	}
</style>
