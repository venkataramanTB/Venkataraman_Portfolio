import { browser } from '$app/environment';

let _p = null;

/** One-time GSAP + ScrollTrigger + SplitText bootstrap. Safe to call from any onMount. */
export function useGSAP() {
  if (!browser) return Promise.resolve(null);
  if (_p) return _p;

  _p = (async () => {
    const { gsap } = await import('gsap');
    const [{ ScrollTrigger }, { SplitText }] = await Promise.all([
      import('gsap/ScrollTrigger'),
      import('gsap/SplitText'),
    ]);
    gsap.registerPlugin(ScrollTrigger, SplitText);
    gsap.config({ nullTargetWarn: false });
    gsap.defaults({ ease: 'power3.out' });
    return { gsap, ScrollTrigger, SplitText };
  })();

  return _p;
}
