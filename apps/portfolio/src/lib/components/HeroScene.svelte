<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { useGSAP } from '$lib/gsap.js';

  export let name = 'VENKATARAMAN TB';

  let canvasEl, raf;
  let renderer, scene, camera;
  let _gsap;
  let mx = 0, my = 0;

  const onMouseMove = (e) => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  };

  onMount(async () => {
    if (!browser) return;

    // Editorial split: "VENKATARAMAN" headline + "TB" sub-mark
    const parts = name.trim().split(' ');
    const line1 = parts[0];
    const line2 = parts.slice(1).join(' ');

    const [
      THREE, gResult,
      { FontLoader }, { TextGeometry },
      { GLTFLoader },  { RoomEnvironment },
    ] = await Promise.all([
      import('three'),
      useGSAP(),
      import('three/examples/jsm/loaders/FontLoader.js'),
      import('three/examples/jsm/geometries/TextGeometry.js'),
      import('three/examples/jsm/loaders/GLTFLoader.js'),
      import('three/examples/jsm/environments/RoomEnvironment.js'),
    ]);
    if (!gResult) return;
    _gsap = gResult.gsap;

    const w = canvasEl.offsetWidth  || 960;
    const h = canvasEl.offsetHeight || 580;

    // ── Renderer ─────────────────────────────────────────────────────────────
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace    = THREE.SRGBColorSpace;
    renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled   = true;
    renderer.shadowMap.type      = THREE.PCFSoftShadowMap;

    // ── Scene ─────────────────────────────────────────────────────────────────
    scene = new THREE.Scene();

    // IBL — image-based lighting makes metallic materials look physically real
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // ── Camera ────────────────────────────────────────────────────────────────
    camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 100);
    camera.position.set(0.6, 2.1, 10);
    camera.lookAt(0, 1.1, 0);

    // ── Lighting ──────────────────────────────────────────────────────────────
    // Soft ambient (IBL handles most diffuse)
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));

    // Key: warm, slightly above and to the right
    const key = new THREE.DirectionalLight(0xfff2e0, 2.0);
    key.position.set(6, 10, 8);
    key.castShadow = true;
    key.shadow.mapSize.setScalar(2048);
    key.shadow.bias = -0.001;
    scene.add(key);

    // Cool rim: defines silhouette from back-left
    const rim = new THREE.DirectionalLight(0x8ab0cc, 0.6);
    rim.position.set(-8, 4, -6);
    scene.add(rim);

    // Soft front fill: lifts deep shadows without adding color
    const fill = new THREE.DirectionalLight(0xffffff, 0.22);
    fill.position.set(0, -3, 6);
    scene.add(fill);

    // Transparent shadow catcher
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.ShadowMaterial({ opacity: 0.10 }),
    );
    ground.rotation.x  = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ── Materials: polished chrome ────────────────────────────────────────────
    // Front faces: cool platinum-silver
    const matFront = new THREE.MeshStandardMaterial({
      color:     0xcdd4e0,
      metalness: 0.90,
      roughness: 0.07,
    });
    // Extruded sides: darker steel (creates depth)
    const matSide = new THREE.MeshStandardMaterial({
      color:     0x50596a,
      metalness: 0.93,
      roughness: 0.05,
    });
    // "TB" sub-mark — dimmer, recedes behind headline
    const subFront = new THREE.MeshStandardMaterial({
      color:     0x8890a0,
      metalness: 0.85,
      roughness: 0.15,
    });
    const subSide = new THREE.MeshStandardMaterial({
      color:     0x303540,
      metalness: 0.90,
      roughness: 0.10,
    });

    // ── Cross-load state ──────────────────────────────────────────────────────
    let line1Width  = 0;
    let placeAvatar = null;

    // ── 3D Text ───────────────────────────────────────────────────────────────
    const fontLoader = new FontLoader();
    fontLoader.load(
      'https://cdn.jsdelivr.net/npm/three@0.169.0/examples/fonts/helvetiker_bold.typeface.json',
      (font) => {
        // ── Headline ───────────────────────────────────────────────────────
        const g1 = new TextGeometry(line1, {
          font,
          size:           0.70,
          depth:          0.18,
          curveSegments:  12,
          bevelEnabled:   true,
          bevelThickness: 0.022,
          bevelSize:      0.012,
          bevelSegments:  5,
        });
        g1.computeBoundingBox();
        line1Width = g1.boundingBox.max.x - g1.boundingBox.min.x;
        // Center headline on X
        g1.translate(-line1Width / 2, 0, 0);

        const m1 = new THREE.Mesh(g1, [matFront, matSide]);
        m1.castShadow = m1.receiveShadow = true;
        // Start below ground, GSAP rises it into place
        m1.position.y = 1.48 - 4;
        scene.add(m1);
        _gsap.to(m1.position, { y: 1.48, duration: 1.6, delay: 0.3, ease: 'power3.out' });

        // ── Sub-mark "TB" — smaller, right-flush ───────────────────────────
        if (line2) {
          const g2 = new TextGeometry(line2, {
            font,
            size:           0.40,
            depth:          0.09,
            curveSegments:  10,
            bevelEnabled:   true,
            bevelThickness: 0.013,
            bevelSize:      0.007,
            bevelSegments:  4,
          });
          g2.computeBoundingBox();
          const l2w = g2.boundingBox.max.x - g2.boundingBox.min.x;
          // Right-align flush with headline's right edge
          g2.translate(line1Width / 2 - l2w, 0, 0);

          const m2 = new THREE.Mesh(g2, [subFront, subSide]);
          m2.castShadow = m2.receiveShadow = true;
          m2.position.y = 0.82 - 4;
          scene.add(m2);
          _gsap.to(m2.position, { y: 0.82, duration: 1.6, delay: 0.52, ease: 'power3.out' });
        }

        placeAvatar?.(line1Width);
      },
      undefined,
      (err) => console.warn('Font load failed:', err),
    );

    // ── Avatar ────────────────────────────────────────────────────────────────
    let modelRef = null, modelBaseY = 0, mixer = null;

    new GLTFLoader().load(
      '/models/avatar.glb',
      (gltf) => {
        const model = gltf.scene;

        const box    = new THREE.Box3().setFromObject(model);
        const size   = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const s      = 2.55 / size.y;   // slightly taller = more presence

        model.scale.setScalar(s);
        model.position.set(-center.x * s, -box.min.y * s, -center.z * s);
        modelBaseY = model.position.y;

        // Rotate to face camera
        model.rotation.y = Math.PI;

        model.traverse(c => {
          if (c.isMesh) c.castShadow = c.receiveShadow = true;
        });

        scene.add(model);
        modelRef = model;

        // Plant avatar at the left edge of "V", in front of the text plane
        const doPlace = (tw) => {
          model.position.x = -(tw / 2) - 0.28;
          model.position.z = 0.55;
        };
        placeAvatar = doPlace;
        if (line1Width > 0) doPlace(line1Width);

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
      const nw = canvasEl.offsetWidth, nh = canvasEl.offsetHeight;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvasEl.parentElement ?? canvasEl);
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ── Render loop ───────────────────────────────────────────────────────────
    const clock = new THREE.Clock();
    function tick() {
      raf = requestAnimationFrame(tick);
      const dt = clock.getDelta();
      const t  = clock.elapsedTime;

      mixer?.update(dt);

      // Restrained parallax — enough to feel 3D, not seasick
      camera.position.x += (0.6 + mx * 0.65 - camera.position.x) * 0.038;
      camera.position.y += (2.1 - my * 0.32 - camera.position.y) * 0.038;
      camera.lookAt(0, 1.1, 0);

      // Avatar: very subtle idle (professional, not cartoonish)
      if (modelRef) {
        modelRef.rotation.y = Math.PI + Math.sin(t * 0.36) * 0.045;
        modelRef.position.y = modelBaseY + Math.sin(t * 0.78) * 0.016;
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

<canvas bind:this={canvasEl} class="w-full block" style="height: clamp(460px, 64vh, 700px)"></canvas>
