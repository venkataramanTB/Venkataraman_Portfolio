/**
 * The character: a face and two bandaged fists.
 *
 * An original figure drawn in the register of a demon-slaying shounen
 * antagonist — spiked magenta hair, sharp gold eyes, ice-blue marks cut
 * across the face, and wrapped martial-arts fists. It is not a copy of any
 * existing character: the shapes, proportions and marks below are our own,
 * and the palette is tuned to the page's black-and-gold field rather than to
 * anyone else's model sheet.
 *
 * Nothing else is drawn. No torso, no arms, no legs.
 *
 * The skeleton, however, is still the WHOLE skeleton — spine, arms,
 * forearms, legs and all. Those bones simply carry no shapes. That is the
 * trick that makes this cheap: the fists still hang off the end of real arm
 * chains, so every pose in rig.js — point, wave, dance, punch, panic,
 * think — moves them exactly where it always did, and the head still rides
 * the spine so a lean or a nod still works. Deleting the bones would have
 * meant rewriting thirty poses; emptying them cost nothing.
 *
 * It also suits the job better. He is a narrator: the face carries the
 * expression and the fists do the pointing, and a body between them was
 * only ever furniture.
 */

/**
 * Pale skin, hot magenta hair, gold eyes, ice markings.
 *
 * The key names are unchanged from the previous character, because SoftBone
 * resolves fills by name and the rig does not care what the names mean.
 */
export const SOFT_PALETTE = {
	/* Paper-pale, so the ice marks and the dark eye lines both have somewhere
	   to land. Against a black field a mid-tone face loses every detail. */
	skin: '#f2dccb',
	skinDark: '#d2ae95', // the far hand, pushed back a tone
	/* Hair in two tones: the front mass bright, the spikes behind it dropped,
	   so the silhouette has depth instead of reading as one flat cut-out. */
	hair: '#e4557f',
	hairLift: '#a93258',
	hairHi: '#f893b0', // the highlight streak through the fringe
	eyeWhite: '#fbf6ef',
	iris: '#f0c75c', // the page gold, so he belongs here
	ink: '#1b1620', // pupils, lash lines, mouth
	ice: '#73dcf2', // the markings and the wrap bands
	shirt: '#d9b45e',
	shirtDark: '#a8862f',
	trouser: '#24232a',
	trouserDark: '#1a191f',
	shoe: '#0f0e12',
	white: '#f6f1e8'
};

const cap = (w, len, fill) => ({ type: 'capsule', w, len, fill });

/**
 * One arm — invisible, except for the wrapped fist on the end.
 *
 * The bones stay so the poses keep working; only their shapes are gone.
 * The fist is drawn large, because it is now one of only three things on
 * screen and has to carry its share.
 */
function arm(side, x, far) {
	const skin = far ? 'skinDark' : 'skin';
	const s = side === 'L' ? 1 : -1; // which way the thumb points
	return {
		name: `arm${side}`,
		// Shorter than real arms. With nothing drawn between shoulder and
		// fist, full-length bones flung the hands into the far corners of the
		// frame and the three shapes stopped reading as one character.
		// Wider and longer than the previous character's. His hands were small
		// circles that could pass over the head harmlessly; a fist this size
		// parked squarely on the face in the pointing pose, so the shoulders
		// moved out and the arm got the reach to clear the hair.
		offset: { x: x * 1.15, y: -16 },
		len: 17,
		rest: side === 'L' ? 16 : -16,
		shapes: [],
		children: [
			{
				name: `fore${side}`,
				len: 14,
				rest: 0,
				shapes: [],
				children: [
					{
						name: `hand${side}`,
						len: 6,
						rest: 0,
						shapes: [
							// A closed fist: a squarer palm than a mitten, because a
							// circle reads as a wave and this character throws hands.
							{ type: 'rrect', x: -7.5, y: -4, w: 15, h: 14, rx: 5, fill: skin },
							{ type: 'circle', cx: s * 6.5, cy: -1.5, r: 4.2, fill: skin }, // thumb
							// Knuckles: three shallow nicks along the top edge, which is
							// all it takes to say "fist" rather than "ball".
							{ type: 'circle', cx: -3.6, cy: -3.4, r: 2.1, fill: skin },
							{ type: 'circle', cx: 0.4, cy: -4.2, r: 2.3, fill: skin },
							{ type: 'circle', cx: 4.4, cy: -3.4, r: 2.1, fill: skin },
							// Hand wrap, two bands across the knuckles and one at the
							// wrist. Off-white rather than pure white so it sits with
							// the paper.
							{ type: 'rrect', x: -7.6, y: 0.4, w: 15.2, h: 2.6, rx: 1.3, fill: 'white' },
							{ type: 'rrect', x: -7, y: 4.4, w: 14, h: 2.4, rx: 1.2, fill: 'white' },
							{ type: 'rrect', x: -6, y: 8.2, w: 12, h: 2.2, rx: 1.1, fill: 'white' },
							// One ice mark on the back of the fist, tying the hands to
							// the face.
							{ type: 'rrect', x: -4.5, y: -7.4, w: 9, h: 1.8, rx: 0.9, fill: 'ice' }
						],
						children: []
					}
				]
			}
		]
	};
}

/** One leg — bones only, nothing drawn. Kept so leg-driven poses (walk,
    jump, kick) still resolve without special-casing. */
function leg(side, x) {
	return {
		name: `leg${side}`,
		offset: { x, y: 7 },
		len: 22,
		rest: 0,
		shapes: [],
		children: [
			{
				name: `shin${side}`,
				len: 20,
				rest: 0,
				shapes: [],
				children: [{ name: `foot${side}`, len: 7, rest: 0, shapes: [], children: [] }]
			}
		]
	};
}

/**
 * The spikes behind the head, in the dropped tone.
 *
 * Triangles, drawn before the face, radiating outward and up. They are what
 * gives the silhouette its read at small sizes — by the time he is scaled to
 * a third of hero size the face is a smudge and the outline is the whole
 * character.
 */
const BACK_SPIKES = [
	/* Every spike leans up and outward from the crown. The first attempt had
	   them radiating evenly, including two that ran level with the ears, and
	   the result was a crown — a ring of points around a head, not hair
	   growing out of one. Hair has a direction. */
	'-14,-28 -30,-50 -4,-34',
	'-6,-33 -15,-58 3,-36',
	'2,-35 6,-60 12,-34',
	'9,-33 24,-54 15,-30',
	'14,-28 31,-42 14,-21',
	'-15,-26 -31,-38 -13,-20'
].map((points) => ({ type: 'poly', points, fill: 'hairLift' }));

export const SOFT_SKELETON = {
	name: 'pelvis',
	len: 0,
	rest: 0,
	shapes: [], // the body is not drawn; this bone only positions the rest
	children: [
		{
			name: 'spine',
			len: -26,
			rest: 0,
			shapes: [],
			children: [
				{
					name: 'neck',
					len: -5,
					rest: 0,
					shapes: [],
					children: [
						{
							name: 'head',
							len: -22,
							rest: 0,
							shapes: [
								...BACK_SPIKES,

								// The face. Round at the temples, tapering to a point at
								// the chin — the circle alone gave a child's head, and the
								// taper is most of what makes him read as sharp.
								{ type: 'circle', cx: 0, cy: -19, r: 17.5, fill: 'skin' },
								// The taper has to be narrow and shallow. At the full width
								// of the head it met the circle at two corners and turned the
								// face into a heart.
								{ type: 'poly', points: '-10.5,-10 10.5,-10 0,-1', fill: 'skin' },

								// The fringe: one cap with a jagged lower edge, over the
								// forehead. Hair like this is points, not volume, so it is
								// a path rather than the old pile of overlapping circles.
								{
									type: 'path',
									d:
										'M-18.5 -22 L-14 -34 L-11 -19 L-5.5 -33 L-1 -24 L4 -35 L8.5 -20 L14 -32 L18.5 -23' +
										' Q20 -44 0 -45 Q-20 -44 -18.5 -22 Z',
									fill: 'hair'
								},
								// A single lighter streak through the fringe. One is
								// enough; two started to look like stripes.
								{
									type: 'path',
									// Off to one side. Centred, it sat exactly where a nose
									// would and that is all anyone saw.
									d: 'M-9 -40 L-4.5 -34 L-7 -23 L-11.5 -31 Z',
									fill: 'hairHi'
								},

								// Eyes, cut as diamonds. The sclera is a polygon so the
								// inner and outer corners can both come to a point, which
								// is the entire difference between this face and a friendly
								// one.
								{ type: 'poly', points: '-11.5,-20 -6.5,-23.5 -1.5,-19.5 -6.5,-16', fill: 'eyeWhite' },
								{ type: 'poly', points: '1.5,-19.5 6.5,-23.5 11.5,-20 6.5,-16', fill: 'eyeWhite' },
								// Gold irises carry the tracking — SoftFigure's CSS moves
								// every circle whose id starts with "eye".
								{ type: 'circle', cx: -6.5, cy: -19.8, r: 3.1, fill: 'iris', id: 'eyeLiris' },
								{ type: 'circle', cx: 6.5, cy: -19.8, r: 3.1, fill: 'iris', id: 'eyeRiris' },
								{ type: 'circle', cx: -6.5, cy: -19.8, r: 1.35, fill: 'ink', id: 'eyeLpupil' },
								{ type: 'circle', cx: 6.5, cy: -19.8, r: 1.35, fill: 'ink', id: 'eyeRpupil' },
								// Upper lash line. A heavy top edge is what stops the two
								// diamonds reading as gemstones.
								{ type: 'path', d: 'M-12 -20.4 L-6.5 -24.4 L-1 -20', stroke: 'ink', sw: 1.7 },
								{ type: 'path', d: 'M1 -20 L6.5 -24.4 L12 -20.4', stroke: 'ink', sw: 1.7 },

								// Brows: hard wedges, angled down toward the nose. These
								// carry more expression than the eyes do.
								{ type: 'poly', points: '-12.5,-28.8 -2.5,-25.6 -2.5,-23.2 -12.5,-26.4', fill: 'hairLift' },
								{ type: 'poly', points: '12.5,-28.8 2.5,-25.6 2.5,-23.2 12.5,-26.4', fill: 'hairLift' },

								// Markings: ice-blue bars cut across both cheeks, three a
								// side, longest at the top. Set clear of the eyes — run them
								// across and the face turns to noise.
								//
								// There was a fourth pair up on the brow. With a fringe this
								// deep there is no forehead left to put them on, so they
								// landed on the hair and read as the remains of a headband.
								{ type: 'rrect', x: -15.5, y: -13.6, w: 9.5, h: 2, rx: 1, fill: 'ice' },
								{ type: 'rrect', x: 6, y: -13.6, w: 9.5, h: 2, rx: 1, fill: 'ice' },
								{ type: 'rrect', x: -14, y: -10.2, w: 7.5, h: 1.9, rx: 0.95, fill: 'ice' },
								{ type: 'rrect', x: 6.5, y: -10.2, w: 7.5, h: 1.9, rx: 0.95, fill: 'ice' },
								{ type: 'rrect', x: -12, y: -7, w: 5, h: 1.7, rx: 0.85, fill: 'ice' },
								{ type: 'rrect', x: 7, y: -7, w: 5, h: 1.7, rx: 0.85, fill: 'ice' },

								// Mouth: a short flat line. Level, not smiling — the
								// expression work is all in the brows.
								{ type: 'rrect', x: -3.6, y: -6.2, w: 7.2, h: 1.7, rx: 0.85, fill: 'ink' }
							],
							children: []
						}
					]
				},
				arm('R', 13, true),
				arm('L', -13, false)
			]
		},
		leg('R', 7),
		leg('L', -7)
	]
};
