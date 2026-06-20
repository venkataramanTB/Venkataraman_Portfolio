<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';
  import NeuralCanvas from './NeuralCanvas.svelte';

  export let profile = null;
  export let socialLinks = [];

  const roles = ['AI Engineer', 'Full Stack Developer', 'iOS App Developer', 'ML Engineer'];
  let roleIdx = 0;
  let currentRole = roles[0];
  let roleEl;

  onMount(async () => {
    const { ScrollTrigger, TextPlugin } = await import('gsap/all');
    gsap.registerPlugin(ScrollTrigger, TextPlugin);

    // Entrance timeline
    const tl = gsap.timeline({ delay: 0.2 });
    tl.fromTo('.hero-badge',   { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
      .fromTo('.hero-name',    { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .fromTo('.hero-role',    { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.4')
      .fromTo('.hero-bio',     { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
      .fromTo('.hero-ctas',    { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.3')
      .fromTo('.hero-socials', { opacity: 0 },         { opacity: 1, duration: 0.4 }, '-=0.2')
      .fromTo('.hero-scroll',  { opacity: 0 },         { opacity: 1, duration: 0.4 }, '-=0.1');

    // Role cycler
    const cycleRole = () => {
      gsap.to(roleEl, {
        opacity: 0, y: -10, duration: 0.3, ease: 'power2.in',
        onComplete: () => {
          roleIdx = (roleIdx + 1) % roles.length;
          currentRole = roles[roleIdx];
          gsap.fromTo(roleEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
        },
      });
    };
    const interval = setInterval(cycleRole, 2800);

    return () => clearInterval(interval);
  });
</script>

<section id="home" class="relative min-h-screen flex items-center overflow-hidden">
  <!-- Three.js background -->
  <div class="absolute inset-0 z-0 opacity-60">
    <NeuralCanvas />
  </div>

  <!-- Radial gradient overlay -->
  <div class="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_rgba(167,139,250,0.08)_0%,_rgba(10,10,15,0)_70%)]"></div>

  <!-- Grid lines -->
  <div class="absolute inset-0 z-0 opacity-[0.03]"
    style="background-image: linear-gradient(rgba(167,139,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px); background-size: 60px 60px;">
  </div>

  <div class="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 w-full">
    <div class="max-w-3xl">
      <!-- Badge -->
      <div class="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium border border-primary/30 bg-primary/5 text-primary mb-6 opacity-0">
        <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
        {#if profile?.open_to_work}Available for opportunities{:else}Currently engaged{/if}
      </div>

      <!-- Name -->
      <h1 class="hero-name text-6xl sm:text-7xl lg:text-8xl font-black leading-none tracking-tight opacity-0 mb-4">
        <span class="text-white">{profile?.name?.split(' ')[0] ?? 'Venkataraman'}</span>
        <br />
        <span class="gradient-text">{profile?.name?.split(' ').slice(1).join(' ') ?? 'TB'}</span>
      </h1>

      <!-- Animated role -->
      <div class="hero-role flex items-center gap-3 mb-6 opacity-0">
        <span class="w-8 h-px bg-primary"></span>
        <span bind:this={roleEl} class="text-xl sm:text-2xl font-semibold text-primary font-mono">{currentRole}</span>
      </div>

      <!-- Bio -->
      <p class="hero-bio text-lg text-slate-400 leading-relaxed max-w-xl mb-10 opacity-0">
        {profile?.bio ?? 'I architect intelligent systems — from LLM-powered agents and ML pipelines to pixel-perfect iOS apps and high-throughput web backends.'}
      </p>

      <!-- CTAs -->
      <div class="hero-ctas flex flex-wrap items-center gap-4 mb-12 opacity-0">
        <a
          href="#projects"
          class="group px-8 py-3.5 rounded-full font-semibold text-dark bg-primary hover:bg-white transition-all duration-300 glow-primary"
        >
          View My Work
          <span class="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
        </a>
        {#if profile?.resume_url}
          <a
            href={profile.resume_url}
            target="_blank"
            class="px-8 py-3.5 rounded-full font-semibold text-white border border-white/20 hover:border-primary hover:text-primary glass transition-all duration-300"
          >
            Download CV
          </a>
        {:else}
          <a
            href="#contact"
            class="px-8 py-3.5 rounded-full font-semibold text-white border border-white/20 hover:border-primary hover:text-primary glass transition-all duration-300"
          >
            Get In Touch
          </a>
        {/if}
      </div>

      <!-- Social links -->
      <div class="hero-socials flex items-center gap-4 opacity-0">
        {#each socialLinks as link}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors duration-200"
          >
            <span class="capitalize">{link.platform}</span>
          </a>
        {/each}
      </div>
    </div>
  </div>

  <!-- Scroll indicator -->
  <div class="hero-scroll absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0">
    <span class="text-xs text-slate-600 uppercase tracking-widest">Scroll</span>
    <div class="w-px h-12 bg-gradient-to-b from-primary to-transparent animate-pulse"></div>
  </div>
</section>
