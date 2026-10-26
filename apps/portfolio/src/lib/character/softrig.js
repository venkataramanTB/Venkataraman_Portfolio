/**
 * The character: a face and two hands.
 *
 * Nothing else is drawn. No torso, no arms, no legs.
 *
 * The skeleton, however, is still the WHOLE skeleton — spine, arms,
 * forearms, legs and all. Those bones simply carry no shapes. That is the
 * trick that makes this cheap: the hands still hang off the end of real arm
 * chains, so every pose in rig.js — point, wave, dance, punch, panic,
 * think — moves them exactly where it always did, and the head still rides
 * the spine so a lean or a nod still works. Deleting the bones would have
 * meant rewriting thirty poses; emptying them cost nothing.
 *
 * It also suits the job better. He is a narrator: the face carries the
 * expression and the hands do the pointing, and a body between them was
 * only ever furniture.
 */

/** Taken from the portrait, warmed to sit on the paper. */
export const SOFT_PALETTE = {
	skin: '#c98d62',
	skinDark: '#ad744c',
	/* Lifted well off the field. At #17151a the hair was darker than the page
	   and his head simply had no silhouette — on black, "black hair" has to be
	   charcoal or there is nothing to see. */
	hair: '#3b3238',
	hairLift: '#4a4047',
	eyeWhite: '#f3efe6',
	shirt: '#d9b45e', // the system gold, so he belongs to the page
	shirtDark: '#a8862f',
	trouser: '#24232a',
	trouserDark: '#1a191f',
	shoe: '#0f0e12',
	white: '#f3efe6'
};

const cap = (w, len, fill) => ({ type: 'capsule', w, len, fill });

/**
 * One arm — invisible, except for the hand on the end.
 *
 * The bones stay so the poses keep working; only their shapes are gone.
 * The hand is drawn larger than it was on the full figure, because it is
 * now one of only three things on screen and has to carry its share.
 */
function arm(side, x, far) {
	return {
		name: `arm${side}`,
		// Shorter than real arms. With nothing drawn between shoulder and
		// hand, full-length bones flung the hands into the far corners of the
		// frame and the three shapes stopped reading as one character.
		offset: { x: x * 0.7, y: -22 },
		len: 13,
		rest: side === 'L' ? 16 : -16,
		shapes: [],
		children: [
			{
				name: `fore${side}`,
				len: 11,
				rest: 0,
				shapes: [],
				children: [
					{
						name: `hand${side}`,
						len: 6,
						rest: 0,
						shapes: [
							// A mitten: palm plus thumb. Two overlapping circles read
							// as a hand at this size where one circle reads as a dot.
							{ type: 'circle', cx: 0, cy: 3, r: 8, fill: far ? 'skinDark' : 'skin' },
							{
								type: 'circle',
								cx: side === 'L' ? 6.5 : -6.5,
								cy: -2.5,
								r: 4.2,
								fill: far ? 'skinDark' : 'skin'
							}
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
								// A touch of lift behind the hair mass, so the silhouette
								// separates from the field instead of merging with it.
								{ type: 'circle', cx: 1, cy: -31, r: 21, fill: 'hairLift' },
								// Big and round — this is most of the friendliness.
								{ type: 'circle', cx: 0, cy: -18, r: 18, fill: 'skin' },

								// Beard: a rounded mass across the JAW only. The first
								// version sat at eye level and turned the whole head into a
								// dark blob — a face needs clear space between the hairline
								// and the beard or there is nothing left to read.
								{ type: 'rrect', x: -13.5, y: -8, w: 27, h: 12, rx: 6, fill: 'hair' },
								{ type: 'circle', cx: 0, cy: -3, r: 7.5, fill: 'hair' },
								// Sideburns joining beard to hair.
								{ type: 'rrect', x: -16.5, y: -22, w: 5, h: 16, rx: 2.5, fill: 'hair' },
								{ type: 'rrect', x: 11.5, y: -22, w: 5, h: 16, rx: 2.5, fill: 'hair' },

								// Curly hair: overlapping circles rather than one cap, so it
								// reads as volume instead of a helmet.
								{ type: 'circle', cx: -10, cy: -29, r: 9, fill: 'hair' },
								{ type: 'circle', cx: 1, cy: -33, r: 10.5, fill: 'hair' },
								{ type: 'circle', cx: 12, cy: -28, r: 8.5, fill: 'hair' },
								{ type: 'circle', cx: -16, cy: -22, r: 6.5, fill: 'hair' },
								{ type: 'circle', cx: 16, cy: -21, r: 6, fill: 'hair' },

								// Eyes get whites. Dark pupils alone were dark-on-dark against
								// the hair and beard and disappeared at this size.
								{ type: 'circle', cx: -6.5, cy: -19, r: 4.4, fill: 'eyeWhite' },
								{ type: 'circle', cx: 6.5, cy: -19, r: 4.4, fill: 'eyeWhite' },
								{ type: 'circle', cx: -6.5, cy: -19, r: 2.4, fill: 'hair', id: 'eyeL' },
								{ type: 'circle', cx: 6.5, cy: -19, r: 2.4, fill: 'hair', id: 'eyeR' },
								// Brows, which carry more expression than the eyes do.
								{ type: 'rrect', x: -9, y: -25, w: 7, h: 2.2, rx: 1.1, fill: 'hair' },
								{ type: 'rrect', x: 2, y: -25, w: 7, h: 2.2, rx: 1.1, fill: 'hair' }
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
