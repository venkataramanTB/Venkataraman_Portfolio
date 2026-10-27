<script>
	/**
	 * Footer. Wayfinding, not decoration: it answers "where else can I go"
	 * and "how do I get out of here" for a reader who reached the bottom.
	 */
	import { press } from '$lib/motion/gestures.js';
	import { prefersReducedMotion } from '$lib/motion/spring.js';
	import ThemeSwitch from './ThemeSwitch.svelte';
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

	const SECTIONS = [
		{ id: 'practice', label: 'Practice' },
		{ id: 'work', label: 'Work' },
		{ id: 'experience', label: 'Experience' },
		{ id: 'stack', label: 'Stack' },
		{ id: 'credentials', label: 'Credentials' },
		{ id: 'contact', label: 'Contact' }
	];

	const year = new Date().getFullYear();

	$: name = profile?.name ?? 'Venkataraman TB';

	function toTop() {
		window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
	}
</script>

<footer class="footer">
	<div class="shell">
		<div class="top">
			<div class="brand">
				<p class="t-title brand-name">{name}</p>
				{#if profile?.tagline}
					<p class="t-small brand-tag">{profile.tagline}</p>
				{/if}

				{#if socialLinks.length}
					<ul class="socials">
						{#each socialLinks as link}
							<li>
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
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<nav class="links" aria-label="Footer">
				<p class="t-label links-head">Sections</p>
				<ul>
					{#each SECTIONS as s}
						<li><a class="link-quiet" href={`#${s.id}`}>{s.label}</a></li>
					{/each}
				</ul>
			</nav>

			<div class="links">
				<p class="t-label links-head">Elsewhere</p>
				<ul>
					{#if profile?.email}
						<li><a class="link-quiet" href={`mailto:${profile.email}`}>Email</a></li>
					{/if}
					{#if profile?.resume_url}
						<li>
							<a class="link-quiet" href={profile.resume_url} target="_blank" rel="noopener noreferrer">
								Résumé
							</a>
						</li>
					{/if}
					<!-- Project ids are database-assigned, so this points at the index
					     rather than guessing one. -->
					<li><a class="link-quiet" href="/#work">Case studies</a></li>
				</ul>
			</div>
		</div>

		<hr class="hairline" />

		<div class="bottom">
			<p class="t-small copy">
				© {year} {name}. Built with SvelteKit.
				<!-- Not optional. The 3D figure is CC BY, and that licence is
				     conditional on naming the author and linking the terms.
				     Shipping the model without this line is a licence breach,
				     so it stays even if the footer is ever redesigned. -->
				<span class="credit">
					3D model <a
						href="https://sketchfab.com/3d-models/akaza-from-demon-slayer-rigged-and-textured-1e7a8b0c"
						rel="noopener noreferrer nofollow"
						target="_blank">Akaza From Demon Slayer</a
					>
					by Light.k, licensed
					<a
						href="https://creativecommons.org/licenses/by/4.0/"
						rel="noopener noreferrer nofollow license"
						target="_blank">CC BY 4.0</a
					>. Demon Slayer is the property of its respective rights holders.
				</span>
			</p>

			<div class="bottom-end no-print">
				<ThemeSwitch />
				<button class="btn btn-sm" on:click={toTop} use:press>
					<Icon name="arrow-up" size={15} />
					<span>Top</span>
				</button>
			</div>
		</div>
	</div>
</footer>

<style>
	.footer {
		padding-top: clamp(3rem, 7vh, 5rem);
		padding-bottom: calc(2rem + env(safe-area-inset-bottom));
		border-top: 1px solid var(--hairline);
		background: var(--bg-sunk);
	}

	.top {
		display: grid;
		grid-template-columns: minmax(0, 1.6fr) repeat(2, minmax(0, 1fr));
		gap: 2.5rem;
		padding-bottom: 2.5rem;
	}
	@media (max-width: 48rem) {
		.top {
			grid-template-columns: minmax(0, 1fr);
			gap: 2rem;
		}
	}

	.brand-name {
		margin-bottom: 0.4375rem;
	}
	.brand-tag {
		max-width: 34ch;
		margin-bottom: 1.25rem;
	}

	.socials {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		gap: 0.375rem;
	}
	.social {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--r-full);
		border: 0.5px solid var(--border);
		background: var(--bg-raised);
		color: var(--text-2);
		text-decoration: none;
		transition: color 200ms var(--ease-soft), border-color 200ms var(--ease-soft);
	}
	.social:hover {
		color: var(--text);
		border-color: var(--hairline-strong);
	}

	.links-head {
		margin-bottom: 0.875rem;
	}
	.links ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5625rem;
	}
	.links a {
		font-size: 0.90625rem;
	}

	.credit {
		display: block;
		margin-top: 0.4rem;
		color: var(--text-4);
		max-width: 56ch;
	}
	.credit a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.credit a:hover {
		color: var(--text-2);
	}

	.bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		padding-top: 1.5rem;
	}
	.copy {
		color: var(--text-4);
	}
	.bottom-end {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}
</style>
