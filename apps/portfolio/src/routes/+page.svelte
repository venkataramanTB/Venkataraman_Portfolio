<script>
  import { onMount, tick }  from 'svelte';
  import { BASE }           from '$lib/api.js';
  import Navbar             from '$lib/components/Navbar.svelte';
  import Hero               from '$lib/components/Hero.svelte';
  import About              from '$lib/components/About.svelte';
  import Experience         from '$lib/components/Experience.svelte';
  import Projects           from '$lib/components/Projects.svelte';
  import Skills             from '$lib/components/Skills.svelte';
  import Certificates       from '$lib/components/Certificates.svelte';
  import Contact            from '$lib/components/Contact.svelte';
  import Footer             from '$lib/components/Footer.svelte';
  import LoadingScreen      from '$lib/components/LoadingScreen.svelte';

  export let data;

  // Mutable copy — updated client-side when Render wakes from cold start
  let liveData = data;
  let loading  = false;
  let loaderRef;
  // Incrementing this key destroys + recreates all section components,
  // forcing onMount to re-run with populated data so GSAP animations play.
  let dataKey  = 0;

  $: ({
    profile,
    social_links:  socialLinks,
    skills,
    experiences,
    projects,
    certificates,
    achievements,
    education,
    stats,
  } = liveData);

  $: title = `${profile?.name ?? 'Venkataraman TB'} — AI Engineer, Full Stack, iOS, ML`;
  $: description =
    profile?.bio ??
    'AI engineer and full-stack developer building LLM agents, ML pipelines, native iOS apps and the backends underneath them.';

  function isEmpty(d) {
    return !d?.profile && !(d?.skills?.length) && !(d?.projects?.length);
  }

  onMount(async () => {
    if (!isEmpty(liveData)) return; // SSR gave us data — nothing to do

    loading = true;

    // Poll every 3 s — Render cold-start typically takes 20–30 s
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const res = await fetch(`${BASE}/portfolio`);
        if (res.ok) {
          const fresh = await res.json();
          if (!isEmpty(fresh)) {
            liveData = fresh;          // populate reactive vars
            await loaderRef?.hide();   // shutter out the loading screen
            loading = false;           // unmount LoadingScreen
            await tick();              // let Svelte flush DOM updates
            dataKey++;                 // remount all sections → onMount reruns with real data
            return;
          }
        }
      } catch { /* Render still waking */ }
    }

    // Timed out — hide loader anyway and show whatever we have
    await loaderRef?.hide();
    loading = false;
  });
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href="https://venkataraman.dev/" />

  <meta property="og:type"        content="website" />
  <meta property="og:title"       content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:site_name"   content="{profile?.name ?? 'Venkataraman TB'} — Portfolio" />
  <meta property="og:image"       content={profile?.avatar_url ?? '/profile_picture.png'} />

  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image"       content={profile?.avatar_url ?? '/profile_picture.png'} />
</svelte:head>

{#if loading}
  <LoadingScreen bind:this={loaderRef} />
{/if}

{#key dataKey}
  <Navbar {socialLinks} />

  <main id="main">
    <Hero         {profile} {socialLinks} />
    <About        {profile} {stats} />
    <Experience   {experiences} {education} />
    <Projects     {projects} />
    <Skills       {skills} />
    <Certificates {certificates} {achievements} />
    <Contact      {profile} {socialLinks} />
  </main>

  <Footer {profile} {socialLinks} />
{/key}
