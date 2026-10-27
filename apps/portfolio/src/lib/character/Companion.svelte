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
	import SoftFigure from './SoftFigure.svelte';
	import Akaza3D from './Akaza3D.svelte';

	/**
	 * Which figure is on screen.
	 *
	 * The 3D model is the intended one, but it needs WebGL and a 3.5MB
	 * download, and neither is guaranteed. `use3D` flips to false the moment
	 * Akaza3D reports it cannot run, and the SVG character — which needs
	 * nothing — takes over in the same box, at the same size, driven by the
	 * same `anim`. The reader never sees a gap, only a different drawing.
	 */
	let use3D = true;
	import Icon from '$lib/components/Icon.svelte';
	import { GREETING, SECTIONS, REACTIONS, TRICKS, pick } from './script.js';

	const STORE_KEY = 'vtb-companion';

	// He is the main character, so the base size is the HERO size and every
	// other state is a scale-down of it. Sizing the other way round — a small
	// widget scaled up — gives a soft, obviously-enlarged figure.
	//
	// W is the widest pose (the dance lean) at this height; the pointing pose
	// is narrower and simply sits centred in the same box.
	const H = 420;
	const W = 272;
	const MARGIN = 20;
	/**
	 * The control row's height. It is a SIBLING of the figure's box, sitting
	 * just below it, so it is not covered by H — and every bottom edge here
	 * has to leave room for it or the buttons hang off the bottom of the
	 * viewport. On a phone that put them under the browser's own chrome.
	 */
	const CONTROLS_H = 28;

	/** How large he is when guiding, relative to his hero size. */
	/* Floating over the chapters rather than standing in a column, so he is
	   smaller than hero size — but not by as much as he was. 0.34 was set
	   while the `transform` bug below was still live and every figure drew at
	   full size regardless, so the number was never actually seen on screen.
	   With the scale working, 0.34 is a thumbnail — and now that the figure is
	   framed head to feet rather than cropped at the chest, the same box holds
	   a whole body instead of a portrait, so it has to be larger again for the
	   face to carry at all. */
	const GUIDE_SCALE = 0.78;

	/**
	 * Where he is:
	 *   stage — docked in his own sticky column, at full size, for the whole
	 *           page. This is the normal state and he never leaves it on his
	 *           own. Below the layout breakpoint the column is not rendered,
	 *           so the stage target falls back to a corner.
	 *   free  — the visitor picked him up and threw him. He stays where he
	 *           lands until he walks back.
	 *
	 * There is no longer a hero/guide handover: he is the page's protagonist
	 * from first paint to last, so shrinking him into a corner once the hero
	 * scrolled away was working against the whole idea.
	 */
	let mode = 'stage';
	/**
	 * Whether a stage slot actually exists in the layout. It no longer does on
	 * the chapter layout — he floats over the chapters instead — and the
	 * stage-specific bubble placement must switch off with it, or the bubble
	 * anchors to a column that isn't there and runs off the screen.
	 */
	let hasStage = false;

	let mounted = false;
	let hidden = false; // sent to the corner
	let reduced = false;

	/* ─── Presentation state ────────────────────────────────────────────── */
	let face = 'neutral';
	let pose = 'idle';
	// The rig poses him from joint angles, so there is no longer a set of
	// pre-shot images to pick between: `pose` IS the animation name. And he
	// has eyes again, so he can track the cursor.
	let lean = 0;
	let lookX = 0;
	let lookY = 0;
	/** 1 faces right, -1 faces left — he turns toward where he is going. */
	let facing = 1;
	/** Impact squash, multiplied into the scale when he lands. */
	let squash = { sx: 1, sy: 1 };
	/** Whole-figure tilt, degrees. */
	let rot = 0;
	/** The vanish trick. */
	let invisible = false;

	/**
	 * What he actually plays. Standing neutral is the right rest pose in the
	 * guide lane, but a hero image of a man standing still is a waste of the
	 * slot — centre stage he gestures up at his own name instead.
	 */
	/* `mode` is still 'stage' when there is no stage — it only flips to 'free'
	   when the visitor throws him — so this tested the wrong flag and he stood
	   permanently mid-gesture, arm out, as his RESTING state. `hasStage` is
	   the one that knows whether the sticky column actually exists. The
	   chapter layout has no such column, so the answer is now idle: he simply
	   stands there until he has a reason not to. */
	$: anim = pose === 'idle' && hasStage && !held ? 'point' : pose;

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
	// Scale is its own spring so he can shrink and travel at the same time
	// without the two fighting over one transform.
	let sc = new Spring(1, springConfig(SPRINGS.move.bounce, 0.55));
	let held = false;
	let grabDX = 0;
	let grabDY = 0;

	const render = () => {
		if (!el) return;
		el.style.transform = `translate3d(${x.value}px, ${y.value}px, 0)`;
		// Only the figure scales. The bubble and controls keep their own size
		// so the text stays readable whatever size he is.
		el.style.setProperty('--scale', String(sc.value));
	};

	/**
	 * Where he VISUALLY is, which is not where his box is.
	 *
	 * The element keeps its full 420px layout height at every scale; the
	 * browser shrinks it about `transform-origin: 50% 100%`. So his feet stay
	 * at the bottom of the unscaled box and his visible width contracts
	 * toward its centre. Positioning as though the box itself shrank put his
	 * feet 240px below the viewport at guide size.
	 */
	function visual(px = x.value, py = y.value, s = sc.value) {
		return {
			left: px + W / 2 - (W * s) / 2,
			right: px + W / 2 + (W * s) / 2,
			top: py + H - H * s,
			bottom: py + H,
			w: W * s,
			h: H * s
		};
	}

	/** Box position that puts his visible feet and left edge where we want. */
	function placeAt(visLeft, visBottom, s) {
		return { x: visLeft - W / 2 + (W * s) / 2, y: visBottom - H };
	}

	function bounds() {
		// Expressed in box coordinates but derived from the VISIBLE figure,
		// so the margins mean what they say at any scale.
		const s = sc.value;
		return {
			minX: MARGIN - W / 2 + (W * s) / 2,
			maxX: window.innerWidth - MARGIN - W / 2 - (W * s) / 2,
			minY: MARGIN - H + H * s,
			maxY: window.innerHeight - MARGIN - CONTROLS_H - H
		};
	}

	function clamp(px, py) {
		const b = bounds();
		return {
			x: Math.min(Math.max(px, b.minX), b.maxX),
			y: Math.min(Math.max(py, b.minY), b.maxY)
		};
	}

	/**
	 * His stage: the sticky slot in the layout's left column. Because that
	 * slot is sticky, following it IS following the viewport — he needs no
	 * scroll maths of his own, and his position is a consequence of the
	 * layout rather than a pile of magic numbers.
	 *
	 * Returns null when the column isn't rendered (narrow screens), and the
	 * caller falls back to the corner.
	 */
	function stageTarget() {
		const slot = document.getElementById('character-stage');
		if (!slot) return null;
		const r = slot.getBoundingClientRect();
		if (r.height < 40) return null;

		const scale = Math.min(r.height / H, 1.8);
		// Centred in the slot, standing on its floor.
		const p = placeAt(r.left + (r.width - W * scale) / 2, r.bottom, scale);
		return { scale, x: p.x, y: p.y };
	}

	/** The side lane he occupies while guiding the rest of the page. */
	function guideTarget() {
		/* Hard against the left edge. The old inset of MARGIN * 2.5 dated from
		   when the figure was a cropped portrait a third of this size; at full
		   height he is wide enough that every pixel of inset is a pixel of
		   overlap with the hero's buttons on the other side of him. The pose
		   clipping that inset was guarding against is no longer a risk, because
		   the model is fitted to 94% of its frame with air on all sides. */
		const p = placeAt(MARGIN * 0.5, window.innerHeight - MARGIN - CONTROLS_H, GUIDE_SCALE);
		return { scale: GUIDE_SCALE, x: p.x, y: p.y };
	}

	/** Move him to wherever the current mode says he belongs. */
	function restage({ instant = false } = {}) {
		const st = mode === 'stage' ? stageTarget() : null;
		hasStage = !!st;
		const t = st ?? guideTarget();

		// Turn him to face the page rather than the margin. Centre stage that
		// means gesturing back toward his own name; in the guide lane on the
		// left it means facing the content he is narrating.
		facing = t.x + W / 2 > window.innerWidth / 2 ? -1 : 1;

		if (instant) {
			x.set(t.x);
			y.set(t.y);
			sc.set(t.scale);
			render();
			return;
		}
		x.setTarget(t.x);
		y.setTarget(t.y);
		sc.setTarget(t.scale);
		drive([x, y, sc], render);
		// His station changed, so the side with room may have changed too.
		pickSide();
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
		drive([x, y, sc], render, onSettle);
	}

	let pendingLanding = false;
	let returnTimer;

	/** After being thrown or wandering off, he walks back to his mark. */
	function scheduleReturn(delay = 4200) {
		clearTimeout(returnTimer);
		clearTimeout(beatTimer);
		returnTimer = setTimeout(() => {
			if (mode !== 'free' || held || busy) return;
			mode = 'stage';
			pose = 'walk';
			restage();
			say('Right. Back to work.', { face: 'neutral', pose: 'walk', hold: 1600 });
			setTimeout(() => (pose = 'idle'), 1600);
		}, delay);
	}
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

	/**
	 * Flip the bubble to whichever side actually has room.
	 *
	 * Measured from where he VISUALLY is, not from his box: at guide scale the
	 * box extends well left of the figure, so using box coordinates chose
	 * "left" while he stood at the left margin and the bubble ran off the
	 * edge of the screen.
	 */
	function pickSide() {
		const v = visual();
		const centre = (v.left + v.right) / 2;
		bubbleSide = centre < window.innerWidth / 2 ? 'right' : 'left';
	}

	/* ════════════════════════════════════════════════════════════════════
	   DRAG, THROW, LAND
	   ════════════════════════════════════════════════════════════════════ */

	function onDragStart() {
		held = true;
		stopSpeaking();
		// Picked up means he has left his mark; he stays where he's put until
		// the page moves on and he walks back.
		mode = 'free';
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
			scheduleReturn();
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
		stopSpeaking();
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
				mode = 'free';
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

		// Locomotion actually travels. A walk cycle playing on the spot is the
		// tell that a character is a decoration rather than a thing in the room.
		if (trick.id === 'walk' || trick.id === 'run' || trick.id === 'moonwalk') {
			mode = 'free';
			const b = bounds();
			const target = x.value < window.innerWidth / 2 ? b.maxX : b.minX;
			facing = target > x.value ? 1 : -1;
			// The spring's response is matched to the gait so the feet are not
			// skating: a run covers the same ground in a third of the time.
			const response = trick.id === 'run' ? 1.1 : trick.id === 'moonwalk' ? 3.4 : 2.4;
			x.configure(springConfig(0, response));
			x.setTarget(target);
			drive([x, y, sc], render);
			setTimeout(() => {
				x.configure(springConfig(SPRINGS.move.bounce, SPRINGS.move.response));
				scheduleReturn();
			}, trick.ms);
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
					speak(section.beats ?? section.lines ?? []);
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

	/* ─── Monologue ──────────────────────────────────────────────────────
	   A section is a short monologue, not a caption. Beats are delivered in
	   order with a gap sized to the line, so he talks at reading speed
	   instead of dumping a paragraph into one bubble.

	   Anything the visitor does — grabbing him, asking for a trick,
	   scrolling on to the next section — cancels the rest. He should never
	   keep lecturing over an interruption. */
	let beatTimer;
	let beatRun = 0;

	function stopSpeaking() {
		beatRun++;
		clearTimeout(beatTimer);
	}

	function speak(beats) {
		stopSpeaking();
		if (!beats.length) return;
		const run = beatRun;

		const next = (i) => {
			if (run !== beatRun || hidden) return; // interrupted
			const b = beats[i];
			say(b.text, { face: b.face, pose: b.pose });
			if (i + 1 < beats.length) {
				// Hold each line a touch past its own reading time so there is
				// a beat of silence rather than a stream.
				beatTimer = setTimeout(() => next(i + 1), Math.max(2800, b.text.length * 52) + 550);
			}
		};
		next(0);
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

		// Follow the sticky slot. There is nothing to decide any more — the
		// layout decides where he stands and this just keeps him there.
		if (mode !== 'free') restage();

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

		const cx = x.value + W / 2;
		const cy = y.value + H - H * sc.value * 0.72; // about head height
		const dx = e.clientX - cx;
		const dy = e.clientY - cy;

		// Eyes track the pointer, normalised and clamped so they stay inside
		// their sockets however far away the cursor is.
		const d = Math.hypot(dx, dy) || 1;
		lookX = Math.max(-1, Math.min(1, (dx / d) * Math.min(d / 220, 1)));
		lookY = Math.max(-1, Math.min(1, (dy / d) * Math.min(d / 220, 1)));

		// And he leans after them, a little.
		lean = Math.max(-7, Math.min(7, (dx / (window.innerWidth / 2)) * 7));

		// He turns to face the cursor, but only once it is properly past him:
		// flipping every time the pointer crosses his nose is a twitch.
		if (Math.abs(dx) > 90) facing = dx < 0 ? -1 : 1;
	}

	function onResize() {
		if (mode === 'free') {
			const t = clamp(x.value, y.value);
			x.set(t.x);
			y.set(t.y);
			render();
		} else {
			restage({ instant: true });
		}

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
		mode = 'stage';
		restage({ instant: true });
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

		// If the visitor loads part-way down the page he should already be in
		// the guide lane rather than sliding in from the hero.
		mode = 'stage';
		restage({ instant: true });

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
		clearTimeout(returnTimer);
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
			class:on-stage={hasStage}
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
				{#if use3D}
					<Akaza3D
						animation={anim}
						{lean}
						{facing}
						{lookX}
						{lookY}
						onFail={() => (use3D = false)}
					/>
				{:else}
					<SoftFigure animation={anim} {lean} {facing} {lookX} {lookY} />
				{/if}

				<!-- The actual grab target. See .hit in the stylesheet: a canvas
				     takes pointer events across its whole rectangle, so without
				     this he swallows clicks on whatever he is standing in front
				     of. -->
				<span class="hit" aria-hidden="true"></span>
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
		/* Above the content but below modals: he is the main character, not an
		   interruption. */
		z-index: var(--z-raised);
		width: 272px;
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
		/* NONE, deliberately — the .hit child below is what takes the pointer.
		   
		   The figure used to be an SVG, and an SVG only receives pointer
		   events where it has actually painted something, so the empty space
		   around him was transparent to clicks for free. A <canvas> is not: it
		   takes events across its entire rectangle. Swapping one for the other
		   silently turned a figure-shaped hit area into a 272×420 block, and
		   he started eating clicks on the hero's primary button from several
		   inches away. */
		pointer-events: none;
		position: relative;
		height: 420px;
		/* Two scales multiplied: --scale is where he is in the story (hero vs
		   guide), --sx/--sy is the impact squash when he lands. Keeping them
		   separate means a landing never fights the staging.
		   
		   This was declared TWICE — and the second one, carrying only the
		   squash, silently won. The effect was that --scale did nothing at
		   all: the figure rendered at full hero size everywhere, including
		   the guide lane where it is meant to be about a third that, which is
		   why he hung off the left edge of the viewport and sat on top of the
		   headline. One declaration, carrying both. */
		transform: scale(calc(var(--scale, 1) * var(--sx, 1)), calc(var(--scale, 1) * var(--sy, 1)))
			rotate(var(--rot, 0deg));
		transform-origin: center bottom;
		transition: transform 110ms var(--ease-out);
	}
	/* Roughly his head and torso: the part of him a person would reach for,
	   and narrow enough that an outstretched arm in the `point` pose no longer
	   covers a button. Deliberately not the full silhouette — matching the
	   pose exactly would mean the grab target moved while he gestured, which
	   is a worse thing to hand someone than a slightly small one. */
	.hit {
		position: absolute;
		left: 30%;
		right: 30%;
		top: 0;
		bottom: 0;
		pointer-events: auto;
		cursor: grab;
		touch-action: none;
		-webkit-tap-highlight-color: transparent;
	}

	.held .hit {
		cursor: grabbing;
	}

	/* ══════════════════════════════════════════════════════════════════════
	   WHOLE-BODY MOTION
	   Limb motion belongs to the rig (rig.js + character3d/), which
	   poses every joint. What stays here is motion that moves the whole figure
	   at once, because only this element knows where he is on the page.
	   ══════════════════════════════════════════════════════════════════════ */

	.ch-dizzy .grab {
		animation: spin 1.2s linear infinite;
	}
	@keyframes spin {
		to { transform: scale(var(--scale, 1)) rotate(360deg); }
	}

	.ch-jump .grab,
	.ch-kick .grab {
		animation: hop 0.9s ease-in-out infinite;
	}
	@keyframes hop {
		0%, 100% { transform: scale(var(--scale, 1)) translateY(0); }
		45%      { transform: scale(var(--scale, 1)) translateY(-9%); }
	}

	@media (prefers-reduced-motion: reduce) {
		.ch-dizzy .grab,
		.ch-jump .grab,
		.ch-kick .grab {
			animation: none;
		}
	}

	/* ─── Bubble ───────────────────────────────────────────────────────────
	   Sits above him and flips to whichever side has room. Deliberately
	   capped in width: a speech bubble that spans the viewport stops reading
	   as speech. */
	/* On his own stage the bubble sits ABOVE him and stays inside his column.
	   Anchored beside him it reached across into the copy and sat on top of
	   the headline — the one thing a column layout is supposed to prevent. */
	.on-stage .bubble {
		left: 0;
		right: auto;
		bottom: calc(var(--scale, 1) * 400px);
		max-width: min(21rem, calc(var(--stage-w) - 3rem));
	}

	.bubble {
		pointer-events: auto;
		position: absolute;
		/* A hard ceiling on width as well as a side choice: on a narrow screen
		   there may be no side with enough room, and a clipped speech bubble
		   is worse than a narrow one. */
		max-width: min(17rem, calc(100vw - 7rem));
		/* Anchored to his head, which rises and falls with the scale. */
		bottom: calc(var(--scale, 1) * 360px);
		left: calc(var(--scale, 1) * 150px);
		width: max-content;
		max-width: min(17rem, 46vw);
		padding: 0.625rem 0.8125rem;
		border-radius: var(--r-lg);
		border-bottom-left-radius: var(--r-xs);
		animation: pop 280ms var(--ease-out);
	}
	.bubble.left {
		left: auto;
		right: calc(var(--scale, 1) * 150px);
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
		/* Sits just under the box, which is where his feet are: .grab scales
		   from `center bottom`, so the figure's base stays on the box's base
		   at every scale. (There was a second, dead margin-top above this one
		   trying to do the same job with arithmetic; it was overridden and
		   would have thrown the row 277px upward if it ever won.) */
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
		/* Anchored to the top of the VISIBLE figure, the same way the speech
		   bubble is. `bottom: 100%` put it at the top of the 420px box — but
		   the box only ever contains the figure at full hero scale, so in the
		   guide lane the menu floated roughly 200px above his head with
		   nothing joining the two. */
		bottom: calc(var(--scale, 1) * 420px + 0.5rem);
		left: calc(var(--scale, 1) * 20px);
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
		.bubble {
			left: calc(var(--scale, 1) * 110px);
		}
		.bubble.left {
			right: calc(var(--scale, 1) * 110px);
			left: auto;
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
