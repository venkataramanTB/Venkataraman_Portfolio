<script>
	/**
	 * Project case study.
	 *
	 * Every screen should answer: where am I, what's here, where can I go,
	 * and how do I get out. So this page carries a real back link to the work
	 * index (not a history-dependent "back"), a position indicator, and
	 * prev/next in the same order the index used — a reader who clicked the
	 * third card should find the fourth where they expect it.
	 */
	import { reveal } from '$lib/actions/reveal.js';
	import { press, spotlight } from '$lib/motion/gestures.js';
	import { prefersReducedMotion } from '$lib/motion/spring.js';
	import Icon from '$lib/components/Icon.svelte';
	import Footer from '$lib/components/Footer.svelte';

	export let data;

	$: ({ project, index, total, prev, next, profile, socialLinks } = data);

	$: tech = Array.isArray(project?.technologies) ? project.technologies : [];
	$: paras = (project?.long_description ?? project?.description ?? '')
		.split(/\n{2,}/)
		.filter(Boolean);

	$: title = `${project?.title ?? 'Project'} — ${profile?.name ?? 'Venkataraman TB'}`;

	const LINKS = [
		{ key: 'demo_url', label: 'Live site', icon: 'external' },
		{ key: 'github_url', label: 'Source', icon: 'github' },
		{ key: 'appstore_url', label: 'App Store', icon: 'appstore' }
	];
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={project?.description ?? ''} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={project?.description ?? ''} />
	{#if project?.thumbnail_url}
		<meta property="og:image" content={project.thumbnail_url} />
	{/if}
</svelte:head>

<!-- Minimal chrome: one unambiguous way out, pinned and translucent. -->
<header class="bar no-print">
	<div class="shell bar-inner">
		<a class="back material" href="/#work" use:press>
			<Icon name="arrow-left" size={16} />
			<span>All work</span>
		</a>
		<p class="t-mono position">
			{String(index).padStart(2, '0')} / {String(total).padStart(2, '0')}
		</p>
	</div>
</header>

<main id="main" class="page">
	<article>
		<!-- Title block -->
		<header class="shell head">
			<div class="head-meta" use:reveal>
				{#if project?.category}
					<span class="chip">{project.category}</span>
				{/if}
				{#if project?.is_featured}
					<span class="chip chip-featured">
						<Icon name="sparkle" size={12} />
						Featured
					</span>
				{/if}
			</div>

			<h1 class="t-hero head-title" use:reveal={{ delay: 60 }}>{project?.title}</h1>

			{#if project?.description}
				<p class="t-lead head-sub" use:reveal={{ delay: 120 }}>{project.description}</p>
			{/if}

			{#if LINKS.some((l) => project?.[l.key])}
				<div class="head-links" use:reveal={{ delay: 170 }}>
					{#each LINKS as l}
						{#if project?.[l.key]}
							<a
								class="btn {l.key === 'demo_url' ? 'btn-primary' : ''}"
								href={project[l.key]}
								target="_blank"
								rel="noopener noreferrer"
								use:press
							>
								<Icon name={l.icon} size={16} />
								<span>{l.label}</span>
							</a>
						{/if}
					{/each}
				</div>
			{/if}
		</header>

		<!-- Hero image -->
		{#if project?.thumbnail_url}
			<figure class="shell media-wrap" use:reveal={{ delay: 100, y: 20 }}>
				<div class="media card">
					<img src={project.thumbnail_url} alt={project.title} loading="eager" />
				</div>
			</figure>
		{/if}

		<!-- Body -->
		<div class="shell body">
			<div class="prose">
				{#if paras.length}
					{#each paras as p, i}
						<p class="t-body" use:reveal={{ delay: Math.min(i, 6) * 50 }}>{p}</p>
					{/each}
				{:else}
					<p class="t-body muted">No write-up for this project yet.</p>
				{/if}
			</div>

			<aside class="side" use:reveal={{ delay: 80 }}>
				{#if tech.length}
					<section class="side-block card">
						<h2 class="t-label side-head">Built with</h2>
						<ul class="tech">
							{#each tech as t}
								<li class="chip chip-sm">{t}</li>
							{/each}
						</ul>
					</section>
				{/if}

				<section class="side-block card">
					<h2 class="t-label side-head">Details</h2>
					<dl class="facts">
						{#if project?.category}
							<div><dt>Category</dt><dd>{project.category}</dd></div>
						{/if}
						<div><dt>Position</dt><dd>{index} of {total}</dd></div>
						{#if project?.created_at}
							<div>
								<dt>Added</dt>
								<dd>{new Date(project.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</dd>
							</div>
						{/if}
					</dl>
				</section>
			</aside>
		</div>

		<!-- Prev / next -->
		{#if prev || next}
			<nav class="shell pager" aria-label="Other projects">
				{#if prev}
					<a class="pager-link card lume" href={`/work/${prev.id}`} use:spotlight use:press={{ scale: 0.99 }}>
						<span class="t-label pager-dir"><Icon name="arrow-left" size={14} /> Previous</span>
						<span class="t-head pager-title">{prev.title}</span>
					</a>
				{:else}
					<span></span>
				{/if}

				{#if next}
					<a class="pager-link pager-next card lume" href={`/work/${next.id}`} use:spotlight use:press={{ scale: 0.99 }}>
						<span class="t-label pager-dir">Next <Icon name="arrow-right" size={14} /></span>
						<span class="t-head pager-title">{next.title}</span>
					</a>
				{/if}
			</nav>
		{/if}
	</article>
</main>

<Footer {profile} socialLinks={socialLinks ?? []} />

<style>
	/* ─── Bar ──────────────────────────────────────────────────────────────── */
	.bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: var(--z-nav);
		padding: 0.75rem 0;
		padding-top: max(0.75rem, env(safe-area-inset-top));
		pointer-events: none;
	}
	.bar-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.back {
		pointer-events: auto;
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
		padding: 0.5rem 0.875rem;
		border-radius: var(--r-full);
		color: var(--text);
		font-size: 0.875rem;
		font-weight: 540;
		text-decoration: none;
	}
	.position {
		pointer-events: auto;
		color: var(--text-4);
	}

	/* ─── Head ─────────────────────────────────────────────────────────────── */
	.page {
		padding-top: 7rem;
		padding-bottom: 4rem;
	}

	.head {
		max-width: 56rem;
	}
	.head-meta {
		display: flex;
		gap: 0.375rem;
		margin-bottom: 1.25rem;
	}
	.chip-featured {
		color: var(--accent-text);
		border-color: color-mix(in srgb, var(--accent) 35%, transparent);
		background: var(--accent-soft);
	}
	.head-title {
		margin-bottom: 1.25rem;
	}
	.head-sub {
		max-width: 46rem;
		margin-bottom: 1.75rem;
	}
	.head-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	/* ─── Media ────────────────────────────────────────────────────────────── */
	.media-wrap {
		margin: clamp(2.5rem, 6vh, 4rem) auto 0;
	}
	.media {
		border-radius: var(--r-xl);
		box-shadow: var(--e3), var(--e-ring);
	}
	.media img {
		width: 100%;
		height: auto;
	}

	/* ─── Body ─────────────────────────────────────────────────────────────── */
	.body {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 17rem;
		gap: clamp(2rem, 5vw, 4rem);
		align-items: start;
		margin-top: clamp(2.5rem, 7vh, 4.5rem);
	}
	@media (max-width: 54rem) {
		.body {
			grid-template-columns: minmax(0, 1fr);
			gap: 2rem;
		}
	}

	.prose {
		display: flex;
		flex-direction: column;
		gap: 1.125rem;
	}
	.prose :global(.t-body) {
		font-size: 1.0625rem;
		line-height: 1.7;
		max-width: 66ch;
	}
	.muted {
		color: var(--text-4);
	}

	.side {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		position: sticky;
		top: 5.5rem;
	}
	@media (max-width: 54rem) {
		.side {
			position: static;
		}
	}

	.side-block {
		padding: 1.125rem 1.25rem;
	}
	.side-head {
		margin-bottom: 0.875rem;
	}
	.tech {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.3125rem;
	}
	.chip-sm {
		padding: 0.1875rem 0.5rem;
		font-size: 0.75rem;
	}

	.facts {
		margin: 0;
		display: flex;
		flex-direction: column;
	}
	.facts > div {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.5rem 0;
	}
	.facts > div + div {
		border-top: 1px solid var(--hairline);
	}
	.facts dt {
		font-size: 0.8125rem;
		color: var(--text-4);
	}
	.facts dd {
		margin: 0;
		font-size: 0.875rem;
		color: var(--text-2);
		text-align: right;
	}

	/* ─── Pager ────────────────────────────────────────────────────────────── */
	.pager {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-top: clamp(3rem, 8vh, 5rem);
	}
	@media (max-width: 40rem) {
		.pager {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	.pager-link {
		display: flex;
		flex-direction: column;
		gap: 0.4375rem;
		padding: 1.25rem 1.375rem;
		text-decoration: none;
		color: inherit;
	}
	.pager-next {
		align-items: flex-end;
		text-align: right;
	}
	.pager-dir {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
	}
	.pager-title {
		color: var(--text);
	}
</style>
