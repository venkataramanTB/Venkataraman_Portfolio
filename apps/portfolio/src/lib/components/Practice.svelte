<script>
	/**
	 * Practice — what he does, in four parts.
	 *
	 * This section exists because the portfolio's central claim is breadth
	 * across four disciplines, and a reader skimming for thirty seconds needs
	 * that claim to be legible before any individual project is. The counts
	 * are derived from the live database rather than written by hand, so the
	 * claim stays true as content is added.
	 */
	import { reveal } from '$lib/actions/reveal.js';
	import { spotlight } from '$lib/motion/gestures.js';
	import SectionHead from './SectionHead.svelte';
	import Icon from './Icon.svelte';

	export let profile = null;
	export let stats = [];
	export let skills = [];
	export let projects = [];

	/**
	 * Keyword routing. Every skill and project lands in at most one domain —
	 * the first match wins, so the order here is a priority order and the
	 * narrower disciplines are tested before the broad one.
	 */
	const DOMAINS = [
		{
			key: 'ai',
			icon: 'ai',
			title: 'AI Engineering',
			blurb: 'LLM agents, retrieval pipelines and the evaluation harnesses that keep them honest.',
			match: /\b(ai|llm|llms|agent|agents|rag|genai|prompt|nlp|embedding|vector|openai|anthropic|langchain)\b/i
		},
		{
			key: 'ml',
			icon: 'ml',
			title: 'Machine Learning',
			blurb: 'Training, evaluating and shipping models — plus the MLOps around them.',
			match: /\b(ml|machine learning|deep learning|pytorch|tensorflow|sklearn|scikit|keras|mlops|model|data science|pandas|numpy)\b/i
		},
		{
			key: 'ios',
			icon: 'ios',
			title: 'Native iOS',
			blurb: 'Swift and SwiftUI apps built to platform convention, not web habits.',
			match: /\b(ios|swift|swiftui|xcode|uikit|apple|objective-c|mobile|combine)\b/i
		},
		{
			key: 'web',
			icon: 'web',
			title: 'Full Stack',
			blurb: 'Interfaces, APIs and the infrastructure underneath both.',
			match: /\b(web|full.?stack|frontend|front.?end|backend|back.?end|api|react|svelte|node|next|typescript|javascript|python|fastapi|django|sql|postgres|docker|cloud|aws|devops|css|html)\b/i
		}
	];

	function classify(text) {
		if (!text) return null;
		for (const d of DOMAINS) if (d.match.test(text)) return d.key;
		return null;
	}

	/** Skills and projects attributed to each domain, counted from the data. */
	$: tally = (() => {
		const t = Object.fromEntries(DOMAINS.map((d) => [d.key, { skills: [], projects: 0 }]));

		for (const s of skills) {
			const key = classify(`${s.category ?? ''} ${s.name ?? ''}`);
			if (key) t[key].skills.push(s);
		}
		for (const p of projects) {
			const tech = Array.isArray(p.technologies) ? p.technologies.join(' ') : '';
			const key = classify(`${p.category ?? ''} ${tech} ${p.title ?? ''}`);
			if (key) t[key].projects += 1;
		}

		// Strongest skills first, so the three shown on a card are the three
		// worth showing rather than whatever happened to be entered first.
		for (const k of Object.keys(t)) {
			t[k].skills.sort((a, b) => (b.proficiency ?? 0) - (a.proficiency ?? 0));
		}
		return t;
	})();

	$: avatar = profile?.avatar_url || '/profile_picture.png';
	$: bio = profile?.bio ?? '';
	/** Lead with the first paragraph; the rest stays available but secondary. */
	$: bioParas = bio.split(/\n{2,}/).filter(Boolean);
</script>

<section id="practice" class="section">
	<div class="shell">
		<SectionHead
			eyebrow="Practice"
			icon="about"
			title="Four disciplines, one engineer"
			note="Most of the work sits where these overlap — a model is only useful once something ships around it."
		/>

		<!-- Bio and the formal portrait.
		     The photograph used to open the site; the character has that job
		     now, so it moved here, where a reader who wants to know who they
		     are actually dealing with will be looking. -->
		{#if bioParas.length || avatar}
			<div class="intro">
				{#if bioParas.length}
					<div class="bio" use:reveal={{ delay: 60 }}>
						{#each bioParas as para, i}
							<p class={i === 0 ? 't-lead' : 't-body'}>{para}</p>
						{/each}
					</div>
				{/if}

				{#if avatar}
					<figure class="portrait card lume" use:reveal={{ delay: 120 }} use:spotlight>
						<img src={avatar} alt={profile?.name ?? 'Venkataraman TB'} width="520" height="620" loading="lazy" />
					</figure>
				{/if}
			</div>
		{/if}

		<!-- Domains -->
		<ul class="domains">
			{#each DOMAINS as d, i}
				<li class="domain card lume" style={`--dot: var(--d-${d.key})`} use:reveal={{ delay: 80 + i * 70 }} use:spotlight>
					<div class="domain-top">
						<span class="domain-icon" aria-hidden="true">
							<Icon name={d.icon} size={19} />
						</span>
						<h3 class="t-head">{d.title}</h3>
					</div>

					<p class="t-small domain-blurb">{d.blurb}</p>

					{#if tally[d.key].skills.length || tally[d.key].projects}
						<p class="t-mono domain-count">
							{#if tally[d.key].skills.length}
								{tally[d.key].skills.length} skill{tally[d.key].skills.length === 1 ? '' : 's'}
							{/if}
							{#if tally[d.key].skills.length && tally[d.key].projects}
								<span class="dim"> · </span>
							{/if}
							{#if tally[d.key].projects}
								{tally[d.key].projects} project{tally[d.key].projects === 1 ? '' : 's'}
							{/if}
						</p>
					{/if}

					{#if tally[d.key].skills.length}
						<ul class="domain-skills">
							{#each tally[d.key].skills.slice(0, 4) as s}
								<li class="chip chip-sm">{s.name}</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>

		<!-- Stats -->
		{#if stats?.length}
			<dl class="stats" use:reveal={{ delay: 120 }}>
				{#each stats as stat}
					<div class="stat">
						<dt class="t-label">{stat.label}</dt>
						<dd class="stat-value">
							{stat.value}{#if stat.suffix}<span class="stat-suffix">{stat.suffix}</span>{/if}
						</dd>
					</div>
				{/each}
			</dl>
		{/if}
	</div>
</section>

<style>
	.intro {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 15rem;
		gap: clamp(1.5rem, 4vw, 3rem);
		align-items: start;
		margin-bottom: clamp(2.5rem, 6vh, 4rem);
	}
	@media (max-width: 52rem) {
		.intro {
			grid-template-columns: minmax(0, 1fr);
		}
		.portrait {
			max-width: 15rem;
		}
	}

	.bio {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.portrait {
		margin: 0;
		border-radius: var(--r-xl);
		aspect-ratio: 4 / 5;
		box-shadow: var(--e2), var(--e-ring);
	}
	.portrait img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* ─── Domains ──────────────────────────────────────────────────────────── */
	.domains {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 1rem;
	}

	.domain {
		display: flex;
		flex-direction: column;
		gap: 0.6875rem;
		padding: 1.375rem;
	}

	.domain-top {
		display: flex;
		align-items: center;
		gap: 0.6875rem;
	}

	/* The domain tint appears here and on nothing else — a small identifying
	   mark, never a surface or a gradient. */
	.domain-icon {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--r-sm);
		background: color-mix(in srgb, var(--dot) 13%, transparent);
		color: var(--dot);
		flex-shrink: 0;
	}

	.domain-blurb {
		flex: 1;
	}

	.domain-count {
		color: var(--text-4);
	}
	.dim {
		opacity: 0.5;
	}

	.domain-skills {
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

	/* ─── Stats ────────────────────────────────────────────────────────────── */
	.stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
		gap: 1px;
		margin: clamp(2.5rem, 6vh, 4rem) 0 0;
		background: var(--hairline);
		border-radius: var(--r-md);
		overflow: hidden;
		border: 0.5px solid var(--border);
	}

	.stat {
		background: var(--bg);
		padding: 1.25rem 1.375rem;
	}

	.stat-value {
		margin: 0.375rem 0 0;
		font-size: clamp(1.75rem, 3.4vw, 2.5rem);
		font-weight: 660;
		line-height: 1;
		letter-spacing: -0.03em;
		font-variant-numeric: tabular-nums;
		color: var(--text);
	}
	.stat-suffix {
		font-size: 0.5em;
		font-weight: 560;
		margin-left: 0.1em;
		color: var(--text-3);
		letter-spacing: 0;
	}
</style>
