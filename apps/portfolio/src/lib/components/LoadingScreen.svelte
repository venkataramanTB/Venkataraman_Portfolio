<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  let el, barEl;
  let ctx;
  let phase = 0;
  let elapsed = 0;
  let interval, ticker;

  // Honest about the cold start rather than cheerful about it.
  const PHASES = [
    { code: 'P-01', msg: 'Initialising',   detail: 'Building render environment' },
    { code: 'P-02', msg: 'Waking server', detail: 'Render cold start — up to 30s' },
    { code: 'P-03', msg: 'Fetching data', detail: 'Querying Postgres' },
    { code: 'P-04', msg: 'Composing',     detail: 'Laying out document' },
  ];

  $: current = PHASES[phase];

  onMount(async () => {
    ticker = setInterval(() => (elapsed += 1), 1000);
    interval = setInterval(() => {
      phase = Math.min(phase + 1, PHASES.length - 1);
    }, 6000);

    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      gsap.from(el, { opacity: 0, duration: 0.3, ease: 'none' });
      // Indeterminate sweep: we genuinely don't know how long the cold start takes,
      // so this reads as activity, not as a fake percentage.
      gsap.fromTo(
        barEl,
        { scaleX: 0.04, transformOrigin: 'left' },
        {
          scaleX: 1,
          duration: 2.2,
          ease: 'power1.inOut',
          repeat: -1,
          yoyo: true,
          transformOrigin: 'left',
        }
      );
    });
  });

  export async function hide() {
    const g = await useGSAP();
    if (!g || !el) return;
    const { gsap } = g;
    return new Promise((resolve) => {
      // Shutter up — matches the panel/plate wipes used elsewhere
      gsap.to(el, {
        clipPath: 'inset(0 0 100% 0)',
        duration: 0.5,
        ease: 'expo.inOut',
        onComplete: resolve,
      });
    });
  }

  onDestroy(() => {
    ctx?.revert();
    clearInterval(interval);
    clearInterval(ticker);
  });
</script>

<div bind:this={el} class="boot" role="status" aria-live="polite">
  <div class="shell boot-inner">
    <!-- Header -->
    <div class="boot-head">
      <span class="t-micro">&#91; Loading document &#93;</span>
      <span class="t-micro clock">T+{String(elapsed).padStart(3, '0')}s</span>
    </div>

    <hr class="band-rule-heavy" />

    <!-- Macro status -->
    <p class="boot-macro">{current.msg}<span class="blink caret">_</span></p>

    <!-- Progress -->
    <div class="track" aria-hidden="true">
      <div bind:this={barEl} class="track-fill"></div>
    </div>

    <!-- Phase log -->
    <ol class="phases">
      {#each PHASES as p, i}
        <li class="phase" class:is-done={i < phase} class:is-now={i === phase}>
          <span class="t-idx">{p.code}</span>
          <span class="phase-msg">{p.msg}</span>
          <span class="phase-detail">{p.detail}</span>
          <span class="phase-mark" aria-hidden="true">
            {i < phase ? '×' : i === phase ? '›' : '·'}
          </span>
        </li>
      {/each}
    </ol>

    <div class="hazard-stripes boot-stripe" aria-hidden="true"></div>
  </div>
</div>

<style>
  .boot {
    position: fixed;
    inset: 0;
    z-index: var(--z-modal);
    background: var(--paper);
    display: flex;
    flex-direction: column;
    justify-content: center;
    will-change: clip-path;
  }

  .boot-inner { width: 100%; }

  .boot-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.625rem;
  }
  .clock { color: var(--ink-4); font-variant-numeric: tabular-nums; }

  .boot-macro {
    margin: clamp(1.5rem, 4vh, 2.5rem) 0 clamp(1.25rem, 3vh, 2rem);
    font-family: var(--font-display);
    font-weight: 900;
    font-size: clamp(2rem, 7vw, 5rem);
    line-height: 0.9;
    letter-spacing: -0.04em;
    text-transform: uppercase;
    color: var(--ink);
  }
  .caret { color: var(--hazard); }

  .track {
    height: 4px;
    background: var(--paper-sunk);
    border: 1px solid var(--rule);
    overflow: hidden;
    margin-bottom: clamp(1.5rem, 4vh, 2.5rem);
  }
  .track-fill {
    height: 100%;
    width: 100%;
    background: var(--hazard);
    will-change: transform;
  }

  .phases {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--rule-strong);
    max-width: 640px;
  }

  .phase {
    display: grid;
    grid-template-columns: 3.5rem minmax(0, 8rem) minmax(0, 1fr) 1.5rem;
    gap: 0.875rem;
    align-items: baseline;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--rule);
    opacity: 0.4;
    transition: opacity 300ms var(--ease-out);
  }
  .phase.is-done { opacity: 0.75; }
  .phase.is-now  { opacity: 1; }

  .phase-msg {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--ink);
  }
  .phase-detail {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--ink-3);
  }
  .phase-mark { text-align: right; color: var(--ink-4); }
  .phase.is-now .phase-mark { color: var(--hazard); }

  @media (max-width: 600px) {
    .phase { grid-template-columns: 3.25rem minmax(0, 1fr) 1.5rem; }
    .phase-detail { display: none; }
  }

  .boot-stripe {
    height: 10px;
    opacity: 0.16;
    margin-top: clamp(1.5rem, 4vh, 2.5rem);
  }
</style>
