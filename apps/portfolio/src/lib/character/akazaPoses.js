/**
 * Poses for the 3D figure.
 *
 * THE MODEL SHIPS NO ANIMATION. It is rigged — 703 joints — but the GLB
 * contains zero clips, so there is nothing to play. Every pose below is
 * authored by hand as a set of bone rotations in radians, and the runtime
 * springs between them exactly the way the SVG rig did. That is also why
 * this file is small: hand-authoring a 703-joint rig is not on, so we drive
 * the dozen bones that carry a read and let the rest follow by hierarchy.
 *
 * Bone names come from the model itself. They are stable prefixes with an
 * export-order suffix glued on (`C_Head_1_013`), so everything here matches
 * on the PREFIX — the suffix is an artefact of the exporter and would break
 * the moment the file was re-exported.
 *
 * Axis conventions, learned from the model rather than assumed:
 *   arms hang down the −Y axis, so raising one is a rotation about Z;
 *   +Z on the left arm lifts it, −Z on the right (they mirror);
 *   X bends a limb forward, toward the viewer.
 */

/** Bone prefix → the key we address it by. */
export const BONES = {
	hips: 'C_Hips_1_',
	spine1: 'C_Spine_1_',
	spine2: 'C_Spine_2_',
	spine3: 'C_Spine_3_',
	neck: 'C_Neck_1_',
	head: 'C_Head_1_',
	shoulderL: 'L_Shoulder_1_',
	upperArmL: 'L_UpperArm_1_',
	forearmL: 'L_Forearm_1_',
	handL: 'L_Hand_1_',
	shoulderR: 'R_Shoulder_1_',
	upperArmR: 'R_UpperArm_1_',
	forearmR: 'R_Forearm_1_',
	handR: 'R_Hand_1_'
};

const D = Math.PI / 180;

/**
 * Rest. Not a T-pose and not the bind pose — arms dropped and slightly
 * forward, weight settled. Everything else is measured as a departure from
 * this, so it is the one pose worth getting exactly right.
 */
export const REST3D = {
	spine1: [0, 0, 0],
	spine2: [0, 0, 0],
	spine3: [0, 0, 0],
	neck: [0, 0, 0],
	head: [0, 0, 0],
	upperArmL: [8 * D, 0, 6 * D],
	forearmL: [10 * D, 0, 0],
	handL: [0, 0, 0],
	upperArmR: [8 * D, 0, -6 * D],
	forearmR: [10 * D, 0, 0],
	handR: [0, 0, 0]
};

const pose = (over) => ({ ...REST3D, ...over });

/**
 * The poses the page actually calls for.
 *
 * `script.js` asks for more moods than a hand-authored set can carry
 * honestly, so several names map onto one body. A badly faked punch reads as
 * a bug; the same figure leaning in reads as deliberate.
 */
export const POSES = {
	idle: REST3D,

	/* Right arm up and out, elbow nearly straight, torso turned into it and
	   the head following the hand. The head turn is what sells it — an arm
	   raised with the face still pointing at the reader looks like a stretch,
	   not a gesture. */
	point: pose({
		spine2: [0, -10 * D, 0],
		spine3: [0, -8 * D, 0],
		neck: [-6 * D, -14 * D, 0],
		head: [-8 * D, -10 * D, 0],
		upperArmR: [-14 * D, -20 * D, -104 * D],
		forearmR: [0, 0, -14 * D],
		handR: [0, 0, -10 * D],
		upperArmL: [10 * D, 0, 10 * D]
	}),

	/* Open palm up by the head. The forearm is what waves; the upper arm
	   holds still, because waving from the shoulder is a semaphore signal. */
	wave: pose({
		spine2: [0, 6 * D, 0],
		neck: [0, 8 * D, 4 * D],
		head: [-4 * D, 6 * D, 4 * D],
		upperArmR: [-20 * D, -10 * D, -128 * D],
		forearmR: [0, -30 * D, -26 * D],
		handR: [0, 0, 18 * D],
		upperArmL: [12 * D, 0, 12 * D]
	}),

	/* Both arms up, hips and shoulders counter-rotated. The counter-rotation
	   is the whole trick: rotate everything the same way and the figure
	   swings like a plank. */
	dance: pose({
		hips: [0, 14 * D, 0],
		spine2: [0, -10 * D, 8 * D],
		spine3: [0, -8 * D, 6 * D],
		neck: [0, 0, -6 * D],
		head: [-6 * D, 0, -8 * D],
		upperArmR: [-30 * D, -20 * D, -142 * D],
		forearmR: [0, -20 * D, -30 * D],
		upperArmL: [-30 * D, 20 * D, 142 * D],
		forearmL: [0, 20 * D, 30 * D]
	}),

	/* Weight back, both forearms up and in, chin tucked. Reads as guarding,
	   which covers both "startled" and "bracing" without committing to a
	   cartoon flail. */
	panic: pose({
		spine1: [-10 * D, 0, 0],
		spine2: [-8 * D, 0, 0],
		neck: [12 * D, 0, 0],
		head: [10 * D, 0, 0],
		upperArmR: [-50 * D, -30 * D, -92 * D],
		forearmR: [0, -60 * D, -54 * D],
		upperArmL: [-50 * D, 30 * D, 92 * D],
		forearmL: [0, 60 * D, 54 * D]
	}),

	/* A fist drawn back at the hip, shoulders turned, head level and front.
	   This is a demon's ready stance rather than a thrown punch — a punch
	   needs the follow-through frames the spring system cannot give it, and
	   the held stance is the better image anyway. */
	punch: pose({
		hips: [0, -18 * D, 0],
		spine2: [4 * D, -22 * D, 0],
		spine3: [4 * D, -10 * D, 0],
		neck: [0, 26 * D, 0],
		head: [-4 * D, 20 * D, 0],
		upperArmR: [28 * D, -40 * D, -24 * D],
		forearmR: [0, -70 * D, -40 * D],
		upperArmL: [-26 * D, 20 * D, 40 * D],
		forearmL: [0, 40 * D, 60 * D]
	}),

	/* One hand to the chin, head tipped, weight on the other hip. */
	think: pose({
		hips: [0, 0, -4 * D],
		spine2: [0, 8 * D, 4 * D],
		neck: [-10 * D, 6 * D, 8 * D],
		head: [-12 * D, 4 * D, 10 * D],
		upperArmR: [-48 * D, -16 * D, -62 * D],
		forearmR: [0, -84 * D, -70 * D],
		handR: [0, 0, -20 * D],
		upperArmL: [14 * D, 0, 14 * D]
	})
};

/**
 * Names the script uses that have no body of their own, and what they borrow.
 * Keeping this explicit — rather than silently falling back to idle — means
 * an unmapped pose is a visible decision instead of a figure that mysteriously
 * stops moving.
 */
export const ALIASES = {
	walk: 'idle',
	jump: 'dance',
	kick: 'punch',
	happy: 'wave',
	celebrate: 'dance',
	sad: 'think',
	confused: 'think',
	sleep: 'idle',
	// The states Companion.svelte drives directly. `held` and `fly` are what
	// he does while being dragged and thrown, so they borrow the guard; being
	// picked up by a stranger is a reasonable thing to brace against.
	held: 'panic',
	fly: 'panic',
	tickle: 'dance',
	sulk: 'think'
};

/** Resolve a script pose name to a pose object. */
export function resolvePose(name) {
	return POSES[name] ?? POSES[ALIASES[name]] ?? POSES.idle;
}

/**
 * Poses that are a moment rather than a state. The companion's `onDone`
 * contract expects a one-shot to report back so it can return to idle; a
 * stance that has no natural end never fires it.
 */
export const ONE_SHOT = new Set(['point', 'wave', 'dance', 'panic', 'punch']);
export const ONE_SHOT_MS = 2600;
