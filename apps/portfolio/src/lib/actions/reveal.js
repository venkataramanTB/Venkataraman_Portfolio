/**
 * Scroll-entrance reveal.
 *
 * ── The rule this is built around ─────────────────────────────────────────
 * An animation may only ever ADD motion. It must never be the thing that
 * makes content visible, because then every way the animation can fail is
 * also a way the content can disappear.
 *
 * The previous version broke that rule: it set `opacity: 0` inline on mount
 * and relied on an IntersectionObserver callback arriving to undo it. When
 * the observer didn't fire — an unusual viewport, a capture before the
 * callback ran, a browser without IO — the entire page below the hero was
 * blank vermilion. Which is exactly what happened.
 *
 * So now:
 *  - Nothing is hidden until we have proven we can unhide it (observer
 *    constructed, element observed, and a watchdog armed).
 *  - A watchdog reveals the element regardless after a short delay, so the
 *    worst case is "appeared without animating" rather than "never appeared".
 *  - Reduced motion skips hiding altogether.
 */

import { browser } from '$app/environment';

/** If the observer hasn't fired by now, show the content anyway. */
const WATCHDOG_MS = 1600;

let observer = null;
const shown = new WeakMap();

function ensureObserver() {
	if (observer) return observer;
	if (typeof IntersectionObserver === 'undefined') return null;
	observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				shown.get(entry.target)?.();
			}
		},
		// Fire a little before the element is fully on screen, so the motion is
		// finishing as the reader arrives rather than starting then.
		{ rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
	);
	return observer;
}

/**
 * @param {HTMLElement} node
 * @param {object} [params]
 * @param {number} [params.delay=0]  ms
 * @param {number} [params.y=18]     px of travel
 */
export function reveal(node, { delay = 0, y = 18 } = {}) {
	if (!browser) return {};

	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const io = ensureObserver();

	// No observer, or the reader asked for less motion: leave the element
	// exactly as the stylesheet drew it. This is the branch that guarantees
	// content is never lost.
	if (!io || reduced) return {};

	let done = false;
	let timer;

	const show = () => {
		if (done) return;
		done = true;
		clearTimeout(timer);
		io.unobserve(node);
		shown.delete(node);

		node.style.transition =
			`opacity 640ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms,` +
			`transform 820ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
		node.style.opacity = '1';
		node.style.transform = 'none';
		node.addEventListener(
			'transitionend',
			() => {
				// Clean up so the element carries no leftover inline state.
				node.style.transition = '';
				node.style.willChange = '';
			},
			{ once: true }
		);
	};

	// Only NOW is it safe to hide it: the observer exists, the callback is
	// registered and the watchdog is armed, so something is guaranteed to
	// bring it back.
	shown.set(node, show);
	node.style.opacity = '0';
	node.style.transform = `translate3d(0, ${y}px, 0)`;
	node.style.willChange = 'opacity, transform';

	io.observe(node);
	timer = setTimeout(show, WATCHDOG_MS + delay);

	return {
		destroy() {
			clearTimeout(timer);
			io.unobserve(node);
			shown.delete(node);
		}
	};
}
