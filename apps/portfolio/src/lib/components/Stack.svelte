<script>
	/**
	 * Stack — skills grouped by the category they were filed under.
	 *
	 * Proficiency is shown as a meter, but deliberately unlabelled with a
	 * number: a self-assigned "92%" invites an argument no reader can settle,
	 * while a relative bar communicates depth honestly. The number is still
	 * exposed to assistive technology via the progressbar role.
	 */
	import { onMount } from 'svelte';
	import { reveal } from '$lib/actions/reveal.js';
	import SectionHead from './SectionHead.svelte';
	import Icon from './Icon.svelte';

	export let skills = [];

	/** Group by category, preserving each skill's display_order within it. */
	$: groups = (() => {
		const map = new Map();
		for (const s of [...skills].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))) {
			const key = s.category || 'Other';
			if (!map.has(key)) map.set(key, []);
			map.get(key).push(s);
		}
		return [...map.entries()].map(([name, items]) => ({ name, items }));
	})();

	$: featured = skills.filter((s) => s.is_featured);

	/**
	 * The database carries a `color` per skill, left over from the previous
	 * design system. It is deliberately not used: on a single-colour field a
	 * row of arbitrary purples and greens reads as decoration, and the one
	 * thing a meter has to communicate — relative depth — is carried by its
	 * length. The column stays in the schema so the admin console and any
	 * future theme can still use it.
	 */

	/* The meters fill once, when the section first arrives. Driven by a class
	   rather than per-element JS: nothing can interrupt it, so CSS is right. */
	let filled = false;
	let section;

	onMount(() => {
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					filled = true;
					io.disconnect();
				}
			},
			{ threshold: 0.15 }
		);
		if (section) io.observe(section);
		return () => io.disconnect();
	});
</script>

<section bind:this={section} id="stack" class="section">
	<div class="shell">
		<SectionHead
			eyebrow="Stack"
			icon="stack"
			title="Tools in active use"
			note="Grouped by what they're for. Depth shown relative to the rest, not as a self-awarded score."
		/>

		{#if featured.length}
			<ul class="featured" use:reveal>
				{#each featured as s (s.id)}
					<li class="chip chip-feat">
						{#if s.icon_url}
							<img src={s.icon_url} alt="" width="15" height="15" loading="lazy" />
						{:else}
							<span class="chip-dot" aria-hidden="true"></span>
						{/if}
						{s.name}
					</li>
				{/each}
			</ul>
		{/if}

		{#if !skills.length}
			<div class="groups">
				{#each Array(3) as _}
					<section class="group card">
						<div class="skel skel-line" style="width: 45%; height: 1rem"></div>
						{#each Array(4) as _}
							<div class="skel skel-line" style="width: 100%"></div>
						{/each}
					</section>
				{/each}
			</div>
		{:else}
			<div class="groups">
				{#each groups as g, gi (g.name)}
					<section class="group card" use:reveal={{ delay: Math.min(gi, 5) * 70 }}>
						<header class="group-head">
							<h3 class="t-head">{g.name}</h3>
							<span class="t-mono group-count">{g.items.length}</span>
						</header>

						<ul class="skills">
							{#each g.items as s (s.id)}
								<li class="skill">
									<div class="skill-row">
										{#if s.icon_url}
											<img class="skill-icon" src={s.icon_url} alt="" width="17" height="17" loading="lazy" />
										{/if}
										<span class="skill-name">{s.name}</span>
									</div>

									<div
										class="meter"
										role="progressbar"
										aria-label={`${s.name} proficiency`}
										aria-valuenow={s.proficiency ?? 0}
										aria-valuemin="0"
										aria-valuemax="100"
									>
										<div
											class="meter-fill"
											class:filled
											style={`--p:${Math.max(0, Math.min(100, s.proficiency ?? 0))}%`}
										></div>
									</div>
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	.featured {
		list-style: none;
		margin: 0 0 2rem;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4375rem;
	}
	.chip-feat {
		padding: 0.375rem 0.75rem;
		font-size: 0.84375rem;
		background: var(--bg-raised);
		box-shadow: var(--e1);
		color: var(--text);
	}
	.chip-feat img {
		border-radius: 3px;
	}

	.groups {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
		gap: 1rem;
		align-items: start;
	}

	.group {
		padding: 1.25rem 1.375rem 1.5rem;
	}

	.group-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		padding-bottom: 0.875rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--hairline);
	}
	.group-count {
		color: var(--text-4);
	}

	.skills {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.skill-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.4375rem;
	}
	.skill-icon {
		border-radius: 3px;
		flex-shrink: 0;
	}
	.skill-name {
		font-size: 0.90625rem;
		font-weight: 500;
		color: var(--text-2);
		letter-spacing: -0.004em;
	}

	/* scaleX from 0 keeps the fill on the compositor; animating width would
	   lay out every meter on the page each frame. */
	.meter-fill {
		transform: scaleX(0);
		transition: transform 1s var(--ease-out);
		width: var(--p);
	}
	.meter-fill.filled {
		transform: scaleX(1);
	}

	@media (prefers-reduced-motion: reduce) {
		.meter-fill {
			transition: none;
			transform: scaleX(1);
		}
	}

	.skel-line {
		height: 0.875rem;
		margin-bottom: 0.625rem;
	}
</style>
