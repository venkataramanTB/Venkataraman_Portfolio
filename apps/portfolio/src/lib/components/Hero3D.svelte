<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { useGSAP } from '$lib/gsap.js';

  export let name = 'VENKATARAMAN TB';

  let canvasEl;
  let raf;
  let renderer, scene, camera, points, geometry;
  let ctx; // GSAP context
  let _gsap;

  // Shape state: 'text' | 'sphere' | 'torus'
  let shapeState = 'text';
  let textPositions  = null; // Float32Array
  let shapePositions = null; // Float32Array (current morph target)
  let isAnimating    = false;

  // ── Sample name text pixels from an offscreen canvas ─────────────────────
  function sampleTextPixels(text, count = 3500) {
    const W = 900, H = 220;
    const oc = document.createElement('canvas');
    oc.width  = W;
    oc.height = H;
    const octx = oc.getContext('2d');

    // Fit font to canvas width
    let fs = 140;
    octx.font = `900 ${fs}px 'Inter', 'Helvetica Neue', Arial, sans-serif`;
    while (octx.measureText(text).width > W - 20 && fs > 20) {
      fs -= 4;
      octx.font = `900 ${fs}px 'Inter', 'Helvetica Neue', Arial, sans-serif`;
    }

    octx.fillStyle = '#fff';
    octx.textAlign = 'center';
    octx.textBaseline = 'middle';
    octx.fillText(text, W / 2, H / 2);

    const data = octx.getImageData(0, 0, W, H).data;
    const candidates = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const alpha = data[(y * W + x) * 4 + 3];
        if (alpha > 128) candidates.push([x, y]);
      }
    }

    // Sample `count` points uniformly from candidates
    const step   = Math.max(1, Math.floor(candidates.length / count));
    const chosen = candidates.filter((_, i) => i % step === 0).slice(0, count);

    // Map to 3D: center at 0, scale to ~[-5, 5] on X, [-1.5, 1.5] on Y
    const scaleX = 10 / W;
    const scaleY = (10 * (H / W)) / H;
    const pos = new Float32Array(chosen.length * 3);
    chosen.forEach(([px, py], i) => {
      pos[i * 3]     = (px - W / 2) * scaleX;
      pos[i * 3 + 1] = -(py - H / 2) * scaleY;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.15; // tiny z jitter
    });
    return pos;
  }

  // ── Fibonacci sphere distribution ─────────────────────────────────────────
  function spherePositions(count, radius = 3.2) {
    const pos = new Float32Array(count * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y   = 1 - (i / (count - 1)) * 2;
      const r   = Math.sqrt(1 - y * y);
      const phi = golden * i;
      pos[i * 3]     = Math.cos(phi) * r * radius;
      pos[i * 3 + 1] = y * radius;
      pos[i * 3 + 2] = Math.sin(phi) * r * radius;
    }
    return pos;
  }

  // ── Torus distribution ────────────────────────────────────────────────────
  function torusPositions(count, R = 2.8, r = 1.0) {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = (i / count) * Math.PI * 2;
      const v = ((i * 7.3) % (Math.PI * 2));
      pos[i * 3]     = (R + r * Math.cos(v)) * Math.cos(u);
      pos[i * 3 + 1] = r * Math.sin(v);
      pos[i * 3 + 2] = (R + r * Math.cos(v)) * Math.sin(u);
    }
    return pos;
  }

  // ── Wave / DNA helix distribution ─────────────────────────────────────────
  function helixPositions(count, radius = 2.2, height = 5) {
    const pos = new Float32Array(count * 3);
    const turns = 4;
    for (let i = 0; i < count; i++) {
      const t   = i / count;
      const ang = t * Math.PI * 2 * turns;
      const strand = i % 2 === 0 ? 1 : -1;
      pos[i * 3]     = Math.cos(ang + strand * Math.PI) * radius;
      pos[i * 3 + 1] = t * height - height / 2;
      pos[i * 3 + 2] = Math.sin(ang + strand * Math.PI) * radius;
    }
    return pos;
  }

  // ── GSAP morph particles to a new position array ──────────────────────────
  function morphTo(targetPos, onComplete) {
    if (!_gsap || !geometry || isAnimating) return;
    isAnimating = true;

    const posAttr = geometry.attributes.position;
    const count   = posAttr.count;
    const proxy   = { t: 0 };

    // Snapshot current positions
    const from = new Float32Array(posAttr.array);

    _gsap.to(proxy, {
      t: 1,
      duration: 1.1,
      ease: 'power3.inOut',
      onUpdate() {
        const t = proxy.t;
        for (let i = 0; i < count * 3; i++) {
          posAttr.array[i] = from[i] + (targetPos[i] - from[i]) * t;
        }
        posAttr.needsUpdate = true;
      },
      onComplete() {
        isAnimating = false;
        onComplete?.();
      },
    });
  }

  // ── Mouse parallax ────────────────────────────────────────────────────────
  let mx = 0, my = 0;
  function onMouseMove(e) {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  // ── Hover cycle ───────────────────────────────────────────────────────────
  const shapeOrder = ['text', 'sphere', 'torus', 'helix'];
  let hoverIdx = 0;

  function onHoverEnter() {
    if (isAnimating) return;
    hoverIdx = (hoverIdx + 1) % shapeOrder.length;
    const next = shapeOrder[hoverIdx];
    const count = geometry.attributes.position.count;

    let target;
    if (next === 'text')   target = textPositions;
    else if (next === 'sphere') target = spherePositions(count);
    else if (next === 'torus')  target = torusPositions(count);
    else                        target = helixPositions(count);

    shapePositions = target;
    shapeState = next;
    morphTo(target);
  }

  function onHoverLeave() {
    // Only snap back if NOT in text state (text is default resting state)
    // Actually keep the shape to let user cycle — text returns via dedicated escape
  }

  // Double-click resets to text
  function onDblClick() {
    if (isAnimating || shapeState === 'text') return;
    hoverIdx = 0;
    shapeState = 'text';
    morphTo(textPositions);
  }

  onMount(async () => {
    if (!browser) return;

    const [THREE, gResult] = await Promise.all([
      import('three'),
      useGSAP(),
    ]);
    if (!gResult) return;
    _gsap = gResult.gsap;

    // ── Renderer ─────────────────────────────────────────────────────────────
    renderer = new THREE.WebGLRenderer({
      canvas: canvasEl,
      alpha:  true,
      antialias: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvasEl.offsetWidth, canvasEl.offsetHeight);

    // ── Scene + Camera ────────────────────────────────────────────────────────
    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      55,
      canvasEl.offsetWidth / canvasEl.offsetHeight,
      0.1,
      100
    );
    camera.position.z = 7;

    // ── Wait for fonts then sample text ───────────────────────────────────────
    await document.fonts.ready;
    textPositions = sampleTextPixels(name);
    const count = textPositions.length / 3;

    // ── Geometry ──────────────────────────────────────────────────────────────
    geometry = new THREE.BufferGeometry();

    // Start particles scattered randomly around canvas
    const scatter = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      scatter[i] = (Math.random() - 0.5) * 14;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(scatter.slice(), 3));

    // Vertex colors: cyan → violet gradient across particle index
    const colors = new Float32Array(count * 3);
    const cA = new THREE.Color(0x06b6d4); // cyan
    const cB = new THREE.Color(0x8b5cf6); // violet
    const tmp = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const t = i / count;
      tmp.lerpColors(cA, cB, t);
      colors[i * 3]     = tmp.r;
      colors[i * 3 + 1] = tmp.g;
      colors[i * 3 + 2] = tmp.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // ── Material ──────────────────────────────────────────────────────────────
    const material = new THREE.PointsMaterial({
      size:         0.055,
      vertexColors: true,
      transparent:  true,
      opacity:      0.9,
      sizeAttenuation: true,
      depthWrite:   false,
    });

    points = new THREE.Points(geometry, material);
    scene.add(points);

    // ── Entrance: scatter → converge to text ──────────────────────────────────
    const posAttr = geometry.attributes.position;
    const from    = new Float32Array(posAttr.array);
    const proxy   = { t: 0 };

    _gsap.to(proxy, {
      t: 1,
      duration: 1.8,
      delay: 0.3,
      ease: 'power3.out',
      onUpdate() {
        const t = proxy.t;
        for (let i = 0; i < count * 3; i++) {
          posAttr.array[i] = from[i] + (textPositions[i] - from[i]) * t;
        }
        posAttr.needsUpdate = true;
      },
    });

    // ── Resize observer ────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = canvasEl.offsetWidth;
      const h = canvasEl.offsetHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvasEl.parentElement);

    // ── Mouse ──────────────────────────────────────────────────────────────────
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    canvasEl.addEventListener('click', onHoverEnter);
    canvasEl.addEventListener('dblclick', onDblClick);

    // ── Render loop ───────────────────────────────────────────────────────────
    let clock = 0;
    function tick() {
      raf = requestAnimationFrame(tick);
      clock += 0.007;

      // Camera parallax
      camera.position.x += (mx * 1.2 - camera.position.x) * 0.04;
      camera.position.y += (-my * 0.7 - camera.position.y) * 0.04;

      // Slow rotation when in shape mode
      if (shapeState !== 'text') {
        points.rotation.y = clock * 0.18;
        points.rotation.x = Math.sin(clock * 0.25) * 0.12;
      } else {
        points.rotation.y *= 0.95; // dampen back to 0
        points.rotation.x *= 0.95;

        // Subtle breathing in text state
        const posArr = geometry.attributes.position.array;
        const textArr = textPositions;
        if (textArr) {
          for (let i = 0; i < count; i++) {
            const base = i * 3 + 2;
            posArr[base] = textArr[base] + Math.sin(clock * 1.2 + i * 0.08) * 0.04;
          }
          geometry.attributes.position.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    }
    tick();

    // ── Cleanup ref for onDestroy ─────────────────────────────────────────────
    canvasEl._cleanup = () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
    };
  });

  onDestroy(() => {
    if (!browser) return;
    if (canvasEl?._cleanup) canvasEl._cleanup();
    else {
      cancelAnimationFrame(raf);
      geometry?.dispose();
      renderer?.dispose();
    }
    ctx?.revert();
  });
</script>

<!-- Hover hint -->
<div class="relative w-full" style="height: clamp(160px, 28vw, 260px)">
  <canvas
    bind:this={canvasEl}
    class="absolute inset-0 w-full h-full cursor-pointer"
    style="display:block"
    title="Click to morph • Double-click to reset"
  ></canvas>

  <!-- Hint label fades in after 2s -->
  <p class="hero3d-hint absolute bottom-2 right-3 sec-num pointer-events-none"
     style="color: var(--border); font-size: 0.55rem; letter-spacing: 0.14em; opacity: 0;
            animation: fadeHint 0.5s 2.4s ease forwards">
    CLICK TO MORPH · DOUBLE-CLICK TO RESET
  </p>
</div>

<style>
  @keyframes fadeHint {
    to { opacity: 1; }
  }
</style>
