/**
 * A systematic geometric character.
 *
 * The photographs could only be slid around; the pixel sprite could hinge at
 * one waist. Neither could be *re-posed*. This can: the character is a
 * skeleton of joints with shapes hung off them, so a pose is nothing but a
 * map of joint angles, and an animation is nothing but a list of poses.
 *
 * That makes characters DATA. Everything below — skeleton, palette, poses,
 * animations — is a plain object. A second character is a second spec, not a
 * second component, and a new move is six numbers rather than a new asset.
 *
 * ── Conventions ───────────────────────────────────────────────────────────
 * A bone extends along its own +Y by `len`, and its children attach at
 * (0, len). `len` is SIGNED: positive runs down (arms, legs), negative runs
 * up (spine, neck, head).
 *
 * Signed length rather than a 180° rest angle, because rotate(180) also
 * mirrors X — every joint below the spine would have had its angles
 * reversed, and the pose tables would have been unreadable. This way
 * rotation is always degrees clockwise from the bone's own direction, and
 * a positive spine angle leans him to the viewer's right whatever else
 * is happening.
 *
 * Shapes are drawn in the bone's local space, so a limb's artwork never has
 * to know where its joint ended up. Forward kinematics is handled by nesting
 * SVG <g> transforms rather than by multiplying matrices by hand.
 */

/* ════════════════════════════════════════════════════════════════════════════
   PALETTE — taken from the photographs: navy cap, warm brown skin, blue tee,
   light denim, white sneakers.
   ════════════════════════════════════════════════════════════════════════════ */

export const PALETTE = {
	skin: '#b4763f',
	skinDark: '#9a6133',
	hair: '#241f1d',
	cap: '#273a5c',
	capBrim: '#1d2c47',
	tee: '#3d6ea8',
	teeDark: '#2f5888',
	teeMark: '#d8503a',
	denim: '#9fb4cf',
	denimDark: '#8aa0bd',
	denimFar: '#74889f',
	skinFar: '#8c5730',
	teeFar: '#27486e',
	shoeFar: '#cdcac4',
	shoe: '#f2f0ec',
	shoeSole: '#cfd4d9',
	shoeMark: '#2f5888',
	strap: '#1b1e24',
	eye: '#16181d'
};

/* ════════════════════════════════════════════════════════════════════════════
   SKELETON
   `len` is how far the bone runs before its children attach. `rest` is its
   angle when no pose says otherwise.
   ════════════════════════════════════════════════════════════════════════════ */

export const SKELETON = {
	name: 'pelvis',
	len: 0,
	rest: 0,
	shapes: [{ type: 'rect', x: -11, y: -4, w: 22, h: 12, rx: 5, fill: 'denim' }],
	children: [
		{
			name: 'spine',
			len: -30, // negative: runs upward
			rest: 0,
			shapes: [
				// Torso, drawn upward from the pelvis and widening at the chest.
				{ type: 'path', d: 'M-12 0 L-13.5 -26 Q-13.5 -30 -9 -30 L9 -30 Q13.5 -30 13.5 -26 L12 0 Z', fill: 'tee' },
				{ type: 'rect', x: -2, y: -14, w: 7, h: 5, rx: 1.5, fill: 'teeMark' }
			],
			children: [
				{
					name: 'neck',
					len: -7,
					rest: 0,
					shapes: [{ type: 'rect', x: -4, y: -8, w: 8, h: 8, rx: 3, fill: 'skinDark' }],
					children: [
						{
							name: 'head',
							len: -20,
							rest: 0,
							shapes: [
								{ type: 'ellipse', cx: 0, cy: -11, rx: 11, ry: 12.5, fill: 'skin' },
								// Beard: a jaw-hugging band, the strongest identifier after the cap.
								{ type: 'path', d: 'M-11 -11 Q-11 1.5 0 1.5 Q11 1.5 11 -11 Q7 -5 0 -5 Q-7 -5 -11 -11 Z', fill: 'hair' },
								{ type: 'rect', x: -11, y: -14, w: 3, h: 9, rx: 1.5, fill: 'hair' },
								{ type: 'rect', x: 8, y: -14, w: 3, h: 9, rx: 1.5, fill: 'hair' },
								// Cap — crown then brim, pulled low the way he wears it.
								{ type: 'path', d: 'M-11.5 -15 Q-11.5 -27 0 -27 Q11.5 -27 11.5 -15 Z', fill: 'cap' },
								{ type: 'path', d: 'M-12 -15 L13 -15 Q17 -15 16 -12.5 L-12 -12.5 Z', fill: 'capBrim' },
								{ type: 'circle', cx: 0, cy: -26, r: 1.8, fill: 'capBrim' },
								// Eyes
								{ type: 'circle', cx: -4.2, cy: -9.5, r: 1.6, fill: 'eye', id: 'eyeL' },
								{ type: 'circle', cx: 4.2, cy: -9.5, r: 1.6, fill: 'eye', id: 'eyeR' }
							],
							children: []
						}
					]
				},
				// Arms hang off the chest, at the top of the spine.
				arm('R', 12, true), // far side, drawn behind the torso
				arm('L', -12)
			]
		},
		leg('R', 7.5, true), // drawn first so the near leg overlaps it
		leg('L', -7.5)
	]
};

/** One arm: upper → fore → hand. `x` offsets the shoulder from the spine. */
function arm(side, x, far = false) {
	return {
		name: `arm${side}`,
		offset: { x, y: -27 },
		len: 20,
		rest: side === 'L' ? 12 : -12,
		shapes: [
			{ type: 'capsule', w: 8.5, len: 20, fill: far ? 'teeFar' : 'teeDark' } // sleeve
		],
		children: [
			{
				name: `fore${side}`,
				len: 18,
				rest: 0,
				shapes: [
					{ type: 'capsule', w: 7, len: 18, fill: far ? 'skinFar' : 'skin' },
					// Wrist strap — he wears a watch in both photographs.
					...(side === 'L' ? [{ type: 'rect', x: -3.6, y: 13, w: 7.2, h: 3, rx: 1.2, fill: 'strap' }] : [])
				],
				children: [
					{
						name: `hand${side}`,
						len: 6,
						rest: 0,
						shapes: [{ type: 'circle', cx: 0, cy: 3, r: 4, fill: far ? 'skinFar' : 'skin' }],
						children: []
					}
				]
			}
		]
	};
}

/**
 * One leg: thigh → shin → foot.
 *
 * `far` darkens the limb on the away side. Flat colour gives no occlusion
 * cue of its own, so without this the two legs read as a single denim
 * column no matter how far the stance is splayed.
 */
function leg(side, x, far = false) {
	return {
		name: `leg${side}`,
		offset: { x, y: 6 },
		len: 26,
		rest: 0,
		shapes: [{ type: 'capsule', w: 10, len: 26, fill: far ? 'denimDark' : 'denim' }],
		children: [
			{
				name: `shin${side}`,
				len: 24,
				rest: 0,
				shapes: [{ type: 'capsule', w: 9, len: 24, fill: far ? 'denimFar' : 'denimDark' }],
				children: [
					{
						name: `foot${side}`,
						len: 8,
						rest: 0,
						shapes: [
							{ type: 'path', d: 'M-5 0 L5 0 L13 6 Q13 9 10 9 L-5 9 Q-6.5 9 -6.5 6 Z', fill: far ? 'shoeFar' : 'shoe' },
							{ type: 'path', d: 'M-6.5 6.5 L13 6.5 Q13 9 10 9 L-5 9 Q-6.5 9 -6.5 6.5 Z', fill: 'shoeSole' },
							{ type: 'path', d: 'M-1 1.5 L7 5.5 L7 7 L-1 3.5 Z', fill: 'shoeMark' }
						],
						children: []
					}
				]
			}
		]
	};
}

/** Every joint name, derived from the tree so the two can never drift apart. */
export const JOINTS = (function collect(node, acc = []) {
	acc.push(node.name);
	for (const c of node.children ?? []) collect(c, acc);
	return acc;
})(SKELETON);

/** The angle a joint sits at when nothing says otherwise. */
export const REST = (function collect(node, acc = {}) {
	acc[node.name] = node.rest ?? 0;
	for (const c of node.children ?? []) collect(c, acc);
	return acc;
})(SKELETON);

/* ════════════════════════════════════════════════════════════════════════════
   POSES
   A pose is a sparse patch over REST — only the joints that move are listed,
   which is what keeps these readable as poses rather than as tables of
   numbers. `y` lifts the whole figure (a jump), `rot` tilts it.
   ════════════════════════════════════════════════════════════════════════════ */

export const POSES = {
	idle: {},

	breatheIn: { spine: 1, armL: 13, armR: -13 },

	stand: { armL: 10, armR: -10, legL: -4, legR: 4, shinL: 3, shinR: -3 },

	/* The pointing pose from the second photograph. */
	point: {
		spine: 8, head: -6,
		armR: -158, foreR: -16, handR: -8,
		armL: 26, foreL: 14,
		legL: -10, shinL: 7, legR: 8, shinR: -2,
		rot: -4
	},

	wave: { armR: -145, foreR: -34, armL: 12, head: -4 },
	waveUp: { armR: -145, foreR: -8, armL: 12, head: -4 },

	/* The Michael Jackson lean: hat hand up, other arm trailing low. */
	mj: {
		spine: 12, head: 8,
		armR: -128, foreR: -58, handR: -20,
		armL: 46, foreL: 26,
		legL: -26, shinL: 20, footL: 14,
		legR: 16, shinR: 6,
		rot: 8
	},

	walkA: {
		legL: 24, shinL: -14, footL: 6,
		legR: -22, shinR: 10,
		armL: -20, foreL: 12, armR: 20, foreR: 10,
		spine: 2
	},
	walkB: {
		legL: -22, shinL: 10,
		legR: 24, shinR: -14, footR: 6,
		armL: 20, foreL: 10, armR: -20, foreR: 12,
		spine: 2
	},

	runA: {
		legL: 46, shinL: -58, footL: 10,
		legR: -38, shinR: 46,
		armL: -62, foreL: 74, armR: 58, foreR: 68,
		spine: 12, head: -8
	},
	runB: {
		legL: -38, shinL: 46,
		legR: 46, shinR: -58, footR: 10,
		armL: 58, foreL: 68, armR: -62, foreR: 74,
		spine: 12, head: -8
	},

	crouch: {
		legL: 26, shinL: -52, footL: 26,
		legR: -26, shinR: -52, footR: 26,
		armL: 40, armR: -40, spine: 18, y: 16
	},
	airborne: {
		legL: 22, shinL: -34, legR: -14, shinR: -20,
		armL: -150, armR: 150, spine: -4, y: -34
	},

	kick: {
		legR: -86, shinR: 16, footR: -14,
		legL: 8, shinL: 6,
		armL: 46, armR: -56, foreR: -24, spine: 6, rot: -8
	},

	punchOut: {
		armR: -92, foreR: -4, handR: 0,
		armL: 34, foreL: -86,
		spine: 4, legL: 14, shinL: -8, legR: -14, rot: 6
	},
	punchBack: {
		armR: -40, foreR: -76,
		armL: 20, foreL: -40,
		spine: -2, legL: 14, shinL: -8, legR: -14, rot: -2
	},

	danceA: {
		armL: -126, foreL: -40, armR: 44, foreR: 30,
		spine: 10, head: -8, legL: -16, shinL: 12, legR: 14, rot: -9
	},
	danceB: {
		armL: -44, foreL: -30, armR: 126, foreR: 40,
		spine: -10, head: 8, legL: -14, legR: 16, shinR: 12, rot: 9
	},

	moonA: { legL: 18, shinL: -26, footL: 18, legR: -8, shinR: 4, armL: 24, armR: -24, spine: 4, rot: 4 },
	moonB: { legL: -8, shinL: 4, legR: 18, shinR: -26, footR: 18, armL: -24, armR: 24, spine: 4, rot: 4 },

	sulk: {
		spine: -12, head: 14,
		armL: 8, foreL: -104, armR: -8, foreR: 104, // arms folded
		legL: 4, legR: -4
	},

	sleep: { spine: -10, head: 20, armL: 6, armR: -6, legL: 10, shinL: -16, legR: -10, shinR: -16, y: 10 },

	panicA: { armL: -168, armR: 168, foreL: -24, foreR: 24, spine: 6, head: -12, rot: -5 },
	panicB: { armL: -156, armR: 156, foreL: 24, foreR: -24, spine: -6, head: 10, rot: 5 },

	fly: {
		spine: -16, head: -22,
		armL: -170, foreL: -10, armR: -170, foreR: 10,
		legL: 24, shinL: 10, legR: 18, shinR: 16,
		rot: -22
	},

	selfie: { armR: -150, foreR: -62, armL: 26, head: -10, spine: 8, rot: -6 },

	think: { armR: -62, foreR: -96, handR: -16, armL: 24, foreL: -40, head: 10, spine: 4 },

	held: { armL: 16, armR: -16, legL: 10, shinL: -12, legR: -10, shinR: -12, spine: -2 },

	tickleA: { armL: 32, foreL: -70, armR: -32, foreR: 70, spine: 8, head: -8, rot: -6 },
	tickleB: { armL: 24, foreL: -84, armR: -24, foreR: 84, spine: -4, head: 8, rot: 6 }
};

/* ════════════════════════════════════════════════════════════════════════════
   ANIMATIONS
   A list of poses with a duration each. `loop: false` holds the last frame.
   The renderer springs between them, so every one is interruptible and no
   animation has to know what came before it.
   ════════════════════════════════════════════════════════════════════════════ */

const seq = (frames, ms, loop = true) => ({ frames, ms, loop });

export const ANIMATIONS = {
	idle: seq(['idle', 'breatheIn'], 2200),
	stand: seq(['stand'], 1000, false),
	point: seq(['point'], 600, false),
	wave: seq(['wave', 'waveUp'], 520),
	walk: seq(['walkA', 'walkB'], 420),
	run: seq(['runA', 'runB'], 240),
	jump: seq(['crouch', 'airborne', 'crouch', 'stand'], 1100, false),
	kick: seq(['stand', 'kick', 'stand'], 900, false),
	punch: seq(['punchBack', 'punchOut'], 300),
	dance: seq(['danceA', 'danceB'], 460),
	moonwalk: seq(['moonA', 'moonB'], 560),
	sulk: seq(['sulk'], 800, false),
	sleep: seq(['sleep'], 2600),
	panic: seq(['panicA', 'panicB'], 150),
	fly: seq(['fly'], 900, false),
	selfie: seq(['selfie'], 700, false),
	think: seq(['think'], 900, false),
	held: seq(['held'], 700, false),
	tickle: seq(['tickleA', 'tickleB'], 120),
	mj: seq(['mj'], 700, false),
	dizzy: seq(['stand'], 700, false)
};

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

/** A full joint map for a pose name: REST with the pose patched over it. */
export function resolve(poseName) {
	const patch = POSES[poseName] ?? {};
	const out = { ...REST, y: 0, rot: 0 };
	for (const k of Object.keys(patch)) out[k] = patch[k];
	return out;
}

/** Linear blend between two resolved poses. */
export function blend(a, b, t) {
	const out = {};
	for (const k of Object.keys(a)) out[k] = a[k] + (b[k] - a[k]) * t;
	return out;
}

/**
 * The target pose for an animation at a given elapsed time.
 * Frames are eased with a cosine so a two-frame cycle reads as a swing
 * rather than a metronome.
 */
export function sample(animName, elapsed) {
	const anim = ANIMATIONS[animName] ?? ANIMATIONS.idle;
	const n = anim.frames.length;
	if (n === 1) return resolve(anim.frames[0]);

	const total = anim.ms * (anim.loop ? n : n - 1);
	let t = anim.loop ? (elapsed % total) / anim.ms : Math.min(elapsed, total) / anim.ms;

	const i = Math.floor(t);
	const frac = t - i;
	const a = resolve(anim.frames[i % n]);
	const b = resolve(anim.frames[(i + 1) % n]);
	const eased = 0.5 - Math.cos(frac * Math.PI) / 2;
	return blend(a, b, eased);
}

export function animationDone(animName, elapsed) {
	const anim = ANIMATIONS[animName] ?? ANIMATIONS.idle;
	if (anim.loop) return false;
	return elapsed >= anim.ms * Math.max(1, anim.frames.length - 1);
}
