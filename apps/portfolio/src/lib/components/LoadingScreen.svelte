<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  let el;
  let ctx;
  let phase = 0;
  let interval;

  const PHASES = [
    { msg: 'Initializing...',           detail: 'Setting up environment' },
    { msg: 'Waking up server...',       detail: 'Render cold start — may take ~30s' },
    { msg: 'Fetching portfolio data…',  detail: 'Connecting to database' },
    { msg: 'Almost ready…',             detail: 'Preparing your experience' },
  ];

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      gsap.from(el, { opacity: 0, duration: 0.5, ease: 'power2.out' });
    });

    interval = setInterval(() => {
      phase = (phase + 1) % PHASES.length;
    }, 5000);
  });

  export async function hide() {
    const g = await useGSAP();
    if (!g || !el) return;
    const { gsap } = g;
    return new Promise(resolve => {
      gsap.to(el, {
        opacity: 0,
        scale: 0.97,
        duration: 0.55,
        ease: 'power3.in',
        onComplete: resolve,
      });
    });
  }

  onDestroy(() => {
    ctx?.revert();
    clearInterval(interval);
  });
</script>

<div bind:this={el} class="overlay" aria-live="polite" aria-label="Loading portfolio">
  <div class="grid-bg" aria-hidden="true"></div>
  <div class="top-glow"  aria-hidden="true"></div>
  <div class="bot-glow"  aria-hidden="true"></div>

  <div class="card">
    <span class="label">Loading Portfolio</span>

    <div class="mono text-gradient">VTB</div>

    <div class="bar-track" aria-hidden="true">
      <div class="bar-fill"></div>
    </div>

    <div class="status">
      <span class="dot" aria-hidden="true"></span>
      <span>{PHASES[phase].msg}</span>
    </div>
    <p class="detail">{PHASES[phase].detail}</p>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* ── subtle grid ── */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(6, 182, 212, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(6, 182, 212, 0.04) 1px, transparent 1px);
    background-size: 64px 64px;
    pointer-events: none;
  }

  /* ── corner glows ── */
  .top-glow {
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 700px; height: 420px;
    background: radial-gradient(ellipse at top,
      rgba(6, 182, 212, 0.10) 0%, transparent 68%);
    pointer-events: none;
  }
  .bot-glow {
    position: absolute;
    bottom: 0; right: 0;
    width: 500px; height: 300px;
    background: radial-gradient(ellipse at bottom right,
      rgba(139, 92, 246, 0.07) 0%, transparent 65%);
    pointer-events: none;
  }

  /* ── card ── */
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 3rem 4rem;
    border: 1px solid var(--border);
    background: rgba(17, 17, 17, 0.55);
    backdrop-filter: blur(14px);
    gap: 0;
  }

  /* corner accents */
  .card::before,
  .card::after {
    content: '';
    position: absolute;
    width: 20px; height: 20px;
    border-color: var(--accent);
    border-style: solid;
    opacity: 0.6;
  }
  .card::before { top: -1px; left: -1px;  border-width: 1px 0 0 1px; }
  .card::after  { bottom: -1px; right: -1px; border-width: 0 1px 1px 0; }

  .label {
    font-size: 0.6rem;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 500;
    margin-bottom: 1.8rem;
  }

  .mono {
    font-size: clamp(3.5rem, 9vw, 6.5rem);
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1;
    margin-bottom: 2.5rem;
  }

  /* ── scan-line progress bar ── */
  .bar-track {
    width: 220px;
    height: 1px;
    background: var(--border);
    overflow: hidden;
    margin-bottom: 2rem;
    position: relative;
  }
  .bar-fill {
    position: absolute;
    top: 0; left: -65%;
    width: 65%;
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    animation: scan 1.8s ease-in-out infinite;
  }
  @keyframes scan {
    0%   { left: -65%; }
    100% { left: 100%; }
  }

  /* ── status ── */
  .status {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    color: var(--text);
    font-weight: 500;
    margin-bottom: 0.35rem;
    min-height: 1.4em;
  }

  .dot {
    display: inline-block;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--accent);
    flex-shrink: 0;
    animation: blink 1.3s ease-in-out infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.25; }
  }

  .detail {
    font-size: 0.6rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 400;
    margin: 0;
    min-height: 1.2em;
  }
</style>
