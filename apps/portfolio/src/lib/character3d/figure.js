/**
 * The character as low-poly 3D geometry.
 *
 * Built the way sebg.ch builds theirs: real 3D rendered into a deliberately
 * small canvas and upscaled with `image-rendering: pixelated`. The chunky look
 * is not pixel art — it is a low-resolution render of actual geometry, which
 * is why it reads as a solid object that turns and catches light rather than a
 * flat sticker.
 *
 * ── Why this reuses the existing rig ──────────────────────────────────────
 * Every joint here carries the SAME NAME as the 2D rig in ../character/rig.js,
 * so the entire pose and animation library written for that rig drives this
 * model unchanged. Thirty poses and twenty animations transfer for free; only
 * the geometry is new.
 *
 * ── Conventions ──────────────────────────────────────────────────────────
 * Three.js is Y-up, the 2D rig was Y-down. Limbs therefore hang along −Y and
 * the spine runs along +Y. Screen rotation maps as `rotation.z = −angle`,
 * because a positive SVG rotation is clockwise on screen while a positive
 * Three.js Z rotation is counter-clockwise.
 *
 * Likeness is taken from the portrait: thick dark curly hair, full beard,
 * warm brown skin, pale blue-grey shirt. Colours sampled from the photograph
 * rather than guessed.
 */

import {
	Group,
	Mesh,
	BoxGeometry,
	MeshLambertMaterial,
	Color
} from 'three';

/** Sampled from the reference portrait. */
export const SKIN = 0xae795b;
export const SKIN_DARK = 0x95634a;
export const HAIR = 0x2c2827;
export const SHIRT = 0xdcdfe3;
export const SHIRT_DARK = 0xc2c7cd;
export const TROUSER = 0x3c4350;
export const SHOE = 0xf2f0ec;

const mat = (color) =>
	new MeshLambertMaterial({
		color: new Color(color),
		// Flat shading is what gives low-poly its faceted, carved look: each
		// face takes one normal instead of being smoothed across vertices.
		flatShading: true
	});

const MATS = {
	skin: mat(SKIN),
	skinDark: mat(SKIN_DARK),
	hair: mat(HAIR),
	shirt: mat(SHIRT),
	shirtDark: mat(SHIRT_DARK),
	trouser: mat(TROUSER),
	shoe: mat(SHOE)
};

/**
 * A box placed in its parent's local space.
 * @param {string} m material key
 * @param {[number,number,number]} size
 * @param {[number,number,number]} pos centre of the box
 */
function box(m, [w, h, d], [x, y, z] = [0, 0, 0]) {
	const mesh = new Mesh(new BoxGeometry(w, h, d), MATS[m]);
	mesh.position.set(x, y, z);
	mesh.castShadow = true;
	return mesh;
}

/**
 * A joint: an empty Group that rotates, with geometry hung off it.
 * The group sits AT the joint, and its geometry extends away from it, so
 * rotating the group pivots the limb about the right point.
 */
function joint(name, pos = [0, 0, 0]) {
	const g = new Group();
	g.name = name;
	g.position.set(...pos);
	return g;
}

/**
 * Build the figure.
 * @returns {{root: Group, joints: Record<string, Group>, height: number}}
 */
export function buildFigure() {
	const joints = {};
	const reg = (g) => {
		joints[g.name] = g;
		return g;
	};

	// ── Pelvis ───────────────────────────────────────────────────────────
	const pelvis = reg(joint('pelvis', [0, 0, 0]));
	pelvis.add(box('trouser', [2.4, 1.0, 1.3], [0, -0.2, 0]));

	// ── Spine → neck → head ──────────────────────────────────────────────
	const spine = reg(joint('spine', [0, 0.2, 0]));
	// Torso tapers slightly: wider at the shoulders than the waist.
	spine.add(box('shirt', [2.9, 3.0, 1.5], [0, 1.5, 0]));
	spine.add(box('shirtDark', [3.0, 0.5, 1.55], [0, 2.9, 0])); // collar line
	pelvis.add(spine);

	const neck = reg(joint('neck', [0, 3.1, 0]));
	neck.add(box('skinDark', [0.8, 0.7, 0.8], [0, 0.3, 0]));
	spine.add(neck);

	const head = reg(joint('head', [0, 0.7, 0]));
	head.add(box('skin', [2.1, 2.3, 2.0], [0, 1.1, 0]));

	// Beard: wraps the jaw and sides, stopping short of the mouth.
	head.add(box('hair', [2.15, 0.9, 2.05], [0, 0.35, 0]));
	head.add(box('hair', [0.35, 1.1, 2.05], [-0.9, 0.95, 0]));
	head.add(box('hair', [0.35, 1.1, 2.05], [0.9, 0.95, 0]));

	// Hair: a thick mass on top with a couple of offset blocks, because one
	// smooth cap reads as a helmet and the reference is distinctly voluminous.
	head.add(box('hair', [2.3, 0.85, 2.15], [0, 2.3, 0]));
	head.add(box('hair', [1.9, 0.5, 1.8], [0.1, 2.75, -0.05]));
	head.add(box('hair', [1.0, 0.45, 1.1], [-0.5, 3.0, 0.15]));
	head.add(box('hair', [0.8, 0.4, 0.9], [0.55, 2.95, 0.25]));
	// Sideburns down to the beard.
	head.add(box('hair', [0.3, 1.0, 0.5], [-1.0, 1.75, 0.55]));
	head.add(box('hair', [0.3, 1.0, 0.5], [1.0, 1.75, 0.55]));

	// Eyes, sitting proud of the face so they catch the key light.
	head.add(box('hair', [0.3, 0.3, 0.12], [-0.45, 1.35, 1.02]));
	head.add(box('hair', [0.3, 0.3, 0.12], [0.45, 1.35, 1.02]));
	// Brows.
	head.add(box('hair', [0.5, 0.16, 0.1], [-0.45, 1.72, 1.02]));
	head.add(box('hair', [0.5, 0.16, 0.1], [0.45, 1.72, 1.02]));

	neck.add(head);

	// ── Arms ─────────────────────────────────────────────────────────────
	for (const side of ['L', 'R']) {
		const sx = side === 'L' ? -1 : 1;

		const arm = reg(joint(`arm${side}`, [sx * 1.7, 2.7, 0]));
		arm.add(box('shirt', [0.85, 2.0, 0.85], [0, -1.0, 0]));
		spine.add(arm);

		const fore = reg(joint(`fore${side}`, [0, -2.0, 0]));
		fore.add(box('skin', [0.72, 1.8, 0.72], [0, -0.9, 0]));
		arm.add(fore);

		const hand = reg(joint(`hand${side}`, [0, -1.8, 0]));
		hand.add(box('skin', [0.85, 0.75, 0.85], [0, -0.35, 0]));
		fore.add(hand);
	}

	// ── Legs ─────────────────────────────────────────────────────────────
	for (const side of ['L', 'R']) {
		const sx = side === 'L' ? -1 : 1;

		const leg = reg(joint(`leg${side}`, [sx * 0.62, -0.6, 0]));
		leg.add(box('trouser', [1.05, 2.6, 1.1], [0, -1.3, 0]));
		pelvis.add(leg);

		const shin = reg(joint(`shin${side}`, [0, -2.6, 0]));
		shin.add(box('trouser', [0.92, 2.4, 1.0], [0, -1.2, 0]));
		leg.add(shin);

		const foot = reg(joint(`foot${side}`, [0, -2.4, 0]));
		// Extends forward (+Z) from the ankle, like a foot.
		foot.add(box('shoe', [1.0, 0.55, 1.8], [0, -0.28, 0.42]));
		shin.add(foot);
	}

	const root = new Group();
	root.add(pelvis);

	// Soles sit at about −5.9; lift so the figure stands on y = 0.
	const FOOT_Y = 5.9;
	root.position.y = FOOT_Y;

	return { root, joints, height: 11.5 };
}

const DEG = Math.PI / 180;

/**
 * Apply a resolved pose (joint name → degrees) to the figure.
 *
 * `rotation.z = −angle` because a positive SVG rotation is clockwise on
 * screen while a positive Three.js Z rotation is counter-clockwise. Getting
 * this backwards mirrors every pose, which is subtle enough to miss and
 * wrong in a way that looks merely "off".
 *
 * @param {Record<string, Group>} joints
 * @param {Record<string, number>} pose
 */
export function applyPose(joints, pose) {
	for (const name of Object.keys(joints)) {
		const a = pose[name];
		if (typeof a === 'number') joints[name].rotation.z = -a * DEG;
	}
}
