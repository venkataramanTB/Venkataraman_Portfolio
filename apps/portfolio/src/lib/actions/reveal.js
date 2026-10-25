/**
 * Scroll-entrance reveal.
 *
 * Entrances are the one place CSS transitions are the right tool: nothing can
 * grab an element mid-entrance, so there is no interruption to preserve, and a
 * declarative transition keeps the work off the main thread. Gesture-driven
 * motion uses springs instead — see $lib/motion/spring.js.
 *
 * One shared IntersectionObserver for the document rather than one per node.
 */

import { browser } from '$app/environment';

let observer = null;
const callbacks = new WeakMap();

function ensureObserver() {
	if (observer) return observer;
	observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				callbacks.get(entry.target)?.();
				observer.unobserve(entry.target);
				callbacks.delete(entry.target);
			}
		},
		// Fire a little before the element is fully on screen, so the motion
		// is finishing as the reader arrives rather than starting then.
		{ rootMargin: '0px 0px -12% 0px', threshold: 0.01 }
	);
	return observer;
}

/**
 * @param {HTMLElement} node
 * @param {object} [params]
 * @param {number} [params.delay=0]   ms
 * @param {number} [params.y=14]      px of travel; kept small deliberately
 * @param {number} [params.blur=0]    px — for surfaces that should materialise
 */
export function reveal(node, { delay = 0, y = 14, blur = 0 } = {}) {
	if (!browser) return {};

	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	node.style.opacity = '0';
	// Under reduced motion the element still arrives — it cross-fades in place
	// instead of travelling, which is the non-vestibular equivalent rather
	// than the absence of feedback.
	if (!reduced) {
		node.style.transform = `translate3d(0, ${y}px, 0)`;
		if (blur) node.style.filter = `blur(${blur}px)`;
		node.style.willChange = 'opacity, transform';
	}

	const show = () => {
		node.style.transition = reduced
			? `opacity 260ms linear ${delay}ms`
			: `opacity 620ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms,` +
			  `transform 720ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms,` +
			  `filter 620ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
		node.style.opacity = '1';
		node.style.transform = 'translate3d(0, 0, 0)';
		if (blur) node.style.filter = 'blur(0px)';
		node.addEventListener(
			'transitionend',
			() => {
				node.style.willChange = '';
				node.style.filter = '';
			},
			{ once: true }
		);
	};

	callbacks.set(node, show);
	ensureObserver().observe(node);

	return {
		destroy() {
			observer?.unobserve(node);
			callbacks.delete(node);
		}
	};
}
