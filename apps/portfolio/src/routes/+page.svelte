<script>
  import Navbar       from '$lib/components/Navbar.svelte';
  import Hero         from '$lib/components/Hero.svelte';
  import About        from '$lib/components/About.svelte';
  import Skills       from '$lib/components/Skills.svelte';
  import Experience   from '$lib/components/Experience.svelte';
  import Projects     from '$lib/components/Projects.svelte';
  import Certificates from '$lib/components/Certificates.svelte';
  import Contact      from '$lib/components/Contact.svelte';
  import Footer       from '$lib/components/Footer.svelte';

  export let data;

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
  } = data);
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

<Navbar {socialLinks} />

<main>
  <Hero      {profile} {socialLinks} />
  <About     {profile} {stats} />
  <Skills    {skills} />
  <Experience {experiences} {education} />
  <Projects  {projects} />
  <Certificates {certificates} {achievements} />
  <Contact   {profile} {socialLinks} />
</main>

<Footer {profile} {socialLinks} />
