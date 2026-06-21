import { browser } from '$app/environment';
import { useGSAP } from '$lib/gsap.js';

/**
 * Svelte action: scroll-reveal powered by GSAP ScrollTrigger.
 * Drop-in replacement for the old IntersectionObserver version.
 * `delay` is in ms (same API as before), converted to seconds internally.
 */
export function reveal(node, { delay = 0, y = 44, duration = 0.75 } = {}) {
  if (!browser) return {};

  let tw;
  let gone = false;

  useGSAP().then(g => {
    if (!g || gone || !node.isConnected) return;
    const { gsap } = g;

    tw = gsap.fromTo(
      node,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay: delay / 1000,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: node,
          start: 'top 87%',
          toggleActions: 'play none none none',
        },
      }
    );
  });

  return {
    destroy() {
      gone = true;
      tw?.scrollTrigger?.kill();
      tw?.kill();
    },
  };
}
