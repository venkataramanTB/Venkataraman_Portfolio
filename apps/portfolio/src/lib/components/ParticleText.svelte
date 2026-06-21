<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  export let text    = '';
  export let color   = '#ebebeb';
  export let gap     = 4;
  export let dotSize = 2;
  export let speed   = 0.062;

  let canvas;
  let raf    = null;
  let ro     = null;
  let mouseX = -9999;
  let mouseY = -9999;
  let particles = [];
  let W = 0, H = 0;

  /* ── core init ─────────────────────────────────────────────────────────── */
  function init() {
    if (!canvas || !text) return;
    cancelAnimationFrame(raf);
    raf = null;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.parentElement?.clientWidth || 600;
    if (!W) return;

    /* font size: fill ~90 % of container width */
    const mc = document.createElement('canvas').getContext('2d');
    mc.font = `700 100px "Space Grotesk", sans-serif`;
    const measured = mc.measureText(text).width;
    let fs = Math.floor(100 * W * 0.9 / measured);
    fs = Math.max(20, Math.min(fs, 220));

    H = Math.ceil(fs * 1.32);
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = `${W}px`;
    canvas.style.height = `${H}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    /* draw text offscreen and sample lit pixels */
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const oc = off.getContext('2d');
    oc.font = `700 ${fs}px "Space Grotesk", sans-serif`;
    const tw = oc.measureText(text).width;
    oc.fillStyle = '#fff';
    oc.fillText(text, (W - tw) / 2, H * 0.77);

    const { data } = oc.getImageData(0, 0, W, H);
    const pts = [];
    for (let y = 0; y < H; y += gap)
      for (let x = 0; x < W; x += gap)
        if (data[(y * W + x) * 4 + 3] > 128)
          pts.push([x, y]);

    /* shuffle for organic entrance order */
    for (let i = pts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pts[i], pts[j]] = [pts[j], pts[i]];
    }

    particles = pts.map(([tx, ty]) => ({
      tx, ty,
      x: Math.random() * W,
      y: (Math.random() - 0.25) * H * 5,
      alpha: 0,
    }));

    /* ── draw loop ─────────────────────────────────────────────────────── */
    function draw() {
      ctx.clearRect(0, 0, W, H);
      let active = 0;
      const PUSH = 55;

      for (const p of particles) {
        /* mouse repulsion */
        const mdx = p.x - mouseX;
        const mdy = p.y - mouseY;
        const md  = Math.hypot(mdx, mdy);

        if (md < PUSH && md > 0) {
          const f = (PUSH - md) / PUSH;
          p.x += (mdx / md) * f * 5;
          p.y += (mdy / md) * f * 5;
          active++;
        } else {
          p.x += (p.tx - p.x) * speed;
          p.y += (p.ty - p.y) * speed;
          if (Math.hypot(p.tx - p.x, p.ty - p.y) > 0.4) active++;
        }

        p.alpha = Math.min(1, p.alpha + 0.018);
        if (p.alpha < 1) active++;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = color;
        ctx.fillRect(p.x | 0, p.y | 0, dotSize, dotSize);
      }

      ctx.globalAlpha = 1;
      raf = (active > 0 || mouseX > -1000) ? requestAnimationFrame(draw) : null;
    }

    raf = requestAnimationFrame(draw);

    /* mouse interaction */
    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      mouseX = (e.clientX - r.left) * (W / r.width);
      mouseY = (e.clientY - r.top)  * (H / r.height);
      if (!raf) raf = requestAnimationFrame(draw);
    }
    function onLeave() {
      mouseX = -9999; mouseY = -9999;
      if (!raf) raf = requestAnimationFrame(draw);
    }
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
  }

  onMount(async () => {
    await document.fonts.ready;
    requestAnimationFrame(init);

    ro = new ResizeObserver(() => init());
    if (canvas?.parentElement) ro.observe(canvas.parentElement);
  });

  onDestroy(() => {
    if (browser) {
      cancelAnimationFrame(raf);
      ro?.disconnect();
    }
  });
</script>

<canvas bind:this={canvas} class="w-full block cursor-none"></canvas>
