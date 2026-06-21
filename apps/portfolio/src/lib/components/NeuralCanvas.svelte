<script>
  import { onMount, onDestroy } from 'svelte';

  let canvas;
  let animId;
  let renderer, scene, camera;

  onMount(async () => {
    const THREE = await import('three');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // ── Particle nodes ──────────────────────────────────────────────────────
    const NODE_COUNT = 120;
    const positions = new Float32Array(NODE_COUNT * 3);
    const nodeData = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 5;
      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      nodeData.push({ x, y, z, vx: (Math.random() - 0.5) * 0.003, vy: (Math.random() - 0.5) * 0.003, vz: 0 });
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xa78bfa,
      size: 0.07,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // ── Connection lines ────────────────────────────────────────────────────
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.12,
    });

    const lineGeo = new THREE.BufferGeometry();
    const MAX_LINES = NODE_COUNT * 3;
    const linePositions = new Float32Array(MAX_LINES * 6);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── Mouse parallax ──────────────────────────────────────────────────────
    let mx = 0, my = 0;
    const onMove = (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 0.5;
      my = (e.clientY / window.innerHeight - 0.5) * 0.5;
    };
    window.addEventListener('mousemove', onMove);

    // ── Resize ──────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Animate ─────────────────────────────────────────────────────────────
    let t = 0;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.004;

      // Move nodes
      for (let i = 0; i < NODE_COUNT; i++) {
        const n = nodeData[i];
        n.x += n.vx + Math.sin(t + i * 0.5) * 0.0005;
        n.y += n.vy + Math.cos(t + i * 0.3) * 0.0005;
        if (Math.abs(n.x) > 5) n.vx *= -1;
        if (Math.abs(n.y) > 5) n.vy *= -1;
        positions[i * 3]     = n.x;
        positions[i * 3 + 1] = n.y;
        positions[i * 3 + 2] = n.z;
      }
      geo.attributes.position.needsUpdate = true;

      // Update connection lines
      let lineIdx = 0;
      const CONNECT_DIST = 1.8;
      for (let i = 0; i < NODE_COUNT && lineIdx < MAX_LINES; i++) {
        for (let j = i + 1; j < NODE_COUNT && lineIdx < MAX_LINES; j++) {
          const dx = nodeData[i].x - nodeData[j].x;
          const dy = nodeData[i].y - nodeData[j].y;
          if (dx * dx + dy * dy < CONNECT_DIST * CONNECT_DIST) {
            linePositions[lineIdx * 6]     = nodeData[i].x;
            linePositions[lineIdx * 6 + 1] = nodeData[i].y;
            linePositions[lineIdx * 6 + 2] = nodeData[i].z;
            linePositions[lineIdx * 6 + 3] = nodeData[j].x;
            linePositions[lineIdx * 6 + 4] = nodeData[j].y;
            linePositions[lineIdx * 6 + 5] = nodeData[j].z;
            lineIdx++;
          }
        }
      }
      lineGeo.setDrawRange(0, lineIdx * 2);
      lineGeo.attributes.position.needsUpdate = true;

      // Parallax camera
      camera.position.x += (mx - camera.position.x) * 0.05;
      camera.position.y += (-my - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
    };
  });

  onDestroy(() => {
    if (animId) cancelAnimationFrame(animId);
    if (renderer) renderer.dispose();
  });
</script>

<canvas bind:this={canvas} class="w-full h-full block"></canvas>
