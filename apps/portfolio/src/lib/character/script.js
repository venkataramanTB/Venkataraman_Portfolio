/**
 * Everything the character says and does.
 *
 * Kept entirely separate from the component that runs it, because this is the
 * part worth rewriting often — the voice is the feature, and it should be
 * editable without touching state machines or physics.
 *
 * Voice notes: first person, present tense, short. He is the portfolio's
 * author showing you round his own site, so he is allowed to be proud of the
 * work and dry about himself. No exclamation-mark spam, no "Hey there!",
 * nothing that reads like a chatbot onboarding flow.
 */

/** Pick a random entry, never the same one twice running. */
const lastPicked = new Map();
export function pick(key, list) {
	if (list.length === 1) return list[0];
	let choice;
	do {
		choice = list[Math.floor(Math.random() * list.length)];
	} while (choice === lastPicked.get(key) && list.length > 1);
	lastPicked.set(key, choice);
	return choice;
}

/* ════════════════════════════════════════════════════════════════════════════
   ARRIVAL
   ════════════════════════════════════════════════════════════════════════════ */

export const GREETING = {
	first: [
		{ text: "Hi — I'm Venkataraman. Scroll down and I'll show you round.", pose: 'wave', face: 'happy' },
		{ text: "Welcome. I built all this. Scroll, and I'll explain as we go.", pose: 'wave', face: 'happy' }
	],
	returning: [
		{ text: "Oh, you're back. Want the tour again, or shall I keep quiet?", pose: 'wave', face: 'grin' },
		{ text: "Returning visitor. That's a good sign. Scroll on.", pose: 'wave', face: 'happy' }
	]
};

/* ════════════════════════════════════════════════════════════════════════════
   SECTION NARRATION
   One line per section, delivered once as it comes into view. A second and
   third line exist so a re-scroll isn't an exact rerun.
   ════════════════════════════════════════════════════════════════════════════ */

export const SECTIONS = {
	practice: {
		label: 'Practice',
		lines: [
			{ text: "Four disciplines. AI, machine learning, iOS and full-stack — and the counts here come live from the database, not from me typing them in.", pose: 'point', face: 'neutral' },
			{ text: "Most of my work sits where these overlap. A model is only useful once something ships around it.", pose: 'idle', face: 'neutral' },
			{ text: "If you only read one section, this is the one that says what I actually do.", pose: 'point', face: 'happy' }
		]
	},
	work: {
		label: 'Work',
		lines: [
			{ text: "The projects. Every card opens a full write-up — the problem, the approach, and what it really took.", pose: 'point', face: 'happy' },
			{ text: "Featured ones are up top. Use the filter if you only care about one kind.", pose: 'point', face: 'neutral' },
			{ text: "Go on, open one. I'll wait here.", pose: 'idle', face: 'grin' }
		]
	},
	experience: {
		label: 'Experience',
		lines: [
			{ text: "Roles and study on one timeline. I merged them deliberately — two separate lists make you do the reconciling.", pose: 'point', face: 'neutral' },
			{ text: "The green dot is where I am now.", pose: 'point', face: 'happy' },
			{ text: "Associate Software Engineer at Mythics. Application development and applied ML.", pose: 'idle', face: 'neutral' }
		]
	},
	stack: {
		label: 'Stack',
		lines: [
			{ text: "The tools, grouped by what they're for. The bars are relative depth — I'm not going to award myself a percentage.", pose: 'point', face: 'neutral' },
			{ text: "Everything here is in active use. No padding.", pose: 'idle', face: 'happy' },
			{ text: "Hover a group if you want the detail.", pose: 'point', face: 'neutral' }
		]
	},
	credentials: {
		label: 'Credentials',
		lines: [
			{ text: "Certificates and awards. Every one has a Verify link — don't take my word for any of it.", pose: 'point', face: 'happy' },
			{ text: "Oracle, Google, Cisco, Anthropic. The credential IDs are real; go and check.", pose: 'idle', face: 'neutral' },
			{ text: "Expired ones say so. I'd rather tell you than have you notice.", pose: 'idle', face: 'neutral' }
		]
	},
	contact: {
		label: 'Contact',
		lines: [
			{ text: "This is the part where you email me. Click the address and it copies.", pose: 'point', face: 'grin' },
			{ text: "The form composes a message in your own mail app — nothing is sent from this page. I'd rather say so than surprise you.", pose: 'idle', face: 'neutral' },
			{ text: "Open to new roles, and I read everything.", pose: 'wave', face: 'happy' }
		]
	}
};

/* ════════════════════════════════════════════════════════════════════════════
   REACTIONS
   ════════════════════════════════════════════════════════════════════════════ */

export const REACTIONS = {
	grab: [
		{ text: 'Oh — alright then.', face: 'surprised' },
		{ text: 'Psst. You can throw me, you know.', face: 'grin' },
		{ text: 'Careful, I bruise.', face: 'surprised' }
	],
	throw: [
		{ text: 'Weeeeee—', face: 'panic' },
		{ text: 'To infinity—', face: 'surprised' },
		{ text: 'Wrong! Wrong direction!', face: 'panic' }
	],
	land: [
		{ text: 'Stuck the landing.', face: 'grin' },
		{ text: "I'm fine. Everything's fine.", face: 'dizzy' },
		{ text: 'Ow.', face: 'sulk' },
		{ text: "Do that again and I'm charging you.", face: 'sulk' }
	],
	tickle: [
		{ text: "Stop — stop, I'm ticklish.", face: 'grin' },
		{ text: 'Ah— ah—', face: 'grin' },
		{ text: 'This is harassment.', face: 'grin' },
		{ text: "Okay you've made your point.", face: 'sulk' }
	],
	fastScroll: [
		{ text: 'Slow down, I have notes!', face: 'panic' },
		{ text: "You're going to miss the good bit.", face: 'surprised' },
		{ text: 'Right, nobody reads anything any more.', face: 'sulk' }
	],
	copied: [
		{ text: "Copied. Talk soon — I mean it.", face: 'grin' },
		{ text: "That's the address. Use it.", face: 'happy' }
	],
	idle: [
		{ text: 'Still here.', face: 'neutral' },
		{ text: "Nobody's watching, right?", face: 'grin' },
		{ text: 'You can grab me, if you like.', face: 'happy' },
		{ text: 'Try a trick. The button, there.', face: 'point' },
		{ text: '...', face: 'sleep' }
	],
	mobile: [
		{ text: 'Ooh, mobile mode.', face: 'surprised' },
		{ text: 'Back to the big screen.', face: 'happy' }
	],
	dismissed: [
		{ text: 'Fine. Hmph.', face: 'sulk' },
		{ text: "I'll be in the corner if you need me.", face: 'sulk' }
	],
	recalled: [
		{ text: 'Knew you would.', face: 'grin' },
		{ text: 'No hard feelings.', face: 'happy' }
	],
	bottom: [
		{ text: "That's everything. Shall I walk you back to the top?", face: 'happy' },
		{ text: "You reached the end. Most people don't. Email me.", face: 'grin' }
	]
};

/* ════════════════════════════════════════════════════════════════════════════
   TRICKS
   `pose` is the CSS class suffix on the wrapper; `ms` is how long it runs
   before he settles back. `fly` and `vanish` move him, so the component gives
   those special handling.
   ════════════════════════════════════════════════════════════════════════════ */

export const TRICKS = [
	{ id: 'dance', label: 'Dance', pose: 'dance', face: 'grin', ms: 3200, line: 'Watch this.' },
	{ id: 'punch', label: 'Punching bag', pose: 'punch', face: 'panic', ms: 2600, line: 'Bring it on.' },
	{ id: 'panic', label: 'Panic', pose: 'panic', face: 'panic', ms: 2200, line: 'Aaah! Who broke prod?' },
	{ id: 'fly', label: 'Fly', pose: 'fly', face: 'surprised', ms: 2600, line: 'To infinity—' },
	{ id: 'vanish', label: 'Vanish', pose: 'idle', face: 'wink', ms: 2000, line: 'Now you see me...' },
	{ id: 'hiccup', label: 'Hiccup', pose: 'idle', face: 'surprised', ms: 2400, line: 'Hic! Excuse me.' },
	{ id: 'peekaboo', label: 'Peekaboo', pose: 'idle', face: 'grin', ms: 2000, line: 'Boo!' },
	{ id: 'selfie', label: 'Selfie', pose: 'selfie', face: 'grin', ms: 2400, line: 'Say cheese.' },
	{ id: 'dizzy', label: 'Dizzy', pose: 'idle', face: 'dizzy', ms: 2800, line: 'Everything is spinning.' },
	{ id: 'sneeze', label: 'Sneeze', pose: 'idle', face: 'surprised', ms: 2000, line: 'Achoo! Sorry.' },
	{ id: 'sulk', label: 'Sulk', pose: 'sulk', face: 'sulk', ms: 3000, line: "Hmph. Not talking to you." },
	{ id: 'sleep', label: 'Nap', pose: 'sleep', face: 'sleep', ms: 3400, line: 'Just five minutes.' },
	{ id: 'walk', label: 'Go for a walk', pose: 'walk', face: 'happy', ms: 2800, line: 'Stretching the legs.' }
];
