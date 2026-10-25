<script>
	/**
	 * Floating translucent chrome.
	 *
	 * Content scrolls *underneath* this, which is why it is a detached pill
	 * rather than a full-width opaque bar: an opaque bar permanently spends a
	 * strip of the viewport and severs the page at a hard line. The glass keeps
	 * the page continuous while still reading as a separate functional layer.
	 *
	 * The active-section indicator is spring-driven and shares the same thumb
	 * mechanics as the theme control, so the two read as one system.
	 */
	import { onMount, onDestroy } from 'svelte';
	import { Spring, drive, SPRINGS, springConfig, prefersReducedMotion } from '$lib/motion/spring.js';
	import { press } from '$lib/motion/gestures.js';
	import Icon from './Icon.svelte';
	import ThemeSwitch from './ThemeSwitch.svelte';

	export let socialLinks = [];
	export let resumeUrl = '';

	/** Labels name their contents — "Practice", "Stack" — not vague umbrellas. */
	const SECTIONS = [
		{ id: 'practice', label: 'Practice' },
		{ id: 'work', label: 'Work' },
		{ id: 'experience', label: 'Experience' },
		{ id: 'stack', label: 'Stack' },
		{ id: 'credentials', label: 'Credentials' },
		{ id: 'contact', label: 'Contact' }
	];

	const SOCIAL_ICONS = {
		github: 'github',
		linkedin: 'linkedin',
		twitter: 'x',
		x: 'x',
		email: 'mail',
		mail: 'mail',
		website: 'site'
	};

	let active = '';
	let lifted = false;
	let menuOpen = false;

	let rail;
	/** @type {HTMLAnchorElement[]} */
	let links = [];
	let marker;

	const mx = new Spring(0, springConfig(SPRINGS.move.bounce, SPRINGS.move.response));
	const mw = new Spring(0, springConfig(SPRINGS.move.bounce, SPRINGS.move.response));

	const renderMarker = () => {
		if (!marker) return;
		marker.style.width = `${mw.value}px`;
		marker.style.transform = `translate3d(${mx.value}px, 0, 0)`;
		marker.style.opacity = mw.value > 1 ? '1' : '0';
	};

	function placeMarker(id, animate = true) {
		const i = SECTIONS.findIndex((s) => s.id === id);
		const el = links[i];
		if (!rail) return;

		if (!el) {
			// Nothing active (we're in the hero): collapse the marker rather
			// than parking it on an arbitrary item.
			mw.setTarget(0);
			drive([mx, mw], renderMarker);
			return;
		}

		const r = rail.getBoundingClientRect();
		const b = el.getBoundingClientRect();
		const left = b.left - r.left + rail.scrollLeft;

		if (!animate) {
			mx.set(left);
			mw.set(b.width);
			renderMarker();
			return;
		}
		mx.setTarget(left);
		mw.setTarget(b.width);
		drive([mx, mw], renderMarker);
	}

	let io;
	let ro;

	onMount(() => {
		// Lift the chrome once the page has moved: at rest it sits flat against
		// the hero, so the first impression isn't a floating widget.
		const onScroll = () => {
			lifted = window.scrollY > 24;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });

		// Section tracking. A tall rootMargin band means the heading that is
		// actually being read wins, not whichever section happens to clip the
		// very top of the viewport.
		io = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((e) => e.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
				if (visible[0]) active = visible[0].target.id;
				else if (window.scrollY < 200) active = '';
			},
			{ rootMargin: '-45% 0px -45% 0px', threshold: 0 }
		);

		for (const s of SECTIONS) {
			const el = document.getElementById(s.id);
			if (el) io.observe(el);
		}

		ro = new ResizeObserver(() => placeMarker(active, false));
		ro.observe(rail);

		return () => window.removeEventListener('scroll', onScroll);
	});

	onDestroy(() => {
		io?.disconnect();
		ro?.disconnect();
	});

	$: placeMarker(active);

	/**
	 * Interruptible scroll. `scroll-behavior: smooth` cannot be cancelled —
	 * a reader who flicks the wheel mid-journey gets fought by the browser all
	 * the way to the target. This yields the instant the reader takes over.
	 */
	function scrollTo(e, id) {
		const el = document.getElementById(id);
		if (!el) return;
		e.preventDefault();
		menuOpen = false;

		const top = el.getBoundingClientRect().top + window.scrollY - 88;

		if (prefersReducedMotion()) {
			window.scrollTo(0, top);
			history.replaceState(null, '', `#${id}`);
			return;
		}

		const s = new Spring(window.scrollY, { bounce: 0, response: 0.62 });
		s.setTarget(top);

		let cancelled = false;
		const giveUp = () => {
			cancelled = true;
		};
		// Any manual input hands control straight back to the reader.
		window.addEventListener('wheel', giveUp, { once: true, passive: true });
		window.addEventListener('touchstart', giveUp, { once: true, passive: true });
		window.addEventListener('keydown', giveUp, { once: true });

		const stop = drive(
			[s],
			() => {
				if (cancelled) {
					stop();
					return;
				}
				window.scrollTo(0, s.value);
			},
			() => {
				window.removeEventListener('wheel', giveUp);
				window.removeEventListener('touchstart', giveUp);
				window.removeEventListener('keydown', giveUp);
				if (!cancelled) history.replaceState(null, '', `#${id}`);
			}
		);
	}

	function onKeydown(e) {
		if (e.key === 'Escape' && menuOpen) menuOpen = false;
	}
</script>

<svelte:window on:keydown={onKeydown} />

<header class="nav-wrap no-print" class:lifted>
	<nav class="nav material" aria-label="Sections">
		<a
			href="#top"
			class="mark"
			aria-label="Back to top"
			on:click={(e) => {
				e.preventDefault();
				window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
			}}
			use:press={{ scale: 0.92 }}
		>
			<span class="mark-glyph">V</span>
		</a>

		<span class="nav-sep" aria-hidden="true"></span>

		<!-- Desktop rail -->
		<div bind:this={rail} class="rail">
			<span bind:this={marker} class="marker" aria-hidden="true"></span>
			{#each SECTIONS as s, i}
				<a
					bind:this={links[i]}
					href={`#${s.id}`}
					class="rail-link on-material"
					class:is-active={active === s.id}
					aria-current={active === s.id ? 'true' : undefined}
					on:click={(e) => scrollTo(e, s.id)}
				>
					{s.label}
				</a>
			{/each}
		</div>

		<span class="nav-sep nav-sep-end" aria-hidden="true"></span>

		<div class="nav-end">
			{#if resumeUrl}
				<a
					class="btn btn-sm btn-primary nav-cta"
					href={resumeUrl}
					target="_blank"
					rel="noopener noreferrer"
					use:press
				>
					<Icon name="download" size={15} />
					<span>Résumé</span>
				</a>
			{/if}

			<button
				class="icon-btn menu-btn"
				aria-expanded={menuOpen}
				aria-controls="nav-sheet"
				on:click={() => (menuOpen = !menuOpen)}
				use:press={{ scale: 0.9 }}
			>
				<Icon name={menuOpen ? 'close' : 'menu'} size={18} label={menuOpen ? 'Close menu' : 'Open menu'} />
			</button>
		</div>
	</nav>
</header>

<!-- Mobile navigation.
     It enters and leaves along the same path it came from, anchored to the
     chrome above it, because something that drops down must go back up. -->
{#if menuOpen}
	<button class="sheet-scrim" on:click={() => (menuOpen = false)} aria-label="Close menu"></button>
	<div id="nav-sheet" class="nav-sheet material-thick" role="dialog" aria-modal="true" aria-label="Menu">
		<ul class="sheet-list">
			{#each SECTIONS as s}
				<li>
					<a
						href={`#${s.id}`}
						class="sheet-link on-material"
						class:is-active={active === s.id}
						on:click={(e) => scrollTo(e, s.id)}
					>
						<span>{s.label}</span>
						<Icon name="chevron-right" size={16} />
					</a>
				</li>
			{/each}
		</ul>

		<div class="sheet-foot">
			<ThemeSwitch />
			<div class="sheet-social">
				{#each socialLinks as link}
					<a
						class="icon-btn"
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						aria-label={link.platform}
						use:press={{ scale: 0.9 }}
					>
						<Icon name={SOCIAL_ICONS[link.platform?.toLowerCase()] ?? 'link'} size={17} />
					</a>
				{/each}
			</div>
		</div>
	</div>
{/if}

<style>
	.nav-wrap {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: var(--z-nav);
		display: flex;
		justify-content: center;
		padding: 0.75rem var(--gutter);
		padding-top: max(0.75rem, env(safe-area-inset-top));
		pointer-events: none;
	}

	.nav {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 0.3125rem;
		padding: 0.375rem;
		border-radius: var(--r-full);
		max-width: 100%;
		/* At rest the chrome is flat and borderless against the hero; it
		   materialises into glass only once there is content behind it to
		   separate from. */
		transition: box-shadow 420ms var(--ease-soft), background-color 420ms var(--ease-soft),
			border-color 420ms var(--ease-soft), transform 420ms var(--ease-out);
	}
	.nav-wrap:not(.lifted) .nav {
		background: transparent;
		-webkit-backdrop-filter: none;
		backdrop-filter: none;
		box-shadow: none;
		border-color: transparent;
	}

	/* ─── Mark ─────────────────────────────────────────────────────────────── */
	.mark {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--r-full);
		background: var(--fill);
		color: var(--fill-text);
		text-decoration: none;
		flex-shrink: 0;
	}
	.mark-glyph {
		font-size: 0.9375rem;
		font-weight: 680;
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.nav-sep {
		width: 1px;
		height: 1.25rem;
		background: var(--hairline);
		flex-shrink: 0;
	}
	.nav-wrap:not(.lifted) .nav-sep {
		opacity: 0;
	}

	/* ─── Rail ─────────────────────────────────────────────────────────────── */
	.rail {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.125rem;
		padding: 0 0.125rem;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.rail::-webkit-scrollbar {
		display: none;
	}

	.marker {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		border-radius: var(--r-full);
		background: var(--bg-sunk);
		opacity: 0;
		will-change: transform, width;
		pointer-events: none;
	}

	.rail-link {
		position: relative;
		z-index: 1;
		padding: 0.4375rem 0.75rem;
		border-radius: var(--r-full);
		font-size: 0.875rem;
		color: var(--text-3);
		text-decoration: none;
		white-space: nowrap;
		transition: color 220ms var(--ease-soft);
	}
	.rail-link:hover {
		color: var(--text);
	}
	.rail-link.is-active {
		color: var(--text);
	}

	@media (max-width: 62rem) {
		.rail,
		.nav-sep-end {
			display: none;
		}
	}

	/* ─── End cluster ──────────────────────────────────────────────────────── */
	.nav-end {
		display: flex;
		align-items: center;
		gap: 0.3125rem;
		flex-shrink: 0;
	}

	.icon-btn {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border: 0;
		border-radius: var(--r-full);
		background: transparent;
		color: var(--text-2);
		cursor: pointer;
		text-decoration: none;
		transition: background-color 200ms var(--ease-soft), color 200ms var(--ease-soft);
		-webkit-tap-highlight-color: transparent;
	}
	.icon-btn:hover {
		background: var(--bg-sunk);
		color: var(--text);
	}

	.menu-btn {
		display: none;
	}
	@media (max-width: 62rem) {
		.menu-btn {
			display: grid;
		}
	}

	@media (max-width: 26rem) {
		.nav-cta span {
			display: none;
		}
		.nav-cta {
			padding-inline: 0.625rem;
		}
	}

	/* ─── Mobile sheet ─────────────────────────────────────────────────────── */
	.sheet-scrim {
		appearance: none;
		border: 0;
		padding: 0;
		position: fixed;
		inset: 0;
		z-index: var(--z-overlay);
		background: var(--scrim);
		-webkit-backdrop-filter: blur(2px);
		backdrop-filter: blur(2px);
		animation: scrim-in 240ms var(--ease-soft);
	}
	@keyframes scrim-in {
		from {
			opacity: 0;
		}
	}

	.nav-sheet {
		position: fixed;
		z-index: var(--z-sheet);
		top: calc(3.75rem + env(safe-area-inset-top));
		left: var(--gutter);
		right: var(--gutter);
		max-width: 26rem;
		margin-inline: auto;
		padding: 0.5rem;
		border-radius: var(--r-xl);
		/* Anchored to the chrome it came from, and scaled rather than slid, so
		   the panel reads as having grown out of the button that opened it. */
		transform-origin: top right;
		/* Blur and scale animate together: the surface arrives as a material,
		   not as a rectangle fading up. */
		animation: sheet-in 300ms var(--ease-out);
	}
	@keyframes sheet-in {
		from {
			opacity: 0;
			transform: scale(0.94) translateY(-8px);
			-webkit-backdrop-filter: blur(0px);
			backdrop-filter: blur(0px);
		}
	}

	.sheet-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.sheet-link {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.8125rem 0.875rem;
		border-radius: var(--r-md);
		font-size: 1rem;
		text-decoration: none;
		color: var(--text-2);
	}
	.sheet-link:hover,
	.sheet-link.is-active {
		background: var(--bg-sunk);
		color: var(--text);
	}

	.sheet-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-top: 0.5rem;
		padding: 0.75rem 0.5rem 0.375rem;
		border-top: 1px solid var(--hairline);
	}
	.sheet-social {
		display: flex;
		gap: 0.125rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-sheet {
			animation: none;
		}
		.sheet-scrim {
			animation: none;
		}
	}
</style>
