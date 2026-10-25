<script>
	/**
	 * The character, as photographs.
	 *
	 * Two cut-out poses of Venkataraman stand in for a drawn avatar:
	 *
	 *   point — arched back, arm thrown up. The explaining pose. Default.
	 *   dance — the Michael Jackson lean, hat brim in hand. Celebration.
	 *
	 * What this costs, and it is worth stating plainly: a photograph cannot
	 * change expression. The drawn version could raise an eyebrow or go
	 * cross-eyed; this one cannot. So all of the personality has to come from
	 * how the figure MOVES and what it SAYS — which is why every pose below is
	 * a real physical transform rather than a swapped face, and why the
	 * speech bubble carries more weight here than it would otherwise.
	 *
	 * In exchange, it is unmistakably him, which no drawing of mine would be.
	 */

	/** Which photo: 'point' | 'dance'. */
	export let shot = 'point';
	/** How far the figure leans toward the pointer, in degrees. */
	export let lean = 0;

	const SRC = {
		point: '/character/point.png',
		dance: '/character/dance.png'
	};

</script>

<!-- The box is fixed and the images are contained inside it, bottom-aligned.
     Sizing by height rather than width is what keeps him the same height in
     both poses despite the photographs being different shapes. -->
<div class="figure" style={`--lean:${lean}deg`}>
	<!-- Contact shadow. Without it a cut-out photograph reads as a sticker
	     pasted on the page rather than something standing in the scene. -->
	<span class="shadow" aria-hidden="true"></span>

	{#each Object.keys(SRC) as key}
		<img
			class="shot"
			class:active={shot === key}
			src={SRC[key]}
			alt={key === shot ? 'Venkataraman' : ''}
			aria-hidden={key === shot ? undefined : 'true'}
			draggable="false"
			decoding="async"
			loading="eager"
		/>
	{/each}
</div>

<style>
	.figure {
		position: relative;
		width: 100%;
		height: 100%;
		/* The lean follows the pointer — the one bit of "aliveness" a still
		   photograph can still do. Pivot at the feet, like a real body. */
		transform: rotate(var(--lean)) scale(var(--sx, 1), var(--sy, 1));
		transform-origin: 50% 96%;
		transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
		will-change: transform;
	}

	.shot {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: bottom center;
		/* Both photos stay in the DOM and cross-fade, so switching pose never
		   shows a gap while the other decodes. */
		opacity: 0;
		transition: opacity 220ms ease;
		pointer-events: none;
		-webkit-user-drag: none;
		user-select: none;
		filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.22));
	}
	.shot.active {
		opacity: 1;
	}

	.shadow {
		position: absolute;
		left: 50%;
		bottom: -2%;
		width: 62%;
		height: 7%;
		transform: translateX(-50%);
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.22);
		filter: blur(5px);
	}
	:global(:root[data-theme='dark']) .shadow {
		background: rgba(0, 0, 0, 0.5);
	}

	@media (prefers-reduced-motion: reduce) {
		.figure {
			transition: none;
		}
	}
</style>
