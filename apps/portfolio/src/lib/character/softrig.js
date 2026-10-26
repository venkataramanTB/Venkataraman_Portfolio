/**
 * The character's geometry, in the Soft system.
 *
 * Only the SHAPES live here. Every pose and animation still comes from
 * rig.js, because the joint names are identical — so the whole library
 * written for the earlier versions drives this one unchanged.
 *
 * What changed is the drawing: thick rounded capsules instead of thin
 * rectangles, a large round head, and a palette that belongs to the page
 * rather than to a photograph. The voxel figure was a faithful copy of a
 * reference site's toy; this one is a mascot for THIS interface — same
 * person, drawn the way the rest of the system is drawn.
 *
 * Proportions are deliberately un-anatomical: a big head on a short body
 * reads as friendly, which a correctly proportioned figure does not.
 */

/** Taken from the portrait, warmed to sit on the paper. */
export const SOFT_PALETTE = {
	skin: '#c98d62',
	skinDark: '#ad744c',
	hair: '#17151a',
	shirt: '#d9b45e', // the system gold, so he belongs to the page
	shirtDark: '#a8862f',
	trouser: '#24232a',
	trouserDark: '#1a191f',
	shoe: '#0f0e12',
	white: '#f3efe6'
};

const cap = (w, len, fill) => ({ type: 'capsule', w, len, fill });

/** One arm. `far` shades the away side so the two never merge. */
function arm(side, x, far) {
	return {
		name: `arm${side}`,
		offset: { x, y: -24 },
		len: 20,
		rest: side === 'L' ? 10 : -10,
		shapes: [cap(11, 20, far ? 'shirtDark' : 'shirt')],
		children: [
			{
				name: `fore${side}`,
				len: 17,
				rest: 0,
				shapes: [cap(9.5, 17, far ? 'skinDark' : 'skin')],
				children: [
					{
						name: `hand${side}`,
						len: 6,
						rest: 0,
						shapes: [{ type: 'circle', cx: 0, cy: 3, r: 6, fill: far ? 'skinDark' : 'skin' }],
						children: []
					}
				]
			}
		]
	};
}

/** One leg. */
function leg(side, x, far) {
	return {
		name: `leg${side}`,
		offset: { x, y: 7 },
		len: 22,
		rest: 0,
		shapes: [cap(13, 22, far ? 'trouserDark' : 'trouser')],
		children: [
			{
				name: `shin${side}`,
				len: 20,
				rest: 0,
				shapes: [cap(11.5, 20, far ? 'trouserDark' : 'trouser')],
				children: [
					{
						name: `foot${side}`,
						len: 7,
						rest: 0,
						shapes: [
							// A rounded shoe, pointing forward.
							{ type: 'rrect', x: -7, y: 0, w: 17, h: 9, rx: 4.5, fill: 'shoe' }
						],
						children: []
					}
				]
			}
		]
	};
}

export const SOFT_SKELETON = {
	name: 'pelvis',
	len: 0,
	rest: 0,
	shapes: [{ type: 'rrect', x: -13, y: -5, w: 26, h: 13, rx: 6.5, fill: 'trouser' }],
	children: [
		{
			name: 'spine',
			len: -26,
			rest: 0,
			shapes: [
				// A soft, slightly tapered torso.
				{ type: 'rrect', x: -15, y: -28, w: 30, h: 32, rx: 13, fill: 'shirt' }
			],
			children: [
				{
					name: 'neck',
					len: -5,
					rest: 0,
					shapes: [{ type: 'rrect', x: -5, y: -6, w: 10, h: 8, rx: 4, fill: 'skinDark' }],
					children: [
						{
							name: 'head',
							len: -22,
							rest: 0,
							shapes: [
								// Big and round — this is most of the friendliness.
								{ type: 'circle', cx: 0, cy: -18, r: 17, fill: 'skin' },

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

								// Eyes, sitting in the clear band between hair and beard.
								{ type: 'circle', cx: -6, cy: -19, r: 2.7, fill: 'hair', id: 'eyeL' },
								{ type: 'circle', cx: 6, cy: -19, r: 2.7, fill: 'hair', id: 'eyeR' },
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
		leg('R', 7, true),
		leg('L', -7, false)
	]
};
