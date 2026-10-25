<script>
	/**
	 * The character's brain.
	 *
	 * Owns where he is, what he's doing and what he's saying. The drawing
	 * lives in Avatar.svelte and the words live in script.js; this file is
	 * only behaviour.
	 *
	 * Position is two independent springs in viewport pixels — X and Y never
	 * share one spring, because a single spring on a 2D distance desynchronises
	 * the moment the two axes carry different velocities. Throwing him uses
	 * the same momentum projection as the chat sheet: the landing point comes
	 * from where the throw was *going*, not from where the finger stopped.
	 *
	 * He is deliberately always present. The one concession is that he keeps
	 * to a margin band at the side rather than sitting over the text, and he
	 * can be sent to the corner — a reader who wants him gone must be able to
	 * get rid of him, or the whole thing becomes an obstacle.
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { Spring, drive, project, SPRINGS, springConfig, prefersReducedMotion } from '$lib/motion/spring.js';
	import { draggable } from '$lib/motion/gestures.js';
	import Figure from './Figure.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { GREETING, SECTIONS, REACTIONS, TRICKS, pick } from './script.js';

	const STORE_KEY = 'vtb-companion';

	// The figure is a fixed box; the photographs are contained inside it,
	// bottom-aligned, so the two poses stand at the same height despite being
	// different shapes.
	const W = 124;
	const H = 190;
	const MARGIN = 20;

	let mounted = false;
	let hidden = false; // sent to the corner
	let reduced = false;

	/* ─── Presentation state ────────────────────────────────────────────── */
	let face = 'neutral';
	let pose = 'idle';
	// No blinking and no eye tracking: these are photographs. The figure
	// leans toward the pointer instead — the only "aliveness" a still image
	// can honestly offer.
	let lean = 0;
	let squash = { sx: 1, sy: 1 };
	let rot = 0;
	let invisible = false; // the vanish trick

	/** Poses that call for the dance photograph rather than the pointing one. */
	const DANCE_POSES = new Set(['dance', 'punch', 'selfie', 'panic', 'tickle', 'fly']);
	$: shot = DANCE_POSES.has(pose) ? 'dance' : 'point';

	/* ─── Speech ────────────────────────────────────────────────────────── */
	let bubble = '';
	let typed = '';
	let bubbleSide = 'right';
	let typeTimer;
	let bubbleTimer;

	/* ─── Position ──────────────────────────────────────────────────────── */
	let el;
	let x = new Spring(0, springConfig(SPRINGS.move.bounce, SPRINGS.move.response));
	let y = new Spring(0, springConfig(SPRINGS.move.bounce, SPRINGS.move.response));
	let held = false;
	let grabDX = 0;
	let grabDY = 0;

	const render = () => {
		if (!el) return;
		el.style.transform = `translate3d(${x.value}px, ${y.value}px, 0)`;
	};

	function bounds() {
		// Measured, not assumed. The box is the figure plus its controls row,
		// and it changes at the narrow breakpoint — hard-coding the height
		// let the controls hang 8px off the bottom of the viewport.
		const bw = el?.offsetWidth || W;
		const bh = el?.offsetHeight || H;
		return {
			minX: MARGIN,
			maxX: Math.max(MARGIN, window.innerWidth - bw - MARGIN),
			minY: MARGIN,
			maxY: Math.max(MARGIN, window.innerHeight - bh - MARGIN)
		};
	}

	function clamp(px, py) {
		const b = bounds();
		return {
			x: Math.min(Math.max(px, b.minX), b.maxX),
			y: Math.min(Math.max(py, b.minY), b.maxY)
		};
	}

	/** Resting place: bottom-left, clear of the chat launcher. */
	function home() {
		const b = bounds();
		return { x: b.minX, y: b.maxY };
	}

	function moveTo(px, py, { velocityX = 0, velocityY = 0, bouncy = false } = {}) {
		const t = clamp(px, py);
		const cfg = springConfig(
			bouncy ? SPRINGS.fling.bounce : SPRINGS.move.bounce,
			bouncy ? SPRINGS.fling.response : SPRINGS.move.response
		);
		x.configure(cfg);
		y.configure(cfg);
		x.setTarget(t.x, velocityX);
		y.setTarget(t.y, velocityY);
		drive([x, y], render, onSettle);
	}

	let pendingLanding = false;
	function onSettle() {
		if (!pendingLanding) return;
		pendingLanding = false;
		const r = pick('land', REACTIONS.land);
		say(r.text, { face: r.face });
		impact();
	}

	/** Squash on impact, then spring back. Sells the landing. */
	function impact() {
		if (reduced) return;
		squash = { sx: 1.22, sy: 0.78 };
		setTimeout(() => (squash = { sx: 0.94, sy: 1.06 }), 90);
		setTimeout(() => (squash = { sx: 1, sy: 1 }), 210);
	}

	/* ════════════════════════════════════════════════════════════════════
	   SPEECH
	   ════════════════════════════════════════════════════════════════════ */

	/**
	 * Typed-out delivery: the text arrives at reading speed rather than
	 * appearing whole, which is what makes him read as talking. Under reduced
	 * motion the whole line lands at once — a character typing itself is
	 * still motion.
	 */
	function say(text, { face: f, pose: p, hold = 0 } = {}) {
		if (hidden) return;
		clearTimeout(typeTimer);
		clearTimeout(bubbleTimer);

		if (f) face = f;
		if (p) pose = p;

		bubble = text;
		pickSide();

		if (reduced) {
			typed = text;
		} else {
			typed = '';
			let i = 0;
			const step = () => {
				typed = text.slice(0, ++i);
				if (i < text.length) typeTimer = setTimeout(step, 16 + Math.random() * 22);
			};
			step();
		}

		// Longer lines stay up longer — roughly reading speed, with a floor.
		const dwell = hold || Math.max(2600, text.length * 55);
		bubbleTimer = setTimeout(() => {
			bubble = '';
			typed = '';
			if (pose !== 'idle') pose = 'idle';
			face = 'neutral';
		}, dwell);
	}

	/** Flip the bubble to whichever side has room. */
	function pickSide() {
		bubbleSide = x.value < window.innerWidth / 2 ? 'right' : 'left';
	}

	/* ════════════════════════════════════════════════════════════════════
	   DRAG, THROW, LAND
	   ════════════════════════════════════════════════════════════════════ */

	function onDragStart() {
		held = true;
		// Captured here, not reactively: Spring.value is a plain class field
		// that Svelte cannot observe, so computing this outside the gesture
		// left it stale and the figure jumped on the next grab.
		grabDX = x.value;
		grabDY = y.value;
		pose = 'held';
		pendingLanding = false;
		const r = pick('grab', REACTIONS.grab);
		say(r.text, { face: r.face, hold: 1400 });
	}

	function onDragMove({ dx, dy }) {
		// 1:1 with the pointer, offset from where he was actually grabbed.
		x.set(grabDX + dx);
		y.set(grabDY + dy);
		render();
	}

	function onDragEnd({ vx, vy }) {
		held = false;
		pose = 'idle';

		const speed = Math.hypot(vx, vy);

		// A real throw: project where the momentum is heading and let him fly
		// there, then rubber-band back inside if that lands off-screen.
		if (speed > 420) {
			const tx = x.value + project(vx, 0.995);
			const ty = y.value + project(vy, 0.995);
			const r = pick('throw', REACTIONS.throw);
			say(r.text, { face: r.face, hold: 900 });
			pose = 'fly';
			pendingLanding = true;
			moveTo(tx, ty, { velocityX: vx, velocityY: vy, bouncy: true });
			setTimeout(() => {
				if (pose === 'fly') pose = 'idle';
			}, 700);
		} else {
			// Just set down. Settle where he is, nudged inside the bounds.
			moveTo(x.value, y.value);
		}
	}

	/* ════════════════════════════════════════════════════════════════════
	   TICKLE
	   ════════════════════════════════════════════════════════════════════ */

	let taps = [];
	function onPoke() {
		const now = Date.now();
		taps = taps.filter((t) => now - t < 1500);
		taps.push(now);

		if (taps.length >= 3) {
			taps = [];
			const r = pick('tickle', REACTIONS.tickle);
			pose = 'tickle';
			say(r.text, { face: r.face, hold: 1800 });
			setTimeout(() => {
				if (pose === 'tickle') pose = 'idle';
			}, 1400);
		}
	}

	/* ════════════════════════════════════════════════════════════════════
	   TRICKS
	   ════════════════════════════════════════════════════════════════════ */

	let menuOpen = false;
	let busy = false;

	async function doTrick(trick) {
		if (busy) return;
		busy = true;
		menuOpen = false;

		say(trick.line, { face: trick.face, pose: trick.pose, hold: trick.ms });

		if (trick.id === 'fly') {
			// Actually leave the ground, then come back.
			const b = bounds();
			moveTo(x.value, b.minY, { bouncy: true });
			setTimeout(() => moveTo(x.value, b.maxY, { bouncy: true }), trick.ms - 700);
		}

		if (trick.id === 'vanish') {
			setTimeout(() => (invisible = true), 600);
			setTimeout(() => {
				// Reappear somewhere else entirely — that's the joke.
				const b = bounds();
				const nx = Math.random() * (b.maxX - b.minX) + b.minX;
				x.set(nx);
				y.set(b.maxY);
				render();
				invisible = false;
				say('...and here I am.', { face: 'grin', hold: 1800 });
			}, trick.ms - 500);
		}

		if (trick.id === 'peekaboo') {
			invisible = true;
			setTimeout(() => {
				invisible = false;
				say('Boo!', { face: 'grin', hold: 1400 });
			}, 800);
		}

		if (trick.id === 'walk') {
			const b = bounds();
			const target = x.value < window.innerWidth / 2 ? b.maxX : b.minX;
			x.configure(springConfig(0, 2.4)); // slow, so the legs keep up
			x.setTarget(target);
			drive([x, y], render);
			setTimeout(() => x.configure(springConfig(SPRINGS.move.bounce, SPRINGS.move.response)), trick.ms);
		}

		if (trick.id === 'hiccup' || trick.id === 'sneeze') {
			// Physical jolts: a few sharp hops.
			let n = 0;
			const jolt = setInterval(() => {
				if (n++ > 3) return clearInterval(jolt);
				y.setTarget(y.target - 18, -900);
				drive([x, y], render);
				setTimeout(() => {
					y.setTarget(clamp(x.value, y.value).y);
					drive([x, y], render);
				}, 160);
			}, 620);
		}

		setTimeout(() => {
			pose = 'idle';
			busy = false;
		}, trick.ms);
	}

	/* ════════════════════════════════════════════════════════════════════
	   NARRATION
	   ════════════════════════════════════════════════════════════════════ */

	let io;
	const narrated = new Set();
	let narrationOn = true;

	function watchSections() {
		io = new IntersectionObserver(
			(entries) => {
				if (!narrationOn || hidden || busy || held) return;
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					const key = entry.target.id;
					const section = SECTIONS[key];
					if (!section || narrated.has(key)) continue;
					narrated.add(key);
					const line = pick(`sec-${key}`, section.lines);
					say(line.text, { face: line.face, pose: line.pose });
					idleSince = Date.now();
				}
			},
			{ rootMargin: '-35% 0px -35% 0px', threshold: 0 }
		);

		for (const key of Object.keys(SECTIONS)) {
			const node = document.getElementById(key);
			if (node) io.observe(node);
		}
	}

	/* ════════════════════════════════════════════════════════════════════
	   AMBIENT REACTIONS
	   ════════════════════════════════════════════════════════════════════ */

	let idleSince = Date.now();
	let idleTimer;
	let lastScrollY = 0;
	let lastScrollT = 0;
	let scrollCooldown = 0;
	let wasNarrow = false;
	let sawBottom = false;

	function onScroll() {
		const now = Date.now();
		const dy = Math.abs(window.scrollY - lastScrollY);
		const dt = now - lastScrollT || 1;
		const speed = (dy / dt) * 1000; // px per second

		lastScrollY = window.scrollY;
		lastScrollT = now;

		if (speed > 2600 && now > scrollCooldown && !busy && !held && !hidden) {
			scrollCooldown = now + 14000;
			const r = pick('fast', REACTIONS.fastScroll);
			say(r.text, { face: r.face, hold: 2400 });
			idleSince = now;
		}

		// Reached the end.
		const atBottom = window.innerHeight + window.scrollY >= document.body.scrollHeight - 120;
		if (atBottom && !sawBottom && !hidden) {
			sawBottom = true;
			const r = pick('bottom', REACTIONS.bottom);
			setTimeout(() => say(r.text, { face: r.face, pose: 'wave' }), 900);
		}
	}

	function onPointerMove(e) {
		if (held || busy) return;
		// He leans toward the pointer. Capped low — past about 8 degrees a
		// photograph stops reading as a lean and starts reading as a tilted
		// picture.
		const cx = x.value + W / 2;
		const dx = e.clientX - cx;
		lean = Math.max(-8, Math.min(8, (dx / (window.innerWidth / 2)) * 8));
	}

	function onResize() {
		const t = clamp(x.value, y.value);
		x.set(t.x);
		y.set(t.y);
		render();

		const narrow = window.innerWidth < 640;
		if (narrow !== wasNarrow && mounted && !hidden) {
			wasNarrow = narrow;
			say(narrow ? REACTIONS.mobile[0].text : REACTIONS.mobile[1].text, {
				face: 'surprised',
				hold: 2000
			});
		}
	}

	/** Contact.svelte dispatches this when the email address is copied. */
	function onCopied() {
		if (hidden) return;
		const r = pick('copied', REACTIONS.copied);
		say(r.text, { face: r.face, pose: 'wave' });
	}

	/* ════════════════════════════════════════════════════════════════════
	   DISMISS / RECALL
	   ════════════════════════════════════════════════════════════════════ */

	function dismiss() {
		const r = pick('dismissed', REACTIONS.dismissed);
		pose = 'sulk';
		face = 'sulk';
		say(r.text, { face: 'sulk', pose: 'sulk', hold: 1200 });
		setTimeout(() => {
			hidden = true;
			menuOpen = false;
			bubble = '';
			typed = '';
			persist();
		}, 1300);
	}

	async function recall() {
		hidden = false;
		persist();
		await tick();
		const h = home();
		x.set(h.x);
		y.set(h.y);
		render();
		const r = pick('recalled', REACTIONS.recalled);
		say(r.text, { face: r.face, pose: 'wave' });
	}

	function persist() {
		try {
			localStorage.setItem(
				STORE_KEY,
				JSON.stringify({ seen: true, hidden, narration: narrationOn })
			);
		} catch {
			/* blocked storage — he simply reintroduces himself next time */
		}
	}

	function load() {
		try {
			return JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
		} catch {
			return {};
		}
	}

	/* ════════════════════════════════════════════════════════════════════
	   LIFECYCLE
	   ════════════════════════════════════════════════════════════════════ */

	onMount(async () => {
		reduced = prefersReducedMotion();
		const saved = load();
		hidden = !!saved.hidden;
		narrationOn = saved.narration !== false;
		wasNarrow = window.innerWidth < 640;

		mounted = true;
		await tick();

		const h = home();
		x.set(h.x);
		y.set(h.y);
		render();

		lastScrollY = window.scrollY;
		lastScrollT = Date.now();

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize);
		window.addEventListener('pointermove', onPointerMove, { passive: true });
		window.addEventListener('vtb:copied', onCopied);

		watchSections();


		// Idle chatter.
		idleTimer = setInterval(() => {
			if (hidden || busy || held || bubble) return;
			if (Date.now() - idleSince < 22000) return;
			idleSince = Date.now();
			const r = pick('idle', REACTIONS.idle);
			say(r.text, { face: r.face, hold: 2600 });
		}, 4000);

		if (!hidden) {
			const g = saved.seen ? GREETING.returning : GREETING.first;
			const line = pick('greet', g);
			setTimeout(() => say(line.text, { face: line.face, pose: line.pose, hold: 5200 }), 1200);
		}
		persist();
	});

	onDestroy(() => {
		clearTimeout(typeTimer);
		clearTimeout(bubbleTimer);
		clearInterval(idleTimer);
		io?.disconnect();
		if (typeof window !== 'undefined') {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
			window.removeEventListener('pointermove', onPointerMove);
			window.removeEventListener('vtb:copied', onCopied);
		}
	});

</script>

{#if mounted}
	{#if hidden}
		<!-- Sulking in the corner, one tap away from coming back. -->
		<button class="recall no-print" on:click={recall} aria-label="Bring the guide back">
			<Icon name="about" size={18} />
		</button>
	{:else}
		<div
			bind:this={el}
			class="companion no-print ch-{pose} ch-{face}"
			class:invisible
			class:held
			style={`--sx:${squash.sx}; --sy:${squash.sy}; --rot:${rot}deg`}
		>
			<!-- Speech bubble -->
			{#if bubble}
				<div class="bubble material" class:left={bubbleSide === 'left'} role="status" aria-live="polite">
					<p class="bubble-text on-material">{typed}</p>
				</div>
			{/if}

			<!-- The figure. Dragging is on this wrapper so the whole body is
			     grabbable, and a plain tap counts as a poke. -->
			<div
				class="grab"
				use:draggable={{
					axis: 'both',
					onStart: onDragStart,
					onMove: onDragMove,
					onEnd: onDragEnd
				}}
				on:pointerdown={onPoke}
				role="presentation"
			>
				<Figure {shot} {lean} />
			</div>

			<!-- Controls -->
			<div class="controls">
				<button
					class="ctl"
					aria-expanded={menuOpen}
					on:click={() => (menuOpen = !menuOpen)}
					title="Do a trick"
					aria-label="Do a trick"
				>
					<Icon name="sparkle" size={14} />
				</button>
				<button
					class="ctl"
					on:click={() => {
						narrationOn = !narrationOn;
						persist();
						say(narrationOn ? "Right, I'll keep commentating." : "Quiet mode. I'll still be here.", {
							face: narrationOn ? 'happy' : 'neutral',
							hold: 2000
						});
					}}
					title={narrationOn ? 'Stop the commentary' : 'Start the commentary'}
					aria-label={narrationOn ? 'Stop the commentary' : 'Start the commentary'}
				>
					<Icon name={narrationOn ? 'chat' : 'close'} size={14} />
				</button>
				<button class="ctl" on:click={dismiss} title="Send him away" aria-label="Send the guide away">
					<Icon name="chevron-down" size={14} />
				</button>
			</div>

			<!-- Trick menu -->
			{#if menuOpen}
				<div class="tricks material-thick" role="menu">
					{#each TRICKS as t}
						<button class="trick" role="menuitem" on:click={() => doTrick(t)}>{t.label}</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.companion {
		position: fixed;
		top: 0;
		left: 0;
		z-index: var(--z-overlay);
		width: 124px;
		will-change: transform;
		/* The figure is grabbable; the space around it is not, or he'd block
		   clicks on the content behind him. */
		pointer-events: none;
		transition: opacity 400ms var(--ease-soft);
	}
	.companion.invisible {
		opacity: 0;
	}

	.grab {
		pointer-events: auto;
		height: 190px;
		cursor: grab;
		touch-action: none;
		-webkit-tap-highlight-color: transparent;
		/* Driven by the impact squash. */
		transform: scale(var(--sx, 1), var(--sy, 1));
		transform-origin: center bottom;
		transition: transform 110ms var(--ease-out);
	}
	.held .grab {
		cursor: grabbing;
	}

	/* ══════════════════════════════════════════════════════════════════════
	   POSES
	   With a drawn character these moved individual limbs. A photograph has
	   no limbs to move, so every pose is whole-body motion: rock, bob, jab,
	   spin, droop. Read together with the speech bubble, that is enough to
	   carry a mood — a figure that bounces while saying "watch this" is
	   legibly pleased with itself without needing a face to prove it.
	   ══════════════════════════════════════════════════════════════════════ */

	.ch-wave .grab {
		animation: rock 1.6s ease-in-out infinite;
	}
	@keyframes rock {
		0%, 100% { transform: rotate(-3deg); }
		50%      { transform: rotate(3deg); }
	}

	.ch-point .grab {
		animation: assert 1.8s ease-in-out infinite;
	}
	@keyframes assert {
		0%, 100% { transform: translateY(0) scale(1); }
		50%      { transform: translateY(-4px) scale(1.03); }
	}

	.ch-dance .grab {
		animation: dance 0.52s ease-in-out infinite;
	}
	@keyframes dance {
		0%, 100% { transform: translateY(0) rotate(-5deg); }
		25%      { transform: translateY(-7px) rotate(0deg); }
		50%      { transform: translateY(0) rotate(5deg); }
		75%      { transform: translateY(-7px) rotate(0deg); }
	}

	.ch-punch .grab {
		animation: jab 0.3s ease-in-out infinite;
	}
	@keyframes jab {
		0%, 100% { transform: translateX(0) scale(1, 1); }
		40%      { transform: translateX(9px) scale(1.04, 0.96); }
	}

	.ch-panic .grab {
		animation: panic 0.11s linear infinite;
	}
	@keyframes panic {
		0%, 100% { transform: translate(-3px, 0) rotate(-2deg); }
		50%      { transform: translate(3px, -2px) rotate(2deg); }
	}

	.ch-fly .grab {
		animation: fly 1.1s ease-in-out infinite;
	}
	@keyframes fly {
		0%, 100% { transform: rotate(-16deg) translateY(0); }
		50%      { transform: rotate(-12deg) translateY(-9px); }
	}

	.ch-selfie .grab {
		animation: selfie 2.2s ease-in-out infinite;
	}
	@keyframes selfie {
		0%, 100% { transform: scale(1) rotate(-4deg); }
		50%      { transform: scale(1.09) rotate(4deg); }
	}

	.ch-tickle .grab {
		animation: wiggle 0.09s linear infinite;
	}
	@keyframes wiggle {
		0%, 100% { transform: translateX(-2.5px) rotate(-1.5deg); }
		50%      { transform: translateX(2.5px) rotate(1.5deg); }
	}

	.ch-walk .grab {
		animation: walk 0.46s ease-in-out infinite;
	}
	@keyframes walk {
		0%, 100% { transform: translateY(0) rotate(-2.5deg); }
		50%      { transform: translateY(-5px) rotate(2.5deg); }
	}

	.ch-sleep .grab {
		animation: breathe 3.4s ease-in-out infinite;
	}
	@keyframes breathe {
		0%, 100% { transform: rotate(7deg) scale(1, 1); }
		50%      { transform: rotate(7deg) scale(0.99, 1.02); }
	}

	/* Being carried: he swings from the pointer like something picked up. */
	.ch-held .grab {
		animation: dangle 1.2s ease-in-out infinite alternate;
	}
	@keyframes dangle {
		from { transform: rotate(-7deg); }
		to   { transform: rotate(7deg); }
	}

	/* Sulking and dizziness are the two moods a still photograph can still
	   express, because both are achievable with filters and rotation. */
	.ch-sulk .grab {
		filter: grayscale(0.75) brightness(0.88);
		transform: rotate(-4deg) translateY(4px);
		transition: filter 400ms var(--ease-soft), transform 400ms var(--ease-out);
	}

	.ch-dizzy .grab {
		animation: spin 1.1s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@media (prefers-reduced-motion: reduce) {
		.grab,
		.ch-wave .grab,
		.ch-point .grab,
		.ch-dance .grab,
		.ch-punch .grab,
		.ch-panic .grab,
		.ch-fly .grab,
		.ch-selfie .grab,
		.ch-tickle .grab,
		.ch-walk .grab,
		.ch-sleep .grab,
		.ch-held .grab,
		.ch-dizzy .grab {
			animation: none;
		}
	}

	/* ─── Bubble ───────────────────────────────────────────────────────────
	   Sits above him and flips to whichever side has room. Deliberately
	   capped in width: a speech bubble that spans the viewport stops reading
	   as speech. */
	.bubble {
		pointer-events: auto;
		position: absolute;
		bottom: calc(100% - 34px);
		left: 58px;
		width: max-content;
		max-width: min(17rem, 46vw);
		padding: 0.625rem 0.8125rem;
		border-radius: var(--r-lg);
		border-bottom-left-radius: var(--r-xs);
		animation: pop 280ms var(--ease-out);
	}
	.bubble.left {
		left: auto;
		right: 58px;
		border-bottom-left-radius: var(--r-lg);
		border-bottom-right-radius: var(--r-xs);
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: translateY(6px) scale(0.94);
		}
	}

	.bubble-text {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.45;
		letter-spacing: -0.002em;
		/* The typed text grows one glyph at a time; a fixed min-height stops
		   the bubble resizing on every character. */
		min-height: 1.2em;
	}

	/* ─── Controls ─────────────────────────────────────────────────────────
	   Hidden until he's hovered or focused, so he isn't permanently wearing
	   a toolbar. */
	.controls {
		pointer-events: auto;
		display: flex;
		gap: 0.1875rem;
		justify-content: center;
		margin-top: 0.125rem;
		opacity: 0;
		transform: translateY(-4px);
		transition: opacity 200ms var(--ease-soft), transform 200ms var(--ease-out);
	}
	.companion:hover .controls,
	.controls:focus-within {
		opacity: 1;
		transform: none;
	}

	.ctl {
		display: grid;
		place-items: center;
		width: 1.625rem;
		height: 1.625rem;
		padding: 0;
		border-radius: var(--r-full);
		border: 0.5px solid var(--border);
		background: var(--bg-raised);
		color: var(--text-3);
		box-shadow: var(--e1);
		cursor: pointer;
		transition: color 160ms var(--ease-soft), transform 120ms var(--ease-out);
	}
	.ctl:hover {
		color: var(--text);
	}
	.ctl:active {
		transform: scale(0.9);
	}

	/* ─── Trick menu ───────────────────────────────────────────────────────── */
	.tricks {
		pointer-events: auto;
		position: absolute;
		bottom: 100%;
		left: 0;
		margin-bottom: 0.5rem;
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.125rem;
		width: max-content;
		max-width: 15rem;
		padding: 0.3125rem;
		border-radius: var(--r-lg);
		animation: pop 240ms var(--ease-out);
	}

	.trick {
		padding: 0.4375rem 0.625rem;
		border: 0;
		border-radius: var(--r-sm);
		background: transparent;
		color: var(--text-2);
		font-family: inherit;
		font-size: 0.78125rem;
		font-weight: 520;
		text-align: left;
		white-space: nowrap;
		cursor: pointer;
		transition: background-color 140ms var(--ease-soft), color 140ms var(--ease-soft);
	}
	.trick:hover {
		background: var(--bg-sunk);
		color: var(--text);
	}

	/* ─── Recall button ────────────────────────────────────────────────────── */
	.recall {
		position: fixed;
		left: max(1rem, env(safe-area-inset-left));
		bottom: max(1rem, env(safe-area-inset-bottom));
		z-index: var(--z-overlay);
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--r-full);
		border: 0.5px solid var(--border);
		background: var(--bg-raised);
		color: var(--text-3);
		box-shadow: var(--e2);
		cursor: pointer;
		transition: color 180ms var(--ease-soft), transform 140ms var(--ease-out);
	}
	.recall:hover {
		color: var(--text);
	}
	.recall:active {
		transform: scale(0.92);
	}

	/* ─── Narrow screens ───────────────────────────────────────────────────
	   He shrinks rather than disappearing — the user asked for him to be
	   present, and hiding him on phones would quietly undo that. */
	@media (max-width: 40rem) {
		.companion {
			width: 86px;
		}
		.grab {
			height: 132px;
		}
		.bubble {
			max-width: 56vw;
			font-size: 0.78125rem;
			left: 42px;
		}
		.bubble.left {
			right: 42px;
			left: auto;
		}
		.controls {
			opacity: 1;
			transform: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.bubble,
		.tricks {
			animation: none;
		}
		.grab {
			transition: none;
		}
	}
</style>
