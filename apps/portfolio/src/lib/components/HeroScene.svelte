<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { useGSAP } from '$lib/gsap.js';

  export let name = 'VENKATARAMAN TB';

  let canvasEl;
  let raf;
  let renderer, scene, camera;
  let _gsap;
  let mx = 0, my = 0;

  function onMouseMove(e) {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  onMount(async () => {
    if (!browser) return;

    const [THREE, gResult, { FontLoader }, { TextGeometry }, { GLTFLoader }] = await Promise.all([
      import('three'),
      useGSAP(),
      import('three/examples/jsm/loaders/FontLoader.js'),
      import('three/examples/jsm/geometries/TextGeometry.js'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
    ]);
    if (!gResult) return;
    _gsap = gResult.gsap;

    const w = canvasEl.offsetWidth  || 900;
    const h = canvasEl.offsetHeight || 520;

    // ── Renderer ─────────────────────────────────────────────────────────────
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace    = THREE.SRGBColorSpace;
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled   = true;
    renderer.shadowMap.type      = THREE.PCFSoftShadowMap;

    // ── Scene + Camera ────────────────────────────────────────────────────────
    scene  = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 1.8, 10);
    camera.lookAt(0, 1.2, 0);

    // ── Lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const key = new THREE.DirectionalLight(0xfff8f0, 2.2);
    key.position.set(4, 8, 6);
    key.castShadow           = true;
    key.shadow.mapSize.width = key.shadow.mapSize.height = 1024;
    scene.add(key);

    // Cyan rim — comes from behind-left
    const rimCyan = new THREE.DirectionalLight(0x06b6d4, 2.0);
    rimCyan.position.set(-6, 3, -5);
    scene.add(rimCyan);

    // Violet fill — behind-right
    const fillViolet = new THREE.DirectionalLight(0x8b5cf6, 1.1);
    fillViolet.position.set(6, 0, -4);
    scene.add(fillViolet);

    // Glow point behind text
    const textGlow = new THREE.PointLight(0x06b6d4, 2.8, 8);
    textGlow.position.set(0, 1.6, 1.8);
    scene.add(textGlow);

    // Shadow-catcher plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.2 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Cross-load coordination ───────────────────────────────────────────────
    let textWidth      = 0;
    let placeAvatarFn  = null; // called once textWidth is known

    // ── 3D Extruded Text ──────────────────────────────────────────────────────
    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/fonts/helvetiker_bold.typeface.json',
      (font) => {
        const geo = new TextGeometry(name, {
          font,
          size:           0.65,
          depth:          0.20,
          curveSegments:  10,
          bevelEnabled:   true,
          bevelThickness: 0.03,
          bevelSize:      0.02,
          bevelSegments:  4,
        });

        geo.computeBoundingBox();
        const bb  = geo.boundingBox;
        textWidth = bb.max.x - bb.min.x;

        // Center on X, text bottom sits at y=0.9 in world space
        geo.translate(-textWidth / 2, 0.9, 0);

        // Front faces: cyan
        const frontMat = new THREE.MeshStandardMaterial({
          color:             0x06b6d4,
          metalness:         0.2,
          roughness:         0.3,
          emissive:          new THREE.Color(0x06b6d4),
          emissiveIntensity: 0.22,
        });
        // Extruded sides: violet
        const sideMat = new THREE.MeshStandardMaterial({
          color:             0x8b5cf6,
          metalness:         0.45,
          roughness:         0.25,
          emissive:          new THREE.Color(0x8b5cf6),
          emissiveIntensity: 0.15,
        });

        const mesh = new THREE.Mesh(geo, [frontMat, sideMat]);
        mesh.castShadow    = true;
        mesh.receiveShadow = true;

        // GSAP entrance: rise from below
        mesh.position.y = -2.5;
        scene.add(mesh);
        _gsap.to(mesh.position, { y: 0, duration: 1.5, delay: 0.4, ease: 'power3.out' });

        // If avatar loaded first, position it now
        placeAvatarFn?.(textWidth);
      },
      undefined,
      (err) => console.warn('Font load failed:', err),
    );

    // ── Avatar GLB ────────────────────────────────────────────────────────────
    let modelRef   = null;
    let modelBaseY = 0;
    let mixer      = null;

    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      '/models/avatar.glb',
      (gltf) => {
        const model = gltf.scene;

        // Auto-fit: 2.2 units tall, feet at y=0
        const box    = new THREE.Box3().setFromObject(model);
        const size   = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const s      = 2.2 / size.y;
        model.scale.setScalar(s);
        model.position.set(-center.x * s, -box.min.y * s, -center.z * s);
        modelBaseY = model.position.y;

        // ── Face toward the camera (rotate 180° around Y) ─────────────────
        model.rotation.y = Math.PI;

        // Shadows
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow    = true;
            child.receiveShadow = true;
          }
        });

        scene.add(model);
        modelRef = model;

        // Place avatar so the extended hand sits near the "V"
        const doPlace = (tw) => {
          const vLeftEdge = -tw / 2;      // world X of V's left edge
          model.position.x = vLeftEdge - 0.45; // avatar slightly left of V
          model.position.z = 0.5;              // in front of text plane
        };

        placeAvatarFn = doPlace;
        if (textWidth > 0) doPlace(textWidth); // text already loaded

        // Animations (if Tripo embedded any)
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
        }
      },
      undefined,
      () => {},
    );

    // ── Resize ────────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (!canvasEl) return;
      const nw = canvasEl.offsetWidth;
      const nh = canvasEl.offsetHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvasEl.parentElement ?? canvasEl);

    // ── Mouse ─────────────────────────────────────────────────────────────────
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ── Render loop ───────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    function tick() {
      raf = requestAnimationFrame(tick);
      const dt = clock.getDelta();
      const t  = clock.elapsedTime;

      mixer?.update(dt);

      // Gentle camera parallax
      camera.position.x += (mx * 1.4 - camera.position.x) * 0.045;
      camera.position.y += (1.8 - my * 0.5 - camera.position.y) * 0.045;
      camera.lookAt(0, 1.2, 0);

      // Avatar idle: slow sway + micro bob
      if (modelRef) {
        modelRef.rotation.y = Math.PI + Math.sin(t * 0.38) * 0.055;
        modelRef.position.y = modelBaseY + Math.sin(t * 0.9) * 0.02;
      }

      renderer.render(scene, camera);
    }
    tick();

    canvasEl._cleanup = () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      renderer.dispose();
    };
  });

  onDestroy(() => {
    if (!browser) return;
    canvasEl?._cleanup?.();
  });
</script>

<canvas
  bind:this={canvasEl}
  class="w-full block"
  style="height: clamp(380px, 58vh, 620px)"
></canvas>
