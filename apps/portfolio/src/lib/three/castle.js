/**
 * The Infinity Castle.
 *
 * A void with no floor and no horizon, filled with wooden rooms hung at
 * angles that do not agree with each other, lit only by paper lanterns.
 * Nothing here is a room you could walk through — the point of the place is
 * that it has no consistent up, so the geometry is built to contradict
 * itself and the fog is what makes it endless.
 *
 * THE BUDGET IS THE DESIGN. Every beam in the castle is one of four boxes,
 * drawn with InstancedMesh, so the whole structure is four draw calls
 * regardless of how many hundreds of beams are on screen. Built as separate
 * meshes this scene would be unshippable; built as instances it costs less
 * than the hero image.
 *
 * Depth is sold by fog, not by detail. Exponential fog tuned to the page's
 * field colour means distant structure dissolves into the page background
 * rather than ending at a visible edge, which is the entire illusion: you
 * cannot see where it stops, so it doesn't.
 */
import * as THREE from 'three';

/* The page's own tokens. Hard-coded rather than read from CSS because this
   runs before paint and a getComputedStyle round-trip per material is not
   worth it — but they must stay in step with app.css. */
export const FIELD = 0x0b0b0d;
const GOLD = 0xd9b45e;
const GOLD_PALE = 0xe6c877;
/* The wood is barely above the field. It is not meant to be *seen* so much
   as to occlude — a beam reads because it blocks a lantern behind it. */
const WOOD = 0x14131a;
const WOOD_LIT = 0x241f22;
const PAPER = 0xe8d9b5; // shoji panels, the only large light surface

/** Deterministic noise, so the castle is the same on every load and in every
    screenshot. A castle that reshuffles on refresh is just noise. */
function makeRandom(seed) {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

/**
 * One slab of castle: a rectangular room shell of beams, rotated as a whole
 * so it disagrees with its neighbours.
 *
 * Returns plain transform data rather than meshes — the caller packs these
 * into the instanced buffers.
 */
function roomTransforms(rand, cx, cy, cz) {
	const out = [];
	const w = 7 + rand() * 11;
	const h = 5 + rand() * 9;
	const d = 7 + rand() * 11;

	// The room's own rotation. Generous on Z, because a tilted *floor* is
	// what makes the place feel wrong; a room merely turned on Y still reads
	// as a normal room seen from an angle.
	const rot = new THREE.Euler(
		(rand() - 0.5) * 1.1,
		rand() * Math.PI * 2,
		(rand() - 0.5) * 1.5
	);
	const basis = new THREE.Matrix4().makeRotationFromEuler(rot);
	const origin = new THREE.Vector3(cx, cy, cz);

	const place = (lx, ly, lz, sx, sy, sz) => {
		const p = new THREE.Vector3(lx, ly, lz).applyMatrix4(basis).add(origin);
		out.push({ pos: p, rot, scale: new THREE.Vector3(sx, sy, sz) });
	};

	// Four posts at the corners.
	for (const sx of [-1, 1]) {
		for (const sz of [-1, 1]) {
			place((w / 2) * sx, 0, (d / 2) * sz, 0.5, h, 0.5);
		}
	}
	// Top and bottom plates, running both ways.
	for (const sy of [-1, 1]) {
		place(0, (h / 2) * sy, (d / 2) * -1, w, 0.45, 0.45);
		place(0, (h / 2) * sy, (d / 2) * 1, w, 0.45, 0.45);
		place((w / 2) * -1, (h / 2) * sy, 0, 0.45, 0.45, d);
		place((w / 2) * 1, (h / 2) * sy, 0, 0.45, 0.45, d);
	}
	// A few floor joists. Sparse — the eye reads three as "many" and a full
	// deck of them just eats fill rate.
	const joists = 2 + Math.floor(rand() * 3);
	for (let i = 0; i < joists; i++) {
		const t = (i + 1) / (joists + 1) - 0.5;
		place(w * t, -h / 2, 0, 0.3, 0.3, d);
	}

	return { transforms: out, basis, origin, w, h, d, rot };
}

/**
 * Build the whole castle into a Group.
 *
 * `quality` scales the room count: the same scene on a phone is the same
 * composition with fewer rooms, not a different one.
 */
export function buildCastle({ quality = 1 } = {}) {
	const group = new THREE.Group();
	const rand = makeRandom(20251027);

	/* Dense on purpose. At 26 rooms this read as "a few buildings in fog";
	   the place is supposed to be overwhelming, and the only way to get that
	   is enough overlapping structure that you cannot pick out where one room
	   ends and the next begins. Instancing means the extra rooms are close to
	   free — it is still one draw call. */
	const ROOMS = Math.round(58 * quality);
	const SPREAD = 78;

	const rooms = [];
	const beams = [];
	for (let i = 0; i < ROOMS; i++) {
		// Distributed through a tall column of space rather than a ball: the
		// castle is something you fall down, so it wants far more vertical
		// extent than horizontal.
		const cx = (rand() - 0.5) * SPREAD;
		// Tall. The camera travels the castle's full height over the page's
		// full scroll, so the rooms have to span further vertically than the
		// camera ever goes or you fall out of the bottom into empty black.
		const cy = (rand() - 0.5) * SPREAD * 3.1;
		const cz = (rand() - 0.5) * SPREAD - 18;
		const r = roomTransforms(rand, cx, cy, cz);
		rooms.push(r);
		beams.push(...r.transforms);
	}

	/* ─── The beams, as one instanced mesh ──────────────────────────────── */
	const beamGeo = new THREE.BoxGeometry(1, 1, 1);
	const beamMat = new THREE.MeshLambertMaterial({ color: WOOD });
	const beamMesh = new THREE.InstancedMesh(beamGeo, beamMat, beams.length);
	beamMesh.instanceColor = new THREE.InstancedBufferAttribute(
		new Float32Array(beams.length * 3),
		3
	);
	const m = new THREE.Matrix4();
	const q = new THREE.Quaternion();
	const col = new THREE.Color();
	beams.forEach((b, i) => {
		q.setFromEuler(b.rot);
		m.compose(b.pos, q, b.scale);
		beamMesh.setMatrixAt(i, m);
		// A little tonal variation so the structure doesn't read as one flat
		// silhouette when two rooms overlap.
		col.setHex(rand() > 0.72 ? WOOD_LIT : WOOD);
		beamMesh.setColorAt(i, col);
	});
	beamMesh.instanceMatrix.needsUpdate = true;
	/* setColorAt does NOT flag the attribute for upload — unlike almost every
	   other setter in three. Without this line the per-instance tones are
	   computed, written, and silently never reach the GPU, so every beam
	   renders the same colour and the variation above is dead code. */
	beamMesh.instanceColor.needsUpdate = true;
	group.add(beamMesh);

	/* ─── Shoji panels ───────────────────────────────────────────────────── */
	/* Paper screens are the only thing in here that carries light, so they
	   are what actually describes the architecture. One per room at most, and
	   unlit (MeshBasicMaterial) because a paper screen is lit from behind —
	   shading it from the scene's lights would make it darker than the wood,
	   which is backwards. */
	const panelGeo = new THREE.PlaneGeometry(1, 1);
	const panelMat = new THREE.MeshBasicMaterial({
		color: PAPER,
		transparent: true,
		opacity: 0.14,
		side: THREE.DoubleSide,
		depthWrite: false
	});
	const panels = rooms.filter(() => rand() > 0.42);
	const panelMesh = new THREE.InstancedMesh(panelGeo, panelMat, panels.length);
	panels.forEach((r, i) => {
		const lx = (rand() > 0.5 ? 1 : -1) * (r.w / 2);
		const p = new THREE.Vector3(lx, 0, 0).applyMatrix4(r.basis).add(r.origin);
		q.setFromEuler(r.rot);
		m.compose(p, q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)), new THREE.Vector3(r.d * 0.92, r.h * 0.92, 1));
		panelMesh.setMatrixAt(i, m);
	});
	panelMesh.instanceMatrix.needsUpdate = true;
	group.add(panelMesh);

	/* ─── Lanterns ───────────────────────────────────────────────────────── */
	/* The only light source the viewer can see, and the only warm thing in
	   the scene. They hang on cords from wherever they happen to be, which in
	   a place with no shared up means they hang in every direction. */
	const LANTERNS = Math.round(60 * quality);
	const lanternGeo = new THREE.SphereGeometry(0.46, 10, 8);
	lanternGeo.scale(1, 1.25, 1); // paper lanterns are taller than they are wide
	const lanternMat = new THREE.MeshBasicMaterial({ color: GOLD_PALE });
	const lanternMesh = new THREE.InstancedMesh(lanternGeo, lanternMat, LANTERNS);

	const cordGeo = new THREE.BoxGeometry(0.035, 1, 0.035);
	const cordMat = new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.22 });
	const cordMesh = new THREE.InstancedMesh(cordGeo, cordMat, LANTERNS);

	/* The glow. A sphere cannot look like a light source on its own, so each
	   lantern carries a camera-facing card with a radial gradient on it.
	   
	   These were sixty THREE.Sprites. A Sprite is its own Object3D and its own
	   draw call, so the glows alone cost sixty of them — in a file whose whole
	   argument is that the castle is a handful of draw calls. They are now one
	   InstancedMesh with a billboarding vertex shader: one call for all of
	   them, and the flicker moved onto the GPU, which also deletes the
	   per-frame JavaScript loop that used to walk all sixty every frame.
	   
	   Billboarded in the shader rather than with Sprite's own maths: the card
	   is offset in VIEW space, after the instance's position has been
	   transformed, so it always faces the camera no matter how the instance
	   is rotated. */
	const glowTex = radialGlowTexture();
	const glowGeo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
	const aSize = new Float32Array(LANTERNS);
	const aPhase = new Float32Array(LANTERNS);

	const glowMat = new THREE.ShaderMaterial({
		uniforms: {
			uMap: { value: glowTex },
			uColor: { value: new THREE.Color(GOLD) },
			uOpacity: { value: 0.62 },
			uTime: { value: 0 },
			uFogDensity: { value: 0.0135 }
		},
		vertexShader: `
			attribute float aSize;
			attribute float aPhase;
			uniform float uTime;
			uniform float uFogDensity;
			varying vec2 vUv;
			varying float vFog;
			void main() {
				vUv = uv;
				// The instance's centre, in view space.
				vec4 centre = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
				// Breathing, per lantern, slightly out of step.
				float k = 1.0 + sin(uTime * 0.0011 + aPhase) * 0.09;
				// Offset in view space is what makes it face the camera.
				vec4 mv = centre + vec4(position.xy * aSize * k, 0.0, 0.0);
				// Matches the scene's FogExp2 by hand: a custom shader does not
				// inherit it, and a lantern that stays bright at the far end of
				// the castle destroys the depth every other object is selling.
				float d = max(-mv.z, 0.0) * uFogDensity;
				vFog = 1.0 - exp(-d * d);
				gl_Position = projectionMatrix * mv;
			}
		`,
		fragmentShader: `
			uniform sampler2D uMap;
			uniform vec3 uColor;
			uniform float uOpacity;
			varying vec2 vUv;
			varying float vFog;
			void main() {
				vec4 t = texture2D(uMap, vUv);
				gl_FragColor = vec4(uColor, 1.0) * t * uOpacity * (1.0 - vFog);
			}
		`,
		transparent: true,
		blending: THREE.AdditiveBlending,
		depthWrite: false
	});

	const glowMesh = new THREE.InstancedMesh(glowGeo, glowMat, LANTERNS);
	// Instanced glows are billboarded in view space, so their world bounds are
	// meaningless to the frustum culler and it will pop the whole batch out of
	// existence at the wrong moment.
	glowMesh.frustumCulled = false;

	for (let i = 0; i < LANTERNS; i++) {
		const host = rooms[Math.floor(rand() * rooms.length)];
		const drop = 2 + rand() * 7;
		const local = new THREE.Vector3(
			(rand() - 0.5) * host.w * 0.7,
			host.h / 2 - drop,
			(rand() - 0.5) * host.d * 0.7
		);
		const pos = local.clone().applyMatrix4(host.basis).add(host.origin);
		const anchor = new THREE.Vector3(local.x, host.h / 2, local.z)
			.applyMatrix4(host.basis)
			.add(host.origin);

		q.setFromEuler(host.rot);
		m.compose(pos, q, new THREE.Vector3(1, 1, 1));
		lanternMesh.setMatrixAt(i, m);

		// The cord spans anchor → lantern, so it is scaled and placed to the
		// midpoint rather than hung straight down; "down" is meaningless here.
		const mid = anchor.clone().lerp(pos, 0.5);
		m.compose(mid, q, new THREE.Vector3(1, drop, 1));
		cordMesh.setMatrixAt(i, m);

		// The glow sits exactly on the lantern. No rotation: the shader
		// billboards it, so whatever is in the matrix here would be ignored.
		m.compose(pos, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
		glowMesh.setMatrixAt(i, m);
		// Smaller than the first pass. A wide soft glow reads as lens bokeh;
		// a tight one reads as a paper lamp with a flame in it.
		aSize[i] = 1.9 + rand() * 2.1;
		aPhase[i] = rand() * Math.PI * 2;
	}

	glowGeo.setAttribute('aSize', new THREE.InstancedBufferAttribute(aSize, 1));
	glowGeo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(aPhase, 1));

	lanternMesh.instanceMatrix.needsUpdate = true;
	cordMesh.instanceMatrix.needsUpdate = true;
	glowMesh.instanceMatrix.needsUpdate = true;
	group.add(lanternMesh, cordMesh, glowMesh);

	/* ─── Light ──────────────────────────────────────────────────────────── */
	/* Three lights total, none of them shadow-casting. Real point lights per
	   lantern would be the honest approach and would also cap the scene at
	   about four lanterns before the shader falls over. Instead: a warm
	   hemisphere that fakes "lit from the lanterns", and two directionals to
	   keep the beams from flattening out. */
	const hemi = new THREE.HemisphereLight(GOLD, 0x05050a, 1.15);
	const key = new THREE.DirectionalLight(GOLD_PALE, 0.5);
	key.position.set(5, 9, 6);
	const rim = new THREE.DirectionalLight(0x6a7cff, 0.3); // cold counter-light
	rim.position.set(-7, -4, -5);
	group.add(hemi, key, rim);

	return {
		group,
		/* The frame loop sets this and nothing else — all sixty glows animate
		   from one uniform. */
		setTime: (t) => {
			glowMat.uniforms.uTime.value = t;
		},
		dispose: () => disposeTree(group)
	};
}

/** A soft radial falloff on a canvas — one texture, shared by every glow. */
function radialGlowTexture() {
	const S = 128;
	const c = document.createElement('canvas');
	c.width = c.height = S;
	const g = c.getContext('2d');
	const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
	grad.addColorStop(0, 'rgba(255,255,255,1)');
	grad.addColorStop(0.25, 'rgba(255,236,190,0.55)');
	grad.addColorStop(1, 'rgba(255,220,150,0)');
	g.fillStyle = grad;
	g.fillRect(0, 0, S, S);
	const t = new THREE.CanvasTexture(c);
	t.colorSpace = THREE.SRGBColorSpace;
	return t;
}

/** Free every GPU resource under a node. three does not do this for you, and
    on a SPA route change the leak is permanent. */
export function disposeTree(root) {
	root.traverse((o) => {
		if (o.geometry) o.geometry.dispose();
		const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
		for (const mat of mats) {
			for (const k of Object.keys(mat)) {
				const v = mat[k];
				if (v && v.isTexture) v.dispose();
			}
			mat.dispose();
		}
	});
}
