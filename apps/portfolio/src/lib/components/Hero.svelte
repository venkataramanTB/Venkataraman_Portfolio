<script>
	/**
	 * Opening statement.
	 *
	 * Leads with the name at the largest optical size on the site, then the
	 * one sentence that says what he does, then evidence. No decorative
	 * full-viewport animation: a hero that moves on its own competes with the
	 * reader for attention and is the first thing that reads as templated.
	 *
	 * The right-hand column is a reserved stage for the character, who is the
	 * hero image. Nothing is drawn into it here — the Companion measures the
	 * slot and places himself in it — but the space is real, so the headline
	 * is laid out around him instead of him covering it.
	 */
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from '$lib/motion/spring.js';
	import { press } from '$lib/motion/gestures.js';
	import Icon from './Icon.svelte';

	export let profile = null;
	export let socialLinks = [];

	const SOCIAL_ICONS = {
		github: 'github',
		linkedin: 'linkedin',
		twitter: 'x',
		x: 'x',
		email: 'mail',
		mail: 'mail',
		website: 'site'
	};

	$: name = profile?.name ?? 'Venkataraman TB';
	$: tagline =
		profile?.tagline ?? 'AI engineer, full-stack developer and native iOS developer.';
	$: location = profile?.location ?? '';
	$: openToWork = profile?.open_to_work ?? false;

	/* ─── Name, split for a staggered line reveal ───────────────────────────
	   Split on words rather than characters: per-character reveals on a name
	   read as an effect, per-word reads as typesetting. */
	/**
	 * The hero sentence. Split into parts so each can take its own weight and
	 * its own reveal delay — the emphasis is the design, so it is data rather
	 * than markup.
	 */
	const HEADLINE = [
		{ text: 'I', weight: 'light' },
		{ text: 'build', weight: '' },
		{ text: 'systems', weight: '' },
		{ text: 'that', weight: 'light' },
		{ text: 'think.', weight: 'mid' }
	];

	let revealed = false;
	/** Only hide-then-reveal once JS is live to undo it. */
	let canAnimate = false;
	onMount(() => {
		// One frame, so the initial state paints before the transition starts.
		canAnimate = true;
		requestAnimationFrame(() => (revealed = true));
	});

	/* The formal portrait moved to the Practice section; the character now
	   occupies this column, so the pointer-tilt machinery that drove the old
	   photo card is gone with it. */

</script>

<section id="top" class="hero" class:hero-anim={canAnimate}>
	<div class="shell hero-inner">
		<div class="hero-copy">
			{#if openToWork}
				<p class="chip chip-live hero-status" class:in={revealed}>
					<span class="chip-dot" aria-hidden="true"></span>
					<span>Open to new roles</span>
				</p>
			{/if}

			<!-- One sentence, set enormous, with the weight changing inside it.
			     On a single-colour field there is no second colour to emphasise
			     with, so weight does that job: the nouns carry the sentence and
			     the connective words step back. -->
			<h1 class="t-hero hero-line">
				{#each HEADLINE as part, i}
					<span class="line">
						<span
							class="line-in {part.weight}"
							class:in={revealed}
							style={`transition-delay:${120 + i * 90}ms`}
						>{part.text}</span>
					</span>{' '}
				{/each}
			</h1>

			<p class="t-lead hero-tagline" class:in={revealed}>{name} — {tagline}</p>

			<div class="hero-meta" class:in={revealed}>
				{#if location}
					<span class="t-small hero-meta-item">
						<Icon name="location" size={15} />
						{location}
					</span>
				{/if}
				{#if profile?.email}
					<a class="t-small hero-meta-item link-quiet" href={`mailto:${profile.email}`}>
						<Icon name="mail" size={15} />
						{profile.email}
					</a>
				{/if}
			</div>

			<div class="hero-actions" class:in={revealed}>
				<a class="btn btn-primary" href="#work" use:press>
					<span>See the work</span>
					<Icon name="arrow-right" size={16} />
				</a>
				<a class="btn" href="#contact" use:press>
					<span>Get in touch</span>
				</a>

				{#if socialLinks.length}
					<span class="hero-actions-sep" aria-hidden="true"></span>
					<div class="hero-social">
						{#each socialLinks as link}
							<a
								class="social"
								href={link.url}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={link.platform}
								title={link.platform}
								use:press={{ scale: 0.9 }}
							>
								<Icon name={SOCIAL_ICONS[link.platform?.toLowerCase()] ?? 'link'} size={17} />
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>

	</div>

	<a
		class="scroll-cue t-label no-print"
		href="#practice"
		on:click|preventDefault={() => document.getElementById('practice')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
	>
		<Icon name="scroll" size={16} />
		<span>Scroll</span>
	</a>
</section>

<style>
	.hero {
		position: relative;
		display: flex;
		align-items: center;
		min-height: 100svh;
		padding-top: 7rem;
		padding-bottom: 5rem;
	}

	/* One column now: the character has his own, so the hero is pure copy. */
	.hero-inner {
		display: block;
		width: 100%;
	}

	@media (max-width: 60rem) {
		.hero-inner {
			grid-template-columns: minmax(0, 1fr);
			gap: 2.5rem;
		}
		.hero-stage {
			order: -1;
			max-width: 17rem;
		}
	}

	/* ─── Entrance ───────────────────────────────────────────────────────────
	   The hero is the one place with a scripted entrance, because nothing can
	   interrupt a page's first paint. Everything else responds to input. */
	/* No clip-reveal here any more. Masking each word with overflow:hidden
	   worked at the old size, but this headline sets at up to 7rem with
	   leading below 1, so the mask cropped ascenders and descenders. A
	   fade-and-rise needs no mask and cannot clip. */
	.line {
		display: inline-block;
	}
	/* Visible by default, and the reveal only ever ADDS motion.
	   The previous version defaulted to opacity:0 and relied on a class
	   arriving to undo it — so when the reveal didn't fire, most of the
	   headline simply wasn't there. A hero sentence must never depend on an
	   animation succeeding in order to be readable. */
	.line-in {
		display: inline-block;
		opacity: 1;
		transform: none;
	}
	.hero-anim .line-in {
		opacity: 0;
		transform: translateY(0.22em);
		transition: opacity 620ms var(--ease-out), transform 820ms var(--ease-out);
	}
	.hero-anim .line-in.in {
		opacity: 1;
		transform: translateY(0);
	}
	.line-in.in {
		opacity: 1;
		transform: translateY(0);
	}

	.hero-anim .hero-status,
	.hero-anim .hero-tagline,
	.hero-anim .hero-meta,
	.hero-anim .hero-actions,
	.hero-anim .hero-stage {
		opacity: 0;
		transform: translateY(10px);
		transition: opacity 700ms var(--ease-out), transform 700ms var(--ease-out);
	}
	.hero-status.in,
	.hero-tagline.in,
	.hero-meta.in,
	.hero-actions.in,
	.hero-stage.in {
		opacity: 1;
		transform: none;
	}
	.hero-status {
		transition-delay: 40ms;
	}
	.hero-tagline {
		transition-delay: 320ms;
	}
	.hero-meta {
		transition-delay: 400ms;
	}
	.hero-actions {
		transition-delay: 470ms;
	}
	.hero-stage {
		transition-delay: 240ms;
	}

	@media (prefers-reduced-motion: reduce) {
		.line-in,
		.hero-status,
		.hero-tagline,
		.hero-meta,
		.hero-actions,
		.hero-stage {
			transform: none !important;
			transition: opacity 300ms linear;
		}
	}

	/* ─── Copy ─────────────────────────────────────────────────────────────── */
	.hero-status {
		margin-bottom: 1.5rem;
	}

	.hero-line {
		margin-bottom: 1.5rem;
	}

	.hero-tagline {
		margin-bottom: 1.75rem;
	}

	.hero-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin-bottom: 2rem;
	}
	.hero-meta-item {
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
		color: var(--text-3);
		text-decoration: none;
	}

	.hero-actions {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.625rem;
	}
	.hero-actions-sep {
		width: 1px;
		height: 1.5rem;
		background: var(--hairline);
		margin-inline: 0.375rem;
	}
	@media (max-width: 34rem) {
		.hero-actions-sep {
			display: none;
		}
	}

	.hero-social {
		display: flex;
		gap: 0.25rem;
	}
	.social {
		display: grid;
		place-items: center;
		width: 2.375rem;
		height: 2.375rem;
		border-radius: var(--r-full);
		border: 0.5px solid var(--border);
		background: var(--bg-raised);
		color: var(--text-2);
		box-shadow: var(--e1);
		text-decoration: none;
		transition: color 200ms var(--ease-soft), border-color 200ms var(--ease-soft);
	}
	.social:hover {
		color: var(--text);
		border-color: var(--hairline-strong);
	}

	/* ─── Character stage ──────────────────────────────────────────────────── */
	.hero-stage {
		justify-self: center;
		align-self: end;
		width: 100%;
		max-width: 22rem;
		/* This reserved height IS the character's hero height. */
		height: min(62vh, 30rem);
	}

	/* ─── Scroll cue ───────────────────────────────────────────────────────── */
	.scroll-cue {
		position: absolute;
		left: 50%;
		bottom: 1.75rem;
		transform: translateX(-50%);
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
		color: var(--text-4);
		text-decoration: none;
		transition: color 200ms var(--ease-soft);
	}
	.scroll-cue:hover {
		color: var(--text-2);
	}
	@media (max-width: 60rem) {
		.scroll-cue {
			display: none;
		}
	}
</style>
