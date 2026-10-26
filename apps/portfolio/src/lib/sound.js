/**
 * Interface sound.
 *
 * Synthesised with WebAudio rather than shipped as files. Three reasons, in
 * order of how much they mattered:
 *
 *  1. A click can take an argument. A landing thud gets louder when the throw
 *     was harder, a typing blip shifts pitch per character. Sampled audio
 *     plays the same every time, which is what makes UI sound grating.
 *  2. Nothing to download. The whole kit is a few hundred bytes of code
 *     against a couple of hundred KB of audio.
 *  3. No licensing to get wrong.
 *
 * Rules this follows, because sound on a website is very easy to get wrong:
 *  - Muted until the visitor asks for it. Never autoplay.
 *  - Every sound is under 150ms and well below full scale.
 *  - Sound is confirmation, never information: nothing here is the only
 *    signal for anything.
 *  - A rate limiter stops a fast scroll or a held key becoming a machine gun.
 */

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const KEY = 'vtb-sound';

/** Off by default. Sound is opt-in, always. */
export const muted = writable(true);

if (browser) {
	try {
		const saved = localStorage.getItem(KEY);
		if (saved === 'on') muted.set(false);
	} catch {
		/* blocked storage — stays muted, which is the safe default */
	}
}

export function toggleMute() {
	const next = !get(muted);
	muted.set(next);
	try {
		localStorage.setItem(KEY, next ? 'off' : 'on');
	} catch {
		/* non-fatal */
	}
	// Unmuting is itself a gesture, so it is the right moment to wake the
	// audio context and confirm with a sound.
	if (!next) {
		ensure();
		play('on');
	}
	return next;
}

/* ─────────────────────────────────────────────────────────────────────────── */

let ctx = null;
let master = null;

/** Lazily create the context. Browsers refuse one outside a user gesture. */
function ensure() {
	if (!browser || ctx) return ctx;
	const AC = window.AudioContext || window.webkitAudioContext;
	if (!AC) return null;
	ctx = new AC();
	master = ctx.createGain();
	master.gain.value = 0.16; // everything sits well under full scale
	master.connect(ctx.destination);
	return ctx;
}

if (browser) {
	// The context can only start on a gesture; take the first one that comes.
	const wake = () => {
		if (get(muted)) return;
		ensure();
		ctx?.resume?.();
	};
	window.addEventListener('pointerdown', wake, { passive: true });
	window.addEventListener('keydown', wake, { passive: true });
}

/* Rate limit: no more than one of each voice per interval. */
const lastAt = new Map();
function throttled(name, ms) {
	const now = performance.now();
	if (now - (lastAt.get(name) ?? -Infinity) < ms) return true;
	lastAt.set(name, now);
	return false;
}

/**
 * One short enveloped tone.
 * @param {object} o
 * @param {number} o.freq      starting frequency, Hz
 * @param {number} [o.to]      frequency to glide to
 * @param {number} [o.dur]     seconds
 * @param {OscillatorType} [o.type]
 * @param {number} [o.gain]    0…1, relative to master
 */
function tone({ freq, to, dur = 0.08, type = 'sine', gain = 1 }) {
	if (!ctx) return;
	const t = ctx.currentTime;
	const osc = ctx.createOscillator();
	const g = ctx.createGain();

	osc.type = type;
	osc.frequency.setValueAtTime(freq, t);
	if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t + dur);

	// A tiny attack rather than an instant start: a square edge on a gain node
	// is an audible click in its own right.
	g.gain.setValueAtTime(0.0001, t);
	g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
	g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

	osc.connect(g).connect(master);
	osc.start(t);
	osc.stop(t + dur + 0.02);
}

/** Filtered noise, for impacts. */
function noise({ dur = 0.09, gain = 0.5, freq = 900 }) {
	if (!ctx) return;
	const t = ctx.currentTime;
	const frames = Math.floor(ctx.sampleRate * dur);
	const buf = ctx.createBuffer(1, frames, ctx.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < frames; i++) {
		// Decaying noise — a flat burst sounds like static, not an impact.
		data[i] = (Math.random() * 2 - 1) * (1 - i / frames) ** 2;
	}
	const src = ctx.createBufferSource();
	src.buffer = buf;

	const lp = ctx.createBiquadFilter();
	lp.type = 'lowpass';
	lp.frequency.value = freq;

	const g = ctx.createGain();
	g.gain.value = gain;

	src.connect(lp).connect(g).connect(master);
	src.start(t);
}

/** The kit. Each entry takes an optional 0…1 intensity. */
const VOICES = {
	on: () => {
		tone({ freq: 523.25, to: 784, dur: 0.1, type: 'triangle', gain: 0.5 });
	},
	hover: () => {
		if (throttled('hover', 60)) return;
		tone({ freq: 1180, dur: 0.035, type: 'sine', gain: 0.18 });
	},
	click: () => {
		tone({ freq: 660, to: 880, dur: 0.055, type: 'triangle', gain: 0.4 });
	},
	back: () => {
		tone({ freq: 520, to: 360, dur: 0.07, type: 'triangle', gain: 0.35 });
	},
	pop: () => {
		tone({ freq: 880, to: 1320, dur: 0.07, type: 'sine', gain: 0.4 });
	},
	/** The character speaking — pitch varies so a sentence isn't a monotone. */
	blip: (v = 0.5) => {
		if (throttled('blip', 45)) return;
		tone({ freq: 420 + v * 260, dur: 0.028, type: 'square', gain: 0.1 });
	},
	/** Thrown. Intensity is the throw speed. */
	whoosh: (v = 0.5) => {
		tone({ freq: 240 + v * 300, to: 120, dur: 0.18, type: 'sawtooth', gain: 0.12 });
	},
	/** Landed. Intensity is the impact speed. */
	land: (v = 0.5) => {
		noise({ dur: 0.1, gain: 0.25 + v * 0.45, freq: 500 + v * 900 });
		tone({ freq: 90, to: 55, dur: 0.12, type: 'sine', gain: 0.4 + v * 0.3 });
	},
	scratch: () => {
		if (throttled('scratch', 55)) return;
		noise({ dur: 0.05, gain: 0.3, freq: 2600 });
	},
	reveal: () => {
		tone({ freq: 660, to: 1320, dur: 0.16, type: 'triangle', gain: 0.4 });
	}
};

/**
 * Play a voice. Silent unless the visitor turned sound on.
 * @param {keyof typeof VOICES} name
 * @param {number} [intensity] 0…1
 */
export function play(name, intensity) {
	if (!browser || get(muted)) return;
	const voice = VOICES[name];
	if (!voice) return;
	if (!ensure()) return;
	if (ctx.state === 'suspended') ctx.resume();
	try {
		voice(intensity);
	} catch {
		/* audio is never load-bearing — failing silently is correct */
	}
}

/** Svelte action: play a voice on click, and a quieter one on hover. */
export function sfx(node, name = 'click') {
	let voice = name;
	const onClick = () => play(voice);
	const onEnter = () => play('hover');
	node.addEventListener('click', onClick);
	node.addEventListener('pointerenter', onEnter);
	return {
		update(next) {
			voice = next ?? 'click';
		},
		destroy() {
			node.removeEventListener('click', onClick);
			node.removeEventListener('pointerenter', onEnter);
		}
	};
}
