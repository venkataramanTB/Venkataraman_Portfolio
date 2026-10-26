<script>
	/**
	 * One featured project, given a whole chapter of its own.
	 *
	 * This is the structural device the reference site is built on and that
	 * every earlier attempt here missed. A featured project is not a card in a
	 * grid — it is roughly two and a half screens of its own colour, with a
	 * STICKY STAGE holding the title while the detail scrolls past underneath.
	 *
	 * Two things make it work:
	 *
	 *  · The ground changes. The drama in a long page comes from the cut
	 *    between chapters as you scroll, not from any one colour. Three
	 *    featured projects means three grounds.
	 *  · The stage is sticky and the chapter is tall. The title stays put long
	 *    enough to be read and to feel like a chapter heading rather than a
	 *    label that flies past.
	 */
	import { reveal } from '$lib/actions/reveal.js';
	import { press } from '$lib/motion/gestures.js';
	import Icon from './Icon.svelte';

	export let project;
	/** Chapter ground class: ch-navy | ch-lavender | ch-yellow | … */
	export let ground = 'ch-navy';
	export let index = 1;

	$: tech = Array.isArray(project?.technologies) ? project.technologies : [];
	/** Split for the per-character reveal the title uses. */
	$: title = project?.title ?? '';
</script>

<section class="chapter {ground} bg-grid chapter-feature" id={`feature-${project.id}`}>
	<!-- The stage. Sticky for the length of the chapter, so the title holds
	     while the body scrolls beneath it. -->
	<div class="stage grid-page">
		<div class="stage-head">
			<p class="t-mono idx">{String(index).padStart(2, '0')}</p>
			<h2 class="t-display title">{title}</h2>
		</div>
	</div>

	<!-- The body, which scrolls past the held title. -->
	<div class="grid-page body">
		<div class="body-col">
			{#if project.description}
				<p class="t-lead desc" use:reveal>{project.description}</p>
			{/if}

			{#if project.thumbnail_url}
				<figure class="shot" use:reveal={{ delay: 80 }}>
					<img src={project.thumbnail_url} alt={title} loading="lazy" />
				</figure>
			{/if}

			{#if project.long_description}
				<div class="prose" use:reveal={{ delay: 60 }}>
					{#each project.long_description.split(/\n{2,}/).filter(Boolean) as para}
						<p class="t-body">{para}</p>
					{/each}
				</div>
			{/if}

			<div class="meta" use:reveal={{ delay: 100 }}>
				{#if tech.length}
					<ul class="tech">
						{#each tech as t}
							<li class="chip">{t}</li>
						{/each}
					</ul>
				{/if}

				<div class="links">
					<a class="btn btn-primary" href={`/work/${project.id}`} use:press>
						<span>Read the case study</span>
						<Icon name="arrow-right" size={16} />
					</a>
					{#if project.demo_url}
						<a class="btn" href={project.demo_url} target="_blank" rel="noopener noreferrer" use:press>
							<Icon name="external" size={15} /> Live
						</a>
					{/if}
					{#if project.github_url}
						<a class="btn" href={project.github_url} target="_blank" rel="noopener noreferrer" use:press>
							<Icon name="github" size={15} /> Code
						</a>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* Tall on purpose. A chapter needs length for the sticky stage to have
	   anything to hold against — at one screen it would just be a section. */
	.chapter-feature {
		min-height: 150svh;
		padding-bottom: clamp(4rem, 12svh, 10rem);
	}

	.stage {
		position: sticky;
		top: 0;
		padding-top: clamp(2rem, 9svh, 6rem);
		padding-bottom: 1.5rem;
		z-index: 1;
		pointer-events: none;
	}
	.stage-head {
		grid-column: 1 / -1;
		display: flex;
		align-items: baseline;
		gap: 1.25rem;
	}
	.idx {
		flex-shrink: 0;
		opacity: 0.7;
	}
	.title {
		margin: 0;
	}

	.body {
		position: relative;
		z-index: 2;
		margin-top: clamp(2rem, 8svh, 6rem);
	}
	/* Offset into the right-hand columns so the held title stays legible in
	   the space the body leaves beside it. */
	.body-col {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		gap: clamp(1.5rem, 4vh, 2.5rem);
	}
	@media (min-width: 48rem) {
		.body-col {
			grid-column: 5 / -1;
		}
	}

	.desc {
		font-size: clamp(1.125rem, 2vw, 1.5rem);
		max-width: 40ch;
	}

	.shot {
		margin: 0;
		border-radius: 10px;
		overflow: hidden;
		aspect-ratio: 3 / 2;
		background: var(--line);
	}
	.shot img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.prose {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}
	.tech {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4375rem;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
		pointer-events: auto;
	}
</style>
