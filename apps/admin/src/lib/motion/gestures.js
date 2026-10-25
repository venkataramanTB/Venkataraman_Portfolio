/**
 * Gesture primitives. Everything here tracks continuously and reports every
 * move, never only a final state — a `swipeleft`-style event that fires once
 * at the end throws away the tracking the interface needs to give feedback
 * *during* the gesture.
 */

import { Spring, drive, SPRINGS, springConfig, prefersReducedMotion } from './spring.js';

/** Movement required before we commit to a direction. ~10px, Apple's figure. */
const HYSTERESIS = 10;
/** Velocity is averaged over this window, so one jittery last frame can't lie. */
const VELOCITY_WINDOW = 80; // ms

class VelocityTracker {
	constructor() {
		this.samples = [];
	}
	add(x, y, t) {
		this.samples.push({ x, y, t });
		const cutoff = t - VELOCITY_WINDOW;
		while (this.samples.length > 2 && this.samples[0].t < cutoff) this.samples.shift();
	}
	/** @returns {{x: number, y: number}} px/s */
	get() {
		if (this.samples.length < 2) return { x: 0, y: 0 };
		const first = this.samples[0];
		const last = this.samples[this.samples.length - 1];
		const dt = (last.t - first.t) / 1000;
		if (dt <= 0) return { x: 0, y: 0 };
		return { x: (last.x - first.x) / dt, y: (last.y - first.y) / dt };
	}
	reset() {
		this.samples.length = 0;
	}
}

/**
 * Svelte action: continuous drag tracking.
 *
 * Reports `onMove` 1:1 with the pointer for the whole gesture, and hands the
 * release velocity to `onEnd` so the caller can project momentum and hand off
 * to a spring with no seam between dragging and animating.
 *
 * @param {HTMLElement} node
 * @param {object} params
 * @param {'x'|'y'|'both'} [params.axis='both']
 * @param {(s: {dx:number, dy:number, vx:number, vy:number, event:PointerEvent}) => void} [params.onMove]
 * @param {(s: {dx:number, dy:number, vx:number, vy:number}) => void} [params.onEnd]
 * @param {() => void} [params.onStart]
 * @param {boolean} [params.enabled=true]
 */
export function draggable(node, params = {}) {
	let opts = { axis: 'both', enabled: true, ...params };

	const tracker = new VelocityTracker();
	let pointerId = null;
	let startX = 0;
	let startY = 0;
	let committed = false;

	function onPointerDown(e) {
		if (!opts.enabled || pointerId !== null) return;
		// Let the browser keep text selection and middle-click behaviour.
		if (e.button !== 0 && e.pointerType === 'mouse') return;

		pointerId = e.pointerId;
		startX = e.clientX;
		startY = e.clientY;
		committed = false;
		tracker.reset();
		tracker.add(e.clientX, e.clientY, e.timeStamp);

		// Capture so tracking survives the pointer leaving the element's box.
		// Without this, a fast drag that exits the bounds silently dies.
		node.setPointerCapture(e.pointerId);
		node.addEventListener('pointermove', onPointerMove);
		node.addEventListener('pointerup', onPointerUp);
		node.addEventListener('pointercancel', onPointerUp);
	}

	function onPointerMove(e) {
		if (e.pointerId !== pointerId) return;
		tracker.add(e.clientX, e.clientY, e.timeStamp);

		const dx = e.clientX - startX;
		const dy = e.clientY - startY;

		if (!committed) {
			const travelled = opts.axis === 'y' ? Math.abs(dy) : opts.axis === 'x' ? Math.abs(dx) : Math.hypot(dx, dy);
			if (travelled < HYSTERESIS) return;

			// All plausible gestures were tracked in parallel until now; intent
			// is clear, so cancel the losers. A mostly-vertical drag on a
			// horizontal rail belongs to the page scroll, not to us.
			if (opts.axis === 'x' && Math.abs(dy) > Math.abs(dx)) return release();
			if (opts.axis === 'y' && Math.abs(dx) > Math.abs(dy)) return release();

			committed = true;
			node.dataset.dragging = 'true';
			opts.onStart?.();
		}

		// Only now is it ours; suppressing scroll earlier would steal gestures
		// that were never meant for this element.
		if (e.cancelable) e.preventDefault();

		const v = tracker.get();
		opts.onMove?.({ dx, dy, vx: v.x, vy: v.y, event: e });
	}

	function onPointerUp(e) {
		if (e.pointerId !== pointerId) return;
		const dx = e.clientX - startX;
		const dy = e.clientY - startY;
		const v = tracker.get();
		const wasCommitted = committed;
		release();
		if (wasCommitted) opts.onEnd?.({ dx, dy, vx: v.x, vy: v.y });
	}

	function release() {
		if (pointerId !== null && node.hasPointerCapture?.(pointerId)) {
			node.releasePointerCapture(pointerId);
		}
		node.removeEventListener('pointermove', onPointerMove);
		node.removeEventListener('pointerup', onPointerUp);
		node.removeEventListener('pointercancel', onPointerUp);
		pointerId = null;
		committed = false;
		delete node.dataset.dragging;
	}

	node.addEventListener('pointerdown', onPointerDown);
	// touch-action is what actually stops the browser from claiming the gesture
	// before our handlers ever see it.
	node.style.touchAction = opts.axis === 'x' ? 'pan-y' : opts.axis === 'y' ? 'pan-x' : 'none';

	return {
		update(next) {
			opts = { axis: 'both', enabled: true, ...next };
			node.style.touchAction = opts.axis === 'x' ? 'pan-y' : opts.axis === 'y' ? 'pan-x' : 'none';
		},
		destroy() {
			release();
			node.removeEventListener('pointerdown', onPointerDown);
		}
	};
}

/**
 * Svelte action: press feedback on pointer-*down*.
 *
 * Waiting for `click` to show that a control was hit is the single most common
 * way a web interface feels dead — the gap is perceptible even at 60fps. The
 * scale runs on a spring so an interrupted press (pointer dragged away and
 * back) is continuous rather than a cut.
 *
 * @param {HTMLElement} node
 * @param {{scale?: number, enabled?: boolean}} [params]
 */
export function press(node, params = {}) {
	let opts = { scale: 0.97, enabled: true, ...params };

	// Reduced motion keeps the feedback, drops the travel: the element reports
	// the press through its own :active styling instead of moving.
	if (prefersReducedMotion()) return { update(n) { opts = { ...opts, ...n }; }, destroy() {} };

	const s = new Spring(1, springConfig(SPRINGS.press.bounce, SPRINGS.press.response));
	const render = () => {
		node.style.transform = `scale(${s.value})`;
	};

	let down = false;

	const to = (v) => {
		s.setTarget(v);
		drive([s], render, () => {
			if (s.value === 1) node.style.willChange = '';
		});
	};

	function onDown(e) {
		if (!opts.enabled) return;
		if (e.button !== 0 && e.pointerType === 'mouse') return;
		down = true;
		node.style.willChange = 'transform';
		to(opts.scale);
	}
	function onUp() {
		if (!down) return;
		down = false;
		to(1);
	}

	node.addEventListener('pointerdown', onDown);
	// Release on the window: a press that ends outside the element must still
	// un-press, or the control stays visually stuck.
	window.addEventListener('pointerup', onUp);
	window.addEventListener('pointercancel', onUp);
	node.addEventListener('pointerleave', onUp);

	return {
		update(next) {
			opts = { scale: 0.97, enabled: true, ...next };
		},
		destroy() {
			node.removeEventListener('pointerdown', onDown);
			node.removeEventListener('pointerleave', onUp);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
			node.style.transform = '';
			node.style.willChange = '';
		}
	};
}

/**
 * Svelte action: pointer-tracked spotlight. Writes two custom properties the
 * stylesheet reads, so the highlight is pure paint and never triggers layout.
 * Skipped entirely for coarse pointers, where there is no hover to track.
 */
export function spotlight(node) {
	if (typeof window === 'undefined') return {};
	if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return {};

	let raf = 0;
	let px = 0;
	let py = 0;

	const write = () => {
		raf = 0;
		node.style.setProperty('--px', `${px}%`);
		node.style.setProperty('--py', `${py}%`);
	};

	function onMove(e) {
		const r = node.getBoundingClientRect();
		px = ((e.clientX - r.left) / r.width) * 100;
		py = ((e.clientY - r.top) / r.height) * 100;
		// One write per frame. pointermove can fire well above display rate on
		// a high-polling-rate mouse.
		if (!raf) raf = requestAnimationFrame(write);
	}
	function onLeave() {
		node.style.removeProperty('--px');
		node.style.removeProperty('--py');
	}

	node.addEventListener('pointermove', onMove);
	node.addEventListener('pointerleave', onLeave);

	return {
		destroy() {
			if (raf) cancelAnimationFrame(raf);
			node.removeEventListener('pointermove', onMove);
			node.removeEventListener('pointerleave', onLeave);
		}
	};
}
