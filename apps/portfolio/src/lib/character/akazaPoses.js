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
 * THE BIND POSE IS A T-POSE.
 *
 * Measured off the model, not assumed: the upper arm, forearm and hand all
 * sit at y = 1.374 with the arm running flat along ±X. Zero drop. Every pose
 * in this file was authored as if zero meant "arms hanging", which is the
 * natural way to think about a character and completely wrong for this rig —
 * so at rest he stood with both arms stretched out sideways.
 *
 * Rather than re-author every pose against a T-pose, which would make them
 * unreadable, the correction below is folded into each bone's BASE rotation
 * once at load. After that, zero really does mean "arms hanging", every pose
 * in this file means what it says, and the rig matches the mental model.
 *
 * These numbers are SOLVED, not eyeballed, and solved against the RUNNING
 * scene rather than against the file. Deriving them from the glTF hierarchy
 * offline gave a confidently wrong answer: the export carries a Z-up to Y-up
 * conversion partway up the chain, so a rotation that sent the arm downward
 * in the bone's own space sent it straight forward once the scene graph had
 * finished with it. Both arms ended up horizontal while the arithmetic said
 * they were hanging. The reliable method is to ask the live skeleton where
 * the arm actually points and solve for the local rotation that puts it
 * where it belongs.
 *
 * They are mildly asymmetric because the rig is. Forcing them into mirror
 * images would look tidier here and worse on screen.
 *
 * Arms land at his sides, clear of the torso, with a slight elbow bend; the
 * forearms are solved AFTER the upper-arm correction, since they inherit it.
 */
export const REST_FIX = {
	upperArmL: [71.8 * D, 32.1 * D, -64.9 * D],
	upperArmR: [-71.4 * D, -31.6 * D, -65.3 * D],
	/* Barely anything, and that is the check that the arm correction is
	   right: the forearm is a child of the upper arm, so once the arm hangs
	   properly the forearm already points most of the way down and needs only
	   a few degrees of elbow. */
	forearmL: [0.3 * D, 1.1 * D, -5.0 * D],
	forearmR: [-0.3 * D, -1.3 * D, -5.0 * D]
};

/**
 * Rest, as a departure from the corrected base above — so this is now only
 * the small stuff: how he carries himself, not where his arms are.
 */
export const REST3D = {
	spine1: [0, 0, 0],
	spine2: [0, 0, 0],
	spine3: [0, 0, 0],
	neck: [0, 0, 0],
	head: [0, 0, 0],
	upperArmL: [0, 0, 0],
	forearmL: [0, 0, 0],
	handL: [0, 0, 0],
	upperArmR: [0, 0, 0],
	forearmR: [0, 0, 0],
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
	/**
	 * Standing at ease, modelled on the reference still: weight settled, arms
	 * hanging, torso turned a little off-camera, chin dropped so he is looking
	 * slightly down at the reader.
	 *
	 * The chin is the part that carries it, and it is the part this rig does
	 * well: the head's local Z is a clean pitch axis — measured, −15° of Z
	 * gives about −6° of real pitch. Yaw is the part it does badly. Sweeping
	 * every axis of both the spine and the head, the best torso twist
	 * available is roughly 10° of turn for 45° of input; these are bend
	 * joints, not twist joints. So the body's turn comes from the root yaw in
	 * world space, where it is exact, and the bones are left to do the part
	 * they are good at.
	 */
	idle: pose({
		spine2: [10 * D, 0, 0],
		spine3: [6 * D, 0, 0],
		neck: [-6 * D, 0, -6 * D],
		head: [-8 * D, 0, -12 * D]
	}),

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
