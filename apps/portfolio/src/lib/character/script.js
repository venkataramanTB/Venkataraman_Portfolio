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
		/**
		 * Beats, delivered in sequence with a pause between them.
		 *
		 * One line per section made him a signpost. He is supposed to be the
		 * one telling you about me, so each section gets a short monologue
		 * instead: what it is, what is actually true about it, and the bit a
		 * reader would otherwise have to infer for themselves.
		 */
		beats: [
			{ text: "Right — the short version of me. Four disciplines: AI engineering, machine learning, native iOS, and full-stack.", pose: 'point', face: 'neutral' },
			{ text: "People usually assume one of those is the real job and the rest are hobbies. They aren't. Most of what I ship lives where they overlap.", pose: 'idle', face: 'neutral' },
			{ text: "These counts come live from my database, by the way. If I learn something next week, this number changes without me editing a line of code.", pose: 'point', face: 'grin' }
		]
	},
	work: {
		label: 'Work',
		beats: [
			{ text: "The work. Learning platforms, a navigation system, a skills tracker, a chatbot, some F1 data analysis.", pose: 'point', face: 'happy' },
			{ text: "Every card opens a full write-up — the problem, the approach, and honestly what it cost me. Not just a screenshot and a tech-stack list.", pose: 'idle', face: 'neutral' },
			{ text: "Use the filter if you only care about one kind. I won't be offended.", pose: 'idle', face: 'grin' }
		]
	},
	experience: {
		label: 'Experience',
		beats: [
			{ text: "Where I've actually worked. I'm an Associate Software Engineer at Mythics — application development and applied machine learning.", pose: 'point', face: 'neutral' },
			{ text: "Before that I was a Practice AI Engineer there, on intelligent systems and emerging tech. Same company, different seat.", pose: 'idle', face: 'neutral' },
			{ text: "Roles and study sit on one timeline on purpose. Two separate lists make you do the reconciling, and that's my job, not yours.", pose: 'point', face: 'neutral' },
			{ text: "The green dot is where I am right now.", pose: 'idle', face: 'happy' }
		]
	},
	stack: {
		label: 'Stack',
		beats: [
			{ text: "The tools. Grouped by what they're for rather than by language, because nobody hires for an alphabet.", pose: 'point', face: 'neutral' },
			{ text: "The bars are relative depth, not a score. I'm not going to award myself a percentage and ask you to believe it.", pose: 'idle', face: 'neutral' },
			{ text: "Everything here is in active use. No padding, no 'familiar with'.", pose: 'idle', face: 'grin' }
		]
	},
	credentials: {
		label: 'Credentials',
		beats: [
			{ text: "Certificates and awards. Oracle, Google, Cisco, Anthropic.", pose: 'point', face: 'happy' },
			{ text: "Every one has a Verify link and a real credential ID. Please don't take my word for any of it — that's rather the point.", pose: 'idle', face: 'neutral' },
			{ text: "If one has expired it says so. I'd rather tell you than have you find out.", pose: 'idle', face: 'neutral' }
		]
	},
	contact: {
		label: 'Contact',
		beats: [
			{ text: "And that's the tour. I'm based in Bengaluru, and I'm open to new roles.", pose: 'wave', face: 'happy' },
			{ text: "The form composes a message in your own mail app — nothing is sent from this page. I'd rather say that up front than surprise you.", pose: 'idle', face: 'neutral' },
			{ text: "Or just click the address and it copies. I read everything.", pose: 'point', face: 'grin' }
		]
	}
};

/** Back-compat: the first beat doubles as the old single line. */
for (const key of Object.keys(SECTIONS)) {
	SECTIONS[key].lines = SECTIONS[key].beats;
}

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

	// Everything below needs the hinge at his waist, so none of it was
	// possible while he was a photograph.
	{ id: 'walk', label: 'Walk', pose: 'walk', face: 'happy', ms: 3000, line: 'Stretching the legs.' },
	{ id: 'run', label: 'Run', pose: 'run', face: 'surprised', ms: 2600, line: "Can't stop, won't stop." },
	{ id: 'jump', label: 'Jump', pose: 'jump', face: 'grin', ms: 2800, line: 'Hup!' },
	{ id: 'kick', label: 'High kick', pose: 'kick', face: 'grin', ms: 2400, line: 'Hiyah.' },
	{ id: 'moonwalk', label: 'Moonwalk', pose: 'moonwalk', face: 'grin', ms: 3600, line: 'Watch the feet.' }
];
