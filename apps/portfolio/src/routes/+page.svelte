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

	<!-- The tour.
	     He occupies the left column for the whole page and never leaves it;
	     the sections scroll past him on the right as scenes he introduces.
	     The stage is an empty sticky slot — the Companion measures it and
	     places himself in it, so his position is a consequence of the layout
	     rather than a set of magic numbers. -->
	<div class="tour">
		<div class="tour-stage" aria-hidden="true">
			<div id="character-stage" class="stage-slot"></div>
		</div>

		<main id="main" class="tour-scenes">
			<Hero {profile} {socialLinks} />
			<Practice {profile} {stats} {skills} {projects} />
			<Work {projects} />
			<Experience {experiences} {education} />
			<Stack {skills} />
			<Credentials {certificates} {achievements} />
			<Contact {profile} {socialLinks} />
		</main>
	</div>

	<Footer {profile} {socialLinks} />
{/key}

<style>
	/* The slot he stands in. Sized as a share of the viewport so he scales
	   with the window instead of being pinned to one pixel height, and
	   bottom-aligned so his feet meet the floor of the column. */
	.stage-slot {
		position: absolute;
		left: 0;
		right: 0;
		bottom: clamp(2rem, 9vh, 6rem);
		height: min(74vh, 40rem);
	}
	.tour-stage {
		position: sticky;
	}
</style>
