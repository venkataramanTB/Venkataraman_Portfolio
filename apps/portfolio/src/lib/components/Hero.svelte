<script>
	/**
	 * Opening statement.
	 *
	 * Leads with the name at the largest optical size on the site, then the
	 * one sentence that says what he does, then evidence. No decorative
	 * full-viewport animation: a hero that moves on its own competes with the
	 * reader for attention and is the first thing that reads as templated.
	 *
	 * The portrait tilts with the pointer on a spring — a small, continuous
	 * response to a real input, which is the kind of motion that earns its
	 * place. It is skipped entirely on coarse pointers and under reduced
	 * motion.
	 */
	import { onMount } from 'svelte';
	import { Spring, drive, SPRINGS, springConfig, prefersReducedMotion } from '$lib/motion/spring.js';
	import { press, spotlight } from '$lib/motion/gestures.js';
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
	$: avatar = profile?.avatar_url || '/profile_picture.png';

	/* ─── Name, split for a staggered line reveal ───────────────────────────
	   Split on words rather than characters: per-character reveals on a name
	   read as an effect, per-word reads as typesetting. */
	$: words = name.trim().split(/\s+/);

	let revealed = false;
	onMount(() => {
		// One frame, so the initial state paints before the transition starts.
		requestAnimationFrame(() => (revealed = true));
	});

	/* ─── Portrait tilt ─────────────────────────────────────────────────────── */
	let portrait;
	const rx = new Spring(0, springConfig(SPRINGS.move.bounce, 0.5));
	const ry = new Spring(0, springConfig(SPRINGS.move.bounce, 0.5));

	const renderTilt = () => {
		if (!portrait) return;
		portrait.style.transform = `perspective(900px) rotateX(${rx.value}deg) rotateY(${ry.value}deg)`;
	};

	let fine = false;
	onMount(() => {
		fine =
			window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
			!prefersReducedMotion();
	});

	function onPointerMove(e) {
		if (!fine || !portrait) return;
		const r = portrait.getBoundingClientRect();
		// ±4°. Any more and it stops reading as a sheet of glass catching the
		// light and starts reading as a toy.
		ry.setTarget(((e.clientX - r.left) / r.width - 0.5) * 8);
		rx.setTarget(-((e.clientY - r.top) / r.height - 0.5) * 8);
		drive([rx, ry], renderTilt);
	}

	function onPointerLeave() {
		if (!fine) return;
		rx.setTarget(0);
		ry.setTarget(0);
		drive([rx, ry], renderTilt);
	}
</script>

<section id="top" class="hero">
	<div class="shell hero-inner">
		<div class="hero-copy">
			{#if openToWork}
				<p class="chip chip-live hero-status" class:in={revealed}>
					<span class="chip-dot" aria-hidden="true"></span>
					<span>Open to new roles</span>
				</p>
			{/if}

			<h1 class="t-hero hero-name">
				{#each words as word, i}
					<span class="line">
						<span class="line-in" class:in={revealed} style={`transition-delay:${90 + i * 70}ms`}>
							{word}
						</span>
					</span>{' '}
				{/each}
			</h1>

			<p class="t-lead hero-tagline" class:in={revealed}>{tagline}</p>

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

		<!-- Portrait -->
		<!-- role="presentation": this wrapper only exists to host the tilt
		     pointer handlers; the figure inside carries the real content. -->
		<div
			class="hero-portrait"
			role="presentation"
			class:in={revealed}
			on:pointermove={onPointerMove}
			on:pointerleave={onPointerLeave}
		>
			<div bind:this={portrait} class="portrait-tilt">
				<figure class="portrait card lume" use:spotlight>
					<img src={avatar} alt={name} width="520" height="620" loading="eager" fetchpriority="high" />
				</figure>
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

	.hero-inner {
		display: grid;
		grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.85fr);
		gap: clamp(2rem, 6vw, 5rem);
		align-items: center;
		width: 100%;
	}

	@media (max-width: 60rem) {
		.hero-inner {
			grid-template-columns: minmax(0, 1fr);
			gap: 2.5rem;
		}
		.hero-portrait {
			order: -1;
			max-width: 17rem;
		}
	}

	/* ─── Entrance ───────────────────────────────────────────────────────────
	   The hero is the one place with a scripted entrance, because nothing can
	   interrupt a page's first paint. Everything else responds to input. */
	.line {
		display: inline-block;
		overflow: hidden;
		/* The slack stops `overflow: hidden` shaving the right side bearing of
		   a heavy glyph while it masks the vertical slide. */
		padding-right: 0.08em;
		margin-right: -0.08em;
		vertical-align: bottom;
	}
	.line-in {
		display: inline-block;
		transform: translateY(100%);
		transition: transform 900ms var(--ease-out);
	}
	.line-in.in {
		transform: translateY(0);
	}

	.hero-status,
	.hero-tagline,
	.hero-meta,
	.hero-actions,
	.hero-portrait {
		opacity: 0;
		transform: translateY(10px);
		transition: opacity 700ms var(--ease-out), transform 700ms var(--ease-out);
	}
	.hero-status.in,
	.hero-tagline.in,
	.hero-meta.in,
	.hero-actions.in,
	.hero-portrait.in {
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
	.hero-portrait {
		transition-delay: 240ms;
	}

	@media (prefers-reduced-motion: reduce) {
		.line-in,
		.hero-status,
		.hero-tagline,
		.hero-meta,
		.hero-actions,
		.hero-portrait {
			transform: none !important;
			transition: opacity 300ms linear;
		}
	}

	/* ─── Copy ─────────────────────────────────────────────────────────────── */
	.hero-status {
		margin-bottom: 1.5rem;
	}

	.hero-name {
		margin-bottom: 1.25rem;
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

	/* ─── Portrait ─────────────────────────────────────────────────────────── */
	.hero-portrait {
		justify-self: center;
		width: 100%;
		max-width: 22rem;
	}
	.portrait-tilt {
		will-change: transform;
		transform-style: preserve-3d;
	}
	.portrait {
		margin: 0;
		border-radius: var(--r-xl);
		box-shadow: var(--e3), var(--e-ring);
		aspect-ratio: 4 / 5;
	}
	.portrait img {
		width: 100%;
		height: 100%;
		object-fit: cover;
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
