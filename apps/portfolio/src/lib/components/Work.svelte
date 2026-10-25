<script>
	/**
	 * Work — the evidence section, and the one a recruiter actually reads.
	 *
	 * Featured projects get a large two-column treatment; the rest form a
	 * dense index below. The category filter is a segmented control rather
	 * than a dropdown, because with five or fewer options the choices should
	 * be visible, not hidden behind a disclosure.
	 */
	import { reveal } from '$lib/actions/reveal.js';
	import { press, spotlight } from '$lib/motion/gestures.js';
	import { Spring, drive, SPRINGS, springConfig } from '$lib/motion/spring.js';
	import SectionHead from './SectionHead.svelte';
	import Icon from './Icon.svelte';

	export let projects = [];

	/** Featured first — the same ordering /work/[id] uses for prev/next. */
	$: ordered = [
		...projects.filter((p) => p.is_featured),
		...projects.filter((p) => !p.is_featured)
	];

	$: categories = ['All', ...new Set(projects.map((p) => p.category).filter(Boolean))];

	let filter = 'All';
	$: shown = filter === 'All' ? ordered : ordered.filter((p) => p.category === filter);

	$: featured = shown.filter((p) => p.is_featured);
	$: rest = shown.filter((p) => !p.is_featured);

	/* ─── Filter thumb ─────────────────────────────────────────────────────── */
	let track;
	/** @type {HTMLButtonElement[]} */
	let tabs = [];
	let thumb;

	const tx = new Spring(0, springConfig(SPRINGS.move.bounce, SPRINGS.move.response));
	const tw = new Spring(0, springConfig(SPRINGS.move.bounce, SPRINGS.move.response));

	const renderThumb = () => {
		if (!thumb) return;
		thumb.style.width = `${tw.value}px`;
		thumb.style.transform = `translate3d(${tx.value}px, 0, 0)`;
	};

	function placeThumb(animate = true) {
		const i = categories.indexOf(filter);
		const el = tabs[i];
		if (!el || !track) return;
		const r = track.getBoundingClientRect();
		const b = el.getBoundingClientRect();
		const left = b.left - r.left + track.scrollLeft;
		if (!animate) {
			tx.set(left);
			tw.set(b.width);
			renderThumb();
			return;
		}
		tx.setTarget(left);
		tw.setTarget(b.width);
		drive([tx, tw], renderThumb);
	}

	// Re-place whenever the selection or the option set changes.
	$: if (thumb && categories.length) placeThumb();

	function techOf(p) {
		return Array.isArray(p.technologies) ? p.technologies : [];
	}
</script>

<section id="work" class="section">
	<div class="shell">
		<SectionHead
			eyebrow="Work"
			icon="projects"
			title="Selected projects"
			note="Each one links to a full write-up — the problem, the approach and what it actually took."
			aside={categories.length > 1}
		>
			{#if categories.length > 1}
				<div bind:this={track} class="segmented filter" role="tablist" aria-label="Filter projects by category">
					<span bind:this={thumb} class="segmented-thumb" aria-hidden="true"></span>
					{#each categories as c, i}
						<button
							bind:this={tabs[i]}
							class="segment"
							role="tab"
							aria-selected={filter === c}
							on:click={() => (filter = c)}
						>
							{c}
						</button>
					{/each}
				</div>
			{/if}
		</SectionHead>

		{#if !projects.length}
			<!-- Shape-matched placeholders: the layout must not jump when the
			     database wakes and the real content lands. -->
			<div class="feature-grid">
				{#each Array(2) as _}
					<div class="card feature">
						<div class="skel feature-media"></div>
						<div class="feature-body">
							<div class="skel skel-line" style="width: 40%"></div>
							<div class="skel skel-line" style="width: 85%; height: 1.5rem"></div>
							<div class="skel skel-line" style="width: 100%"></div>
							<div class="skel skel-line" style="width: 70%"></div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<!-- Featured -->
			{#if featured.length}
				<div class="feature-grid">
					{#each featured as p, i (p.id)}
						<article class="card feature lume" use:reveal={{ delay: i * 80 }} use:spotlight>
							<a class="feature-link" href={`/work/${p.id}`} aria-labelledby={`p-${p.id}`}>
								{#if p.thumbnail_url}
									<div class="feature-media">
										<img src={p.thumbnail_url} alt="" loading="lazy" />
									</div>
								{/if}

								<div class="feature-body">
									<div class="feature-meta">
										{#if p.category}<span class="chip">{p.category}</span>{/if}
										<span class="chip chip-featured">
											<Icon name="sparkle" size={12} />
											Featured
										</span>
									</div>

									<h3 id={`p-${p.id}`} class="t-title feature-title">{p.title}</h3>

									{#if p.description}
										<p class="t-body feature-desc">{p.description}</p>
									{/if}

									{#if techOf(p).length}
										<ul class="tech">
											{#each techOf(p).slice(0, 6) as t}
												<li class="t-mono tech-item">{t}</li>
											{/each}
											{#if techOf(p).length > 6}
												<li class="t-mono tech-item tech-more">+{techOf(p).length - 6}</li>
											{/if}
										</ul>
									{/if}

									<span class="feature-cta t-small">
										<span>Read the case study</span>
										<Icon name="arrow-right" size={16} />
									</span>
								</div>
							</a>

							<!-- External links sit outside the card link: a nested anchor is
							     invalid, and these are genuinely different destinations. -->
							{#if p.demo_url || p.github_url || p.appstore_url}
								<div class="feature-links">
									{#if p.demo_url}
										<a class="btn btn-sm" href={p.demo_url} target="_blank" rel="noopener noreferrer" use:press>
											<Icon name="external" size={15} /> Live
										</a>
									{/if}
									{#if p.github_url}
										<a class="btn btn-sm" href={p.github_url} target="_blank" rel="noopener noreferrer" use:press>
											<Icon name="github" size={15} /> Code
										</a>
									{/if}
									{#if p.appstore_url}
										<a class="btn btn-sm" href={p.appstore_url} target="_blank" rel="noopener noreferrer" use:press>
											<Icon name="appstore" size={15} /> App Store
										</a>
									{/if}
								</div>
							{/if}
						</article>
					{/each}
				</div>
			{/if}

			<!-- Index -->
			{#if rest.length}
				<ul class="index" use:reveal={{ delay: 100 }}>
					{#each rest as p (p.id)}
						<li>
							<a class="row" href={`/work/${p.id}`}>
								<span class="row-main">
									<span class="t-head row-title">{p.title}</span>
									{#if p.description}
										<span class="t-small row-desc">{p.description}</span>
									{/if}
								</span>

								<span class="row-side">
									{#if techOf(p).length}
										<span class="t-mono row-tech">{techOf(p).slice(0, 3).join(' · ')}</span>
									{/if}
									{#if p.category}<span class="chip chip-sm">{p.category}</span>{/if}
									<span class="row-arrow" aria-hidden="true">
										<Icon name="arrow-right" size={16} />
									</span>
								</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}

			{#if !shown.length}
				<p class="t-body empty">Nothing in this category yet.</p>
			{/if}
		{/if}
	</div>
</section>

<style>
	.filter {
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
	}
	.filter::-webkit-scrollbar {
		display: none;
	}

	/* ─── Featured ─────────────────────────────────────────────────────────── */
	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
		gap: 1.25rem;
	}

	.feature {
		display: flex;
		flex-direction: column;
		border-radius: var(--r-xl);
	}

	.feature-link {
		display: flex;
		flex-direction: column;
		flex: 1;
		text-decoration: none;
		color: inherit;
	}

	.feature-media {
		aspect-ratio: 16 / 10;
		overflow: hidden;
		background: var(--bg-sunk);
		border-bottom: 0.5px solid var(--border);
	}
	.feature-media img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 700ms var(--ease-out);
	}
	.feature:hover .feature-media img {
		transform: scale(1.03);
	}

	.feature-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.375rem;
		flex: 1;
	}

	.feature-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}
	.chip-featured {
		color: var(--accent-text);
		border-color: color-mix(in srgb, var(--accent) 35%, transparent);
		background: var(--accent-soft);
	}

	.feature-desc {
		flex: 1;
		max-width: none;
	}

	.tech {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.75rem;
	}
	.tech-item {
		color: var(--text-4);
		font-size: 0.75rem;
	}
	.tech-more {
		color: var(--text-4);
		opacity: 0.7;
	}

	.feature-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
		margin-top: 0.25rem;
		color: var(--text);
		font-weight: 540;
	}
	.feature-cta :global(svg) {
		transition: transform 320ms var(--ease-out);
	}
	.feature:hover .feature-cta :global(svg) {
		transform: translateX(4px);
	}

	.feature-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0 1.375rem 1.375rem;
	}

	.skel-line {
		height: 0.875rem;
		margin-bottom: 0.5rem;
	}

	/* ─── Index rows ───────────────────────────────────────────────────────── */
	.index {
		list-style: none;
		margin: 2rem 0 0;
		padding: 0;
		border-top: 1px solid var(--hairline);
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
		padding: 1.125rem 0.75rem;
		border-bottom: 1px solid var(--hairline);
		border-radius: var(--r-md);
		text-decoration: none;
		color: inherit;
		transition: background-color 240ms var(--ease-soft);
	}
	.row:hover {
		background: var(--bg-sunk);
	}

	.row-main {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 0;
	}
	.row-title {
		color: var(--text);
	}
	.row-desc {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 46ch;
	}

	.row-side {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-shrink: 0;
	}
	.row-tech {
		color: var(--text-4);
	}
	.chip-sm {
		padding: 0.1875rem 0.5rem;
		font-size: 0.75rem;
	}
	.row-arrow {
		color: var(--text-4);
		transition: transform 320ms var(--ease-out), color 200ms var(--ease-soft);
	}
	.row:hover .row-arrow {
		transform: translateX(3px);
		color: var(--text);
	}

	@media (max-width: 48rem) {
		.row-desc,
		.row-tech {
			display: none;
		}
	}

	.empty {
		padding: 2rem 0;
		color: var(--text-3);
	}
</style>
