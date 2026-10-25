<script>
	/**
	 * Experience — roles and education on one spine.
	 *
	 * A single vertical rail rather than two separate lists: a reader wants
	 * one chronology, and splitting it forces them to reconcile two timelines
	 * themselves. Education is marked, not segregated.
	 */
	import { reveal } from '$lib/actions/reveal.js';
	import SectionHead from './SectionHead.svelte';
	import Icon from './Icon.svelte';

	export let experiences = [];
	export let education = [];

	/** Dates arrive as free-text strings, so formatting is defensive. */
	function period(start, end, current) {
		const a = (start ?? '').trim();
		const b = current ? 'Present' : (end ?? '').trim();
		if (a && b) return `${a} — ${b}`;
		return a || b || '';
	}

	$: items = [
		...experiences.map((e) => ({
			kind: 'role',
			id: `x-${e.id}`,
			title: e.role,
			org: e.company,
			logo: e.company_logo_url,
			period: period(e.start_date, e.end_date, e.is_current),
			current: e.is_current,
			location: e.location,
			description: e.description,
			tech: Array.isArray(e.technologies) ? e.technologies : [],
			order: e.display_order ?? 0
		})),
		...education.map((e) => ({
			kind: 'education',
			id: `e-${e.id}`,
			title: e.degree + (e.field ? `, ${e.field}` : ''),
			org: e.institution,
			logo: e.logo_url,
			period: period(e.start_date, e.end_date, false),
			current: false,
			location: e.gpa ? `GPA ${e.gpa}` : '',
			description: e.description,
			tech: [],
			order: 1000 + (e.display_order ?? 0)
		}))
	].sort((a, b) => a.order - b.order);
</script>

<section id="experience" class="section">
	<div class="shell">
		<SectionHead
			eyebrow="Experience"
			icon="work"
			title="Where the work happened"
			note="Roles and study, in one chronology."
		/>

		{#if !items.length}
			<ul class="rail">
				{#each Array(3) as _}
					<li class="item">
						<span class="node" aria-hidden="true"></span>
						<div class="item-body">
							<div class="skel skel-line" style="width: 30%"></div>
							<div class="skel skel-line" style="width: 55%; height: 1.25rem"></div>
							<div class="skel skel-line" style="width: 90%"></div>
						</div>
					</li>
				{/each}
			</ul>
		{:else}
			<ul class="rail">
				{#each items as item, i (item.id)}
					<li class="item" use:reveal={{ delay: Math.min(i, 6) * 60 }}>
						<!-- The node marks position on the spine. A current role is
						     filled; everything past is hollow. -->
						<span class="node" class:node-current={item.current} aria-hidden="true">
							{#if item.kind === 'education'}
								<Icon name="education" size={12} />
							{/if}
						</span>

						<div class="item-body">
							<div class="item-head">
								<p class="t-mono item-period">
									{item.period}
									{#if item.current}
										<span class="chip chip-live chip-now">
											<span class="chip-dot" aria-hidden="true"></span>
											Now
										</span>
									{/if}
								</p>

								<h3 class="t-head item-title">{item.title}</h3>

								<p class="item-org">
									{#if item.logo}
										<img class="logo" src={item.logo} alt="" width="20" height="20" loading="lazy" />
									{/if}
									<span>{item.org}</span>
									{#if item.location}
										<span class="item-loc">· {item.location}</span>
									{/if}
								</p>
							</div>

							{#if item.description}
								<p class="t-body item-desc">{item.description}</p>
							{/if}

							{#if item.tech.length}
								<ul class="tech">
									{#each item.tech as t}
										<li class="chip chip-sm">{t}</li>
									{/each}
								</ul>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.rail {
		list-style: none;
		margin: 0;
		padding: 0;
		position: relative;
	}

	.item {
		position: relative;
		display: grid;
		grid-template-columns: 1.25rem minmax(0, 1fr);
		gap: 1.25rem;
		padding-bottom: 2.25rem;
	}

	/* The spine is drawn per-item rather than as one absolute line, so the
	   last entry can stop it cleanly instead of trailing into whitespace. */
	.item::before {
		content: '';
		position: absolute;
		left: 0.5625rem;
		top: 1.5rem;
		bottom: 0;
		width: 1px;
		background: var(--hairline);
	}
	.item:last-child {
		padding-bottom: 0;
	}
	.item:last-child::before {
		display: none;
	}

	.node {
		display: grid;
		place-items: center;
		width: 1.25rem;
		height: 1.25rem;
		margin-top: 0.3125rem;
		border-radius: var(--r-full);
		border: 1.5px solid var(--hairline-strong);
		background: var(--bg);
		color: var(--text-3);
		flex-shrink: 0;
		z-index: 1;
	}
	.node-current {
		border-color: var(--live);
		background: var(--live);
		box-shadow: 0 0 0 4px color-mix(in srgb, var(--live) 18%, transparent);
	}

	.item-body {
		display: flex;
		flex-direction: column;
		gap: 0.6875rem;
		min-width: 0;
	}

	.item-head {
		display: flex;
		flex-direction: column;
		gap: 0.3125rem;
	}

	.item-period {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		color: var(--text-4);
	}
	.chip-now {
		padding: 0.0625rem 0.4375rem;
		font-size: 0.6875rem;
	}

	.item-title {
		color: var(--text);
	}

	.item-org {
		display: flex;
		align-items: center;
		gap: 0.4375rem;
		margin: 0;
		font-size: 0.9375rem;
		color: var(--text-2);
	}
	.logo {
		width: 1.25rem;
		height: 1.25rem;
		border-radius: var(--r-xs);
		object-fit: contain;
		background: var(--bg-raised);
	}
	.item-loc {
		color: var(--text-4);
	}

	.item-desc {
		max-width: 60ch;
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

	.skel-line {
		height: 0.875rem;
		margin-bottom: 0.5rem;
	}
</style>
