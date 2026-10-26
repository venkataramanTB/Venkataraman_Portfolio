<script>
	/**
	 * Home.
	 *
	 * Section order leads with evidence and ends with the ask:
	 *   Hero → Practice → Work → Experience → Stack → Credentials → Contact
	 *
	 * The cold-start polling is unchanged in behaviour — the API sleeps on the
	 * free tier, so when SSR comes back empty the page keeps asking until it
	 * answers, then swaps the content in.
	 */
	import { onMount, tick } from 'svelte';
	import { BASE } from '$lib/api.js';
	import Nav from '$lib/components/Nav.svelte';
	import Hero from '$lib/components/Hero.svelte';
	import Practice from '$lib/components/Practice.svelte';
	import Work from '$lib/components/Work.svelte';
	import Experience from '$lib/components/Experience.svelte';
	import Stack from '$lib/components/Stack.svelte';
	import Credentials from '$lib/components/Credentials.svelte';
	import Contact from '$lib/components/Contact.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import LoadingScreen from '$lib/components/LoadingScreen.svelte';
	import FeatureChapter from '$lib/components/FeatureChapter.svelte';

	export let data;

	let liveData = data;
	let loading = false;
	let loaderRef;
	/** Bumping this remounts the sections so their entrance plays with real
	    data instead of against the empty placeholders. */
	let dataKey = 0;

	$: ({
		profile,
		social_links: socialLinks,
		skills,
		experiences,
		projects,
		certificates,
		achievements,
		education,
		stats
	} = liveData);

	$: title = `${profile?.name ?? 'Venkataraman TB'} — AI, ML, iOS & Full-Stack Engineer`;
	$: description =
		profile?.bio ??
		'AI engineer and full-stack developer building LLM agents, ML pipelines, native iOS apps and the backends underneath them.';

	/**
	 * The three featured projects become full colour chapters of their own,
	 * each about one and a half screens tall. Everything else goes in the
	 * work index below them.
	 */
	const GROUNDS = ['ch-char', 'ch-gold', 'ch-bronze'];
	$: featured = (projects ?? []).filter((p) => p.is_featured).slice(0, 3);
	$: rest = (projects ?? []).filter((p) => !featured.includes(p));

	function isEmpty(d) {
		return !d?.profile && !d?.skills?.length && !d?.projects?.length;
	}

	onMount(async () => {
		if (!isEmpty(liveData)) return; // SSR had data — nothing to wait for

		loading = true;

		for (let i = 0; i < 25; i++) {
			await new Promise((r) => setTimeout(r, 3000));
			try {
				const res = await fetch(`${BASE}/portfolio`);
				if (res.ok) {
					const fresh = await res.json();
					if (!isEmpty(fresh)) {
						liveData = fresh;
						await loaderRef?.hide();
						loading = false;
						await tick();
						dataKey++;
						return;
					}
				}
			} catch {
				/* still waking */
			}
		}

		// Timed out. Show whatever there is rather than holding the screen.
		await loaderRef?.hide();
		loading = false;
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href="https://venkataraman.dev/" />

	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:site_name" content="{profile?.name ?? 'Venkataraman TB'} — Portfolio" />
	<meta property="og:image" content={profile?.avatar_url ?? '/profile_picture.png'} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={profile?.avatar_url ?? '/profile_picture.png'} />
</svelte:head>

{#if loading}
	<LoadingScreen bind:this={loaderRef} />
{/if}

{#key dataKey}
	<Nav {socialLinks} resumeUrl={profile?.resume_url ?? ''} />

	<!-- Chapters run full-bleed. The character floats over them as a fixed
	     overlay rather than occupying a column: a reserved lane would stop
	     every ground short of the viewport edge, and full-bleed colour is the
	     whole point of the chapter system. -->
	<div>
		<main id="main" class="scenes">
			<!-- Each chapter carries its own ground. The drama in a long page is
			     the cut between them as you scroll, not any single colour. -->
			<div class="chapter ch-ink bg-grid">
				<Hero {profile} {socialLinks} />
			</div>

			<div class="chapter ch-cream bg-grid">
				<Practice {profile} {stats} {skills} {projects} />
			</div>

			{#each featured as p, i (p.id)}
				<FeatureChapter project={p} ground={GROUNDS[i % GROUNDS.length]} index={i + 1} />
			{/each}

			<div class="chapter ch-stone bg-grid">
				<Work projects={rest} />
				<Experience {experiences} {education} />
				<Stack {skills} />
				<Credentials {certificates} {achievements} />
			</div>

			<div class="chapter ch-ink bg-grid">
				<Contact {profile} {socialLinks} />
			</div>
		</main>
	</div>

	<Footer {profile} {socialLinks} />
{/key}

