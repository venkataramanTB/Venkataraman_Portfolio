<script>
  import { onMount }      from 'svelte';
  import { BASE }         from '$lib/api.js';
  import Navbar           from '$lib/components/Navbar.svelte';
  import Hero             from '$lib/components/Hero.svelte';
  import About            from '$lib/components/About.svelte';
  import Skills           from '$lib/components/Skills.svelte';
  import Experience       from '$lib/components/Experience.svelte';
  import Projects         from '$lib/components/Projects.svelte';
  import Certificates     from '$lib/components/Certificates.svelte';
  import Contact          from '$lib/components/Contact.svelte';
  import Footer           from '$lib/components/Footer.svelte';
  import LoadingScreen    from '$lib/components/LoadingScreen.svelte';

  export let data;

  // mutable copy so we can hydrate after client-side retry
  let liveData = data;
  let loading   = false;
  let loaderRef;

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

  function isEmpty(d) {
    return !d?.profile && !(d?.skills?.length) && !(d?.projects?.length);
  }

  onMount(async () => {
    if (!isEmpty(liveData)) return; // SSR already gave us data

    loading = true;

    // Poll every 3 s — Render cold-start typically takes 20-30 s
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const res = await fetch(`${BASE}/portfolio`);
        if (res.ok) {
          const fresh = await res.json();
          if (!isEmpty(fresh)) {
            liveData = fresh;
            await loaderRef?.hide();
            loading = false;
            return;
          }
        }
      } catch { /* Render still starting */ }
    }

    // Timed out — hide loader and show whatever we have
    await loaderRef?.hide();
    loading = false;
  });
</script>

<svelte:head>
  <title>{profile?.name ?? 'Venkataraman TB'} — AI Engineer · Full Stack · iOS · ML</title>
  <meta name="description" content={profile?.bio ?? 'AI Engineer, Full Stack Developer, iOS App Developer & ML Engineer'} />
  <meta property="og:title"       content="{profile?.name ?? 'Venkataraman TB'} — Portfolio" />
  <meta property="og:description" content={profile?.bio ?? 'AI Engineer, Full Stack Developer, iOS App Developer & ML Engineer'} />
  <meta property="og:type"        content="website" />
  {#if profile?.avatar_url}
    <meta property="og:image" content={profile.avatar_url} />
  {/if}
</svelte:head>

{#if loading}
  <LoadingScreen bind:this={loaderRef} />
{/if}

<Navbar {socialLinks} />

<main>
  <Hero         {profile} {socialLinks} />
  <About        {profile} {stats} />
  <Skills       {skills} />
  <Experience   {experiences} {education} />
  <Projects     {projects} />
  <Certificates {certificates} {achievements} />
  <Contact      {profile} {socialLinks} />
</main>

<Footer {profile} {socialLinks} />
