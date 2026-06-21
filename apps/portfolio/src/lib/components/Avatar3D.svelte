<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  let canvasEl;
  let raf;
  let renderer, scene, camera;

  onMount(async () => {
    if (!browser) return;

    const THREE = await import('three');
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

    const w = canvasEl.offsetWidth  || 400;
    const h = canvasEl.offsetHeight || 600;

    // ── Renderer ────────────────────────────────────────────────────────────
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping    = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // ── Scene + Camera ───────────────────────────────────────────────────────
    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
    camera.position.set(0, 1.1, 4.8);
    camera.lookAt(0, 0.9, 0);

    // ── Lighting ─────────────────────────────────────────────────────────────
    // Soft ambient
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));

    // Key light (warm white, from front-left)
    const key = new THREE.DirectionalLight(0xfff5e0, 2.2);
    key.position.set(2, 5, 4);
    scene.add(key);

    // Cyan rim (back-left)
    const rimCyan = new THREE.DirectionalLight(0x06b6d4, 1.6);
    rimCyan.position.set(-4, 3, -3);
    scene.add(rimCyan);

    // Violet fill (back-right)
    const fillViolet = new THREE.DirectionalLight(0x8b5cf6, 0.9);
    fillViolet.position.set(4, 0, -2);
    scene.add(fillViolet);

    // Ground glow — cyan point at feet level
    const footGlow = new THREE.PointLight(0x06b6d4, 1.2, 2.5);
    footGlow.position.set(0, 0.05, 1.2);
    scene.add(footGlow);

    // ── Load GLB ─────────────────────────────────────────────────────────────
    let modelRef  = null;
    let modelBaseY = 0;
    let mixer     = null;

    const loader = new GLTFLoader();
    loader.load(
      '/models/avatar.glb',
      (gltf) => {
        const model = gltf.scene;

        // Auto-fit: normalize height to 2.2 units, plant feet at y=0
        const box    = new THREE.Box3().setFromObject(model);
        const size   = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const s      = 2.2 / size.y;

        model.scale.setScalar(s);
        model.position.set(
          -center.x * s,
          -box.min.y * s,
          -center.z * s,
        );
        modelBaseY = model.position.y;

        scene.add(model);
        modelRef = model;

        // Play first animation clip if Tripo baked one in
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
        }
      },
      undefined,
      () => { /* file not yet dropped — silent until it arrives */ },
    );

    // ── Resize ───────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (!canvasEl) return;
      const nw = canvasEl.offsetWidth;
      const nh = canvasEl.offsetHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvasEl.parentElement ?? canvasEl);

    // ── Render loop ──────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    function tick() {
      raf = requestAnimationFrame(tick);
      const dt = clock.getDelta();
      const t  = clock.elapsedTime;

      mixer?.update(dt);

      if (modelRef) {
        // Subtle idle: gentle side sway + micro bob
        modelRef.rotation.y = Math.sin(t * 0.38) * 0.07;
        modelRef.position.y = modelBaseY + Math.sin(t * 0.82) * 0.022;
      }

      renderer.render(scene, camera);
    }
    tick();

    canvasEl._cleanup = () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
    };
  });

  onDestroy(() => {
    if (!browser) return;
    canvasEl?._cleanup?.();
  });
</script>

<canvas bind:this={canvasEl} class="w-full h-full block" style="display:block"></canvas>
