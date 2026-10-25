/**
 * Spring runtime — the motion substrate for the whole interface.
 *
 * Why hand-rolled instead of GSAP tweens or CSS transitions: both are
 * duration-based and animate *to* a target from a remembered start value. They
 * cannot be grabbed mid-flight, cannot inherit a pointer's release velocity,
 * and produce a visible velocity discontinuity when a gesture reverses. A
 * spring integrates from whatever the value is *right now* and whatever
 * velocity it already carries, which is exactly what interruptibility needs.
 *
 * Parameterised the way Apple exposes springs to designers — `bounce` and
 * `response` — rather than mass/stiffness/damping:
 *
 *   bounce   0    critically damped, settles with no overshoot (default UI)
 *            0.2  a little overshoot — only when a flick preceded it
 *   response      seconds to substantially reach the target. Not a duration:
 *                 a spring has no fixed duration, the settle time emerges.
 */

const EPS_X = 0.0005; // settled when within this of target …
const EPS_V = 0.0005; // … and slower than this

/**
 * One scalar spring. 2D motion uses two of these, never one spring on the
 * 2D distance — a single spring desyncs the moment X and Y carry different
 * velocities.
 */
export class Spring {
	/**
	 * @param {number} value   initial (and current) value
	 * @param {object} [opts]
	 * @param {number} [opts.bounce=0]     0 = no overshoot, ~0.2 = slight
	 * @param {number} [opts.response=0.4] seconds to reach the target
	 */
	constructor(value = 0, { bounce = 0, response = 0.4 } = {}) {
		this.value = value;
		this.target = value;
		this.velocity = 0;
		this.configure({ bounce, response });
	}

	configure({ bounce = this._bounce, response = this._response } = {}) {
		this._bounce = bounce;
		this._response = Math.max(response, 0.0001);
		// Apple's mapping: response is the natural period, bounce the inverse
		// of the damping ratio's distance from critical.
		this.omega = (2 * Math.PI) / this._response;
		this.zeta = 1 - bounce;
		return this;
	}

	/** Re-aim without discarding momentum. This is what makes reversal smooth. */
	setTarget(target, velocity) {
		this.target = target;
		if (velocity !== undefined) this.velocity = velocity;
		return this;
	}

	/** Hard reset — only for teardown or an off-screen jump. */
	set(value, velocity = 0) {
		this.value = value;
		this.target = value;
		this.velocity = velocity;
		return this;
	}

	get settled() {
		return (
			Math.abs(this.target - this.value) < EPS_X && Math.abs(this.velocity) < EPS_V
		);
	}

	/**
	 * Semi-implicit Euler, substepped. Substepping matters: a dropped frame
	 * with a stiff spring and a single large dt goes unstable and visibly
	 * explodes, which is worse than the frame drop it came from.
	 */
	step(dt) {
		const steps = Math.min(Math.ceil(dt / (1 / 240)), 16);
		const h = dt / steps;
		const { omega, zeta } = this;

		for (let i = 0; i < steps; i++) {
			const displacement = this.value - this.target;
			const accel = -omega * omega * displacement - 2 * zeta * omega * this.velocity;
			this.velocity += accel * h;
			this.value += this.velocity * h;
		}

		if (this.settled) {
			this.value = this.target;
			this.velocity = 0;
		}
		return this.value;
	}
}

/* ───────────────────────────── shared clock ──────────────────────────────── */

const running = new Set();
let frame = 0;
let last = 0;

function tick(now) {
	// First frame after an idle gap: clamp dt so a backgrounded tab doesn't
	// resume by teleporting every spring in the document.
	const dt = last ? Math.min((now - last) / 1000, 1 / 20) : 1 / 60;
	last = now;

	for (const job of running) {
		let alive = false;
		for (const s of job.springs) {
			s.step(dt);
			if (!s.settled) alive = true;
		}
		job.render(job.springs);
		if (!alive) {
			running.delete(job);
			job.onRest?.();
		}
	}

	frame = running.size ? requestAnimationFrame(tick) : ((last = 0), 0);
}

/**
 * Drive one or more springs on the shared rAF clock. One clock for the whole
 * document, so every spring in a composed transition advances on the same
 * timestamp and nothing tears.
 *
 * @param {Spring[]} springs
 * @param {(springs: Spring[]) => void} render  compositor-only writes
 * @param {() => void} [onRest]
 */
export function drive(springs, render, onRest) {
	// Re-aiming an already-driven set must not enqueue a second job.
	for (const job of running) {
		if (job.render === render) {
			job.onRest = onRest;
			if (!frame) frame = requestAnimationFrame(tick);
			return () => running.delete(job);
		}
	}

	const job = { springs, render, onRest };
	running.add(job);
	render(springs);
	if (!frame) frame = requestAnimationFrame(tick);
	return () => running.delete(job);
}

/* ─────────────────────────────── physics ─────────────────────────────────── */

/**
 * Where a flick is *going*, not where the finger left off. Snapping to the
 * nearest point from the release position ignores the throw entirely; a fast
 * flick and a slow drag that end on the same pixel should not land in the
 * same place.
 *
 * This is the exponential-decay form from Apple's own sample code, not the
 * textbook v²/(2a) — the two disagree substantially at high velocity.
 *
 * @param {number} velocity px/s at release
 * @param {number} [decelerationRate] 0.998 scroll-like, 0.99 snappier
 */
export function project(velocity, decelerationRate = 0.998) {
	return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Progressive resistance past a boundary. A hard stop reads as a frozen
 * interface; continuous resistance reads as responsive-but-empty.
 *
 * @param {number} overshoot how far past the bound, px
 * @param {number} dimension size of the dragged axis, px
 */
export function rubberband(overshoot, dimension, constant = 0.55) {
	if (!dimension) return 0;
	return (
		(overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot))
	);
}

/** Clamp with rubber-banding outside [min, max] instead of a hard stop. */
export function withRubberband(value, min, max, dimension) {
	if (value > max) return max + rubberband(value - max, dimension);
	if (value < min) return min + rubberband(value - min, dimension);
	return value;
}

export function nearest(value, points) {
	let best = points[0];
	let bestD = Infinity;
	for (const p of points) {
		const d = Math.abs(p - value);
		if (d < bestD) {
			bestD = d;
			best = p;
		}
	}
	return best;
}

/* ─────────────────────────── preference gates ────────────────────────────── */

const mq = (q) =>
	typeof window !== 'undefined' && window.matchMedia
		? window.matchMedia(q)
		: { matches: false, addEventListener() {}, removeEventListener() {} };

/**
 * Reduced motion does not mean no feedback — it means a non-vestibular
 * equivalent. Call sites keep their opacity/colour response and drop the
 * travel and the overshoot.
 */
export const prefersReducedMotion = () => mq('(prefers-reduced-motion: reduce)').matches;

/** Spring config that collapses to an instant settle under reduced motion. */
export function springConfig(bounce, response) {
	return prefersReducedMotion()
		? { bounce: 0, response: 0.001 }
		: { bounce, response };
}

/** House presets. Values Apple ships, not invented ones. */
export const SPRINGS = {
	/** Reposition / layout move. Graceful, never distracting. */
	move: { bounce: 0, response: 0.4 },
	/** Press and other micro-feedback. Must feel immediate. */
	press: { bounce: 0, response: 0.22 },
	/** Sheets and drawers — momentum-driven, so a little overshoot is right. */
	sheet: { bounce: 0.2, response: 0.3 },
	/** Rotation. */
	rotate: { bounce: 0.2, response: 0.4 },
	/** Thrown / flicked content. */
	fling: { bounce: 0.2, response: 0.45 }
};
