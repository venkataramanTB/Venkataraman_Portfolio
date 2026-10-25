<script>
	/**
	 * The character as a rigged pixel sprite.
	 *
	 * Why pixel art rather than the photographs: a photograph can only ever be
	 * moved as one rigid object. Cut one into parts and the seams show,
	 * because the eye knows what skin and denim are supposed to look like.
	 * Quantise it to 120px and chunky colour bands and that stops being true —
	 * the seam is smaller than a pixel block, so the figure can be hinged and
	 * animated like a real sprite.
	 *
	 * The rig is two parts per pose, hinged at the waist:
	 *
	 *   top     head, torso and arms. Pivots at its BOTTOM edge (the waist).
	 *   bottom  hips and legs.        Pivots at its TOP edge (the waist).
	 *
	 * The split is found automatically, at the narrowest row in the middle
	 * third of the figure, which is where a waist actually is. Counter-rotating
	 * the two halves about that shared line is what produces walking, dancing,
	 * lunging and sulking from a single still photograph.
	 *
	 * Two poses exist, each with its own rig: `point` (arm raised) and `dance`
	 * (the Michael Jackson lean).
	 */

	/** 'point' | 'dance' */
	export let shot = 'point';
	/** Lean toward the pointer, in degrees. */
	export let lean = 0;

	// Measured when the sprites were generated. Expressed against a common
	// 120-unit height so both poses stand the same height.
	const RIG = {
		point: { w: 47, topH: 62, bottomH: 58 },
		dance: { w: 76, topH: 78, bottomH: 42 }
	};
	const UNIT = 120;

	const pct = (v) => `${(v / UNIT) * 100}%`;
</script>

<div class="sprite" style={`--lean:${lean}deg`}>
	<span class="shadow" aria-hidden="true"></span>

	{#each Object.keys(RIG) as key}
		{@const rig = RIG[key]}
		<div
			class="pose"
			class:active={shot === key}
			style={`--w:${(rig.w / UNIT) * 100}%`}
			aria-hidden={shot === key ? undefined : 'true'}
		>
			<img
				class="part top"
				src={`/character/px-${key}-top.png`}
				alt={shot === key ? 'Venkataraman' : ''}
				style={`height:${pct(rig.topH)}`}
				draggable="false"
				decoding="async"
			/>
			<img
				class="part bottom"
				src={`/character/px-${key}-bottom.png`}
				alt=""
				style={`height:${pct(rig.bottomH)}; top:${pct(rig.topH)}`}
				draggable="false"
				decoding="async"
			/>
		</div>
	{/each}
</div>

<style>
	.sprite {
		position: relative;
		width: 100%;
		height: 100%;
		transform: rotate(var(--lean));
		transform-origin: 50% 100%;
		transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
		will-change: transform;
	}

	.pose {
		position: absolute;
		left: 50%;
		bottom: 0;
		width: var(--w);
		height: 100%;
		transform: translateX(-50%);
		opacity: 0;
		transition: opacity 140ms steps(2); /* stepped: a pixel sprite shouldn't cross-fade smoothly */
		pointer-events: none;
	}
	.pose.active {
		opacity: 1;
	}

	.part {
		position: absolute;
		left: 0;
		width: 100%;
		/* The whole point: no smoothing, so the blocks stay blocks at any size. */
		image-rendering: pixelated;
		-webkit-user-drag: none;
		user-select: none;
	}

	/* The hinge. Both halves pivot about the same line — the waist — so they
	   stay joined however far they counter-rotate. */
	.top {
		top: 0;
		transform-origin: 50% 100%;
	}
	.bottom {
		transform-origin: 50% 0%;
		/* A pixel of overlap. Even hinged on a shared line, two rotations can
		   round to different subpixels and leave a hairline at the join. */
		margin-top: -1px;
	}

	.shadow {
		position: absolute;
		left: 50%;
		bottom: -1%;
		width: 48%;
		height: 4%;
		transform: translateX(-50%);
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.26);
		filter: blur(3px);
	}
	:global(:root[data-theme='dark']) .shadow {
		background: rgba(0, 0, 0, 0.55);
	}

	/* ══════════════════════════════════════════════════════════════════════
	   MOTIONS
	   Every one of these is the two halves moving against each other. That is
	   what the rig buys over the photographs: a still image can only be slid
	   about, a hinged one can walk.

	   Driven by `ch-*` classes the Companion puts on an ancestor, so these
	   reach in from outside the component.
	   ══════════════════════════════════════════════════════════════════════ */

	/* Idle — breathing. Barely visible, and that is the point: a sprite that
	   is perfectly still reads as a broken image. */
	.top {
		animation: breathe 3.6s ease-in-out infinite;
	}
	@keyframes breathe {
		0%, 100% { transform: scaleY(1); }
		50%      { transform: scaleY(1.02); }
	}

	/* Walk — legs swing, torso counter-bobs. */
	:global(.ch-walk) .bottom { animation: legs 0.44s steps(4) infinite; }
	:global(.ch-walk) .top    { animation: bob 0.22s ease-in-out infinite; }
	@keyframes legs {
		0%, 100% { transform: rotate(-9deg); }
		50%      { transform: rotate(9deg); }
	}
	@keyframes bob {
		0%, 100% { transform: translateY(0); }
		50%      { transform: translateY(-2.5%); }
	}

	/* Run — same rig, harder. */
	:global(.ch-run) .bottom { animation: legs 0.24s steps(4) infinite; }
	:global(.ch-run) .top    { animation: lean-run 0.24s ease-in-out infinite; }
	@keyframes lean-run {
		0%, 100% { transform: rotate(-7deg) translateY(0); }
		50%      { transform: rotate(-7deg) translateY(-4%); }
	}

	/* Dance — the halves oppose each other, which is what dancing looks like. */
	:global(.ch-dance) .top    { animation: dance-top 0.5s ease-in-out infinite; }
	:global(.ch-dance) .bottom { animation: dance-bot 0.5s ease-in-out infinite; }
	@keyframes dance-top {
		0%, 100% { transform: rotate(-8deg) translateY(0); }
		50%      { transform: rotate(8deg) translateY(-4%); }
	}
	@keyframes dance-bot {
		0%, 100% { transform: rotate(6deg); }
		50%      { transform: rotate(-6deg); }
	}

	/* Moonwalk — he is already in the pose, so he may as well. */
	:global(.ch-moonwalk) .bottom { animation: legs 0.32s steps(3) infinite reverse; }
	:global(.ch-moonwalk) .top    { animation: glide 0.64s ease-in-out infinite; }
	@keyframes glide {
		0%, 100% { transform: rotate(-4deg) translateX(0); }
		50%      { transform: rotate(-4deg) translateX(-3%); }
	}

	/* Jump — anticipation, launch, tuck. */
	:global(.ch-jump) .top    { animation: jump-top 0.9s ease-in-out infinite; }
	:global(.ch-jump) .bottom { animation: tuck 0.9s ease-in-out infinite; }
	@keyframes jump-top {
		0%, 100% { transform: scaleY(1) translateY(0); }
		18%      { transform: scaleY(0.88) translateY(3%); }
		45%      { transform: scaleY(1.06) translateY(-16%); }
		70%      { transform: scaleY(1) translateY(-10%); }
	}
	@keyframes tuck {
		0%, 100% { transform: translateY(0) rotate(0deg); }
		18%      { transform: translateY(2%) scaleY(0.9); }
		45%      { transform: translateY(-16%) rotate(-14deg) scaleY(0.88); }
		70%      { transform: translateY(-10%) rotate(-6deg); }
	}

	/* Punch — torso lunges, legs brace. */
	:global(.ch-punch) .top    { animation: lunge 0.3s ease-in-out infinite; }
	:global(.ch-punch) .bottom { transform: rotate(-4deg); }
	@keyframes lunge {
		0%, 100% { transform: rotate(0deg) translateX(0); }
		45%      { transform: rotate(10deg) translateX(7%); }
	}

	/* Panic — everything shakes, out of phase so it looks frantic not uniform. */
	:global(.ch-panic) .top    { animation: shake 0.08s linear infinite; }
	:global(.ch-panic) .bottom { animation: shake 0.11s linear infinite reverse; }
	@keyframes shake {
		0%, 100% { transform: translateX(-3%) rotate(-2deg); }
		50%      { transform: translateX(3%) rotate(2deg); }
	}

	/* Fly — legs trail behind. */
	:global(.ch-fly) .bottom { transform: rotate(-24deg); }
	:global(.ch-fly) .top    { animation: hover 1.1s ease-in-out infinite; }
	@keyframes hover {
		0%, 100% { transform: rotate(-10deg) translateY(0); }
		50%      { transform: rotate(-10deg) translateY(-6%); }
	}

	/* Kick — one good high kick. */
	:global(.ch-kick) .bottom { animation: kick 0.7s ease-in-out infinite; }
	@keyframes kick {
		0%, 100% { transform: rotate(0deg); }
		40%      { transform: rotate(-34deg); }
	}

	/* Sulk — the whole figure droops. */
	:global(.ch-sulk) .top {
		animation: none;
		transform: rotate(-5deg) translateY(3%) scaleY(0.95);
	}
	:global(.ch-sulk) .bottom { transform: rotate(2deg); }
	:global(.ch-sulk) .part { filter: grayscale(0.7) brightness(0.85); }

	/* Sleep — slow, deep breathing and a tilt. */
	:global(.ch-sleep) .top { animation: breathe 4.2s ease-in-out infinite; transform: rotate(6deg); }

	/* Tickle — fast squirming. */
	:global(.ch-tickle) .top    { animation: shake 0.07s linear infinite; }
	:global(.ch-tickle) .bottom { animation: shake 0.09s linear infinite reverse; }

	/* Dizzy and spin are whole-body, handled on the wrapper by the Companion. */
	:global(.ch-dizzy) .top { animation: shake 0.14s linear infinite; }

	/* Held — dangling from the pointer. */
	:global(.ch-held) .bottom { animation: dangle 1.1s ease-in-out infinite alternate; }
	:global(.ch-held) .top    { animation: none; }
	@keyframes dangle {
		from { transform: rotate(-11deg); }
		to   { transform: rotate(11deg); }
	}

	/* Wave / point / selfie — small emphatic motions. */
	:global(.ch-wave) .top   { animation: wave 1.1s ease-in-out infinite; }
	@keyframes wave {
		0%, 100% { transform: rotate(-4deg); }
		50%      { transform: rotate(4deg); }
	}
	:global(.ch-point) .top  { animation: assert 1.6s ease-in-out infinite; }
	@keyframes assert {
		0%, 100% { transform: translateY(0) scale(1); }
		50%      { transform: translateY(-3%) scale(1.02); }
	}
	:global(.ch-selfie) .top { animation: selfie 2s ease-in-out infinite; }
	@keyframes selfie {
		0%, 100% { transform: rotate(-5deg) scale(1); }
		50%      { transform: rotate(5deg) scale(1.05); }
	}

	/* Reduced motion: the rig holds a neutral stance. He is still there, still
	   says everything he was going to say, and simply stops moving. */
	@media (prefers-reduced-motion: reduce) {
		.sprite,
		.part {
			animation: none !important;
			transition: none;
		}
	}
</style>
