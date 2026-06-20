<script>
  import { onMount } from 'svelte';
  import ParticleText from './ParticleText.svelte';
  import NeuralCanvas from './NeuralCanvas.svelte';

  export let profile     = null;
  export let socialLinks = [];

  let visible = false;

  $: name = (profile?.name ?? 'Venkataraman TB').toUpperCase();

  function getSocial(platform) {
    return socialLinks.find(l => l.platform?.toLowerCase() === platform)?.url ?? null;
  }

  onMount(() => { setTimeout(() => { visible = true; }, 80); });
</script>

<section id="home" class="relative min-h-screen flex flex-col justify-center px-6 pb-20 pt-28 max-w-5xl mx-auto">

  <!-- Available badge -->
  <div class="mb-10 transition-all duration-700"
       style="opacity: {visible ? 1 : 0}; transform: translateY({visible ? 0 : 16}px); transition-delay: 80ms">
    <span class="inline-flex items-center gap-2 sec-num">
      <span class="w-1.5 h-1.5 rounded-full {profile?.open_to_work !== false ? 'animate-pulse' : ''}"
            style="background: {profile?.open_to_work !== false ? 'var(--accent)' : 'var(--muted)'}"></span>
      {profile?.open_to_work !== false ? 'Available for opportunities' : 'Currently engaged'}
    </span>
  </div>

  <!-- Particle name canvas -->
  <div class="mb-6 w-full transition-all duration-1000 relative"
       style="opacity: {visible ? 1 : 0}; transition-delay: 160ms; z-index:1">
    <ParticleText {name} color="var(--text)" gap={4} dotSize={2} speed={0.062} />
    <div class="hero-canvas">
      <!-- subtle neural canvas behind the particles -->
      <NeuralCanvas />
    </div>
  </div>

  <!-- Tagline / role -->
  <div class="mb-8 transition-all duration-700"
       style="opacity: {visible ? 1 : 0}; transform: translateY({visible ? 0 : 20}px); transition-delay: 340ms">
    <p class="sec-num text-[0.7rem] tracking-[0.18em]">
      {profile?.tagline ?? 'AI Engineer · Full Stack Developer · iOS Dev · ML Engineer'}
    </p>
  </div>

  <!-- Bio -->
  <div class="mb-12 max-w-2xl transition-all duration-700"
       style="opacity: {visible ? 1 : 0}; transform: translateY({visible ? 0 : 20}px); transition-delay: 460ms">
    <p class="text-base leading-relaxed" style="color: var(--muted)">
      {profile?.bio ?? 'I architect intelligent systems — LLM-powered agents, ML pipelines, pixel-perfect iOS apps, and high-throughput web backends.'}
    </p>
  </div>

  <!-- Links row -->
  <div class="flex flex-wrap items-center gap-x-8 gap-y-3 transition-all duration-700"
       style="opacity: {visible ? 1 : 0}; transform: translateY({visible ? 0 : 20}px); transition-delay: 580ms">

    {#if profile?.location}
      <span class="sec-num">📍 {profile.location}</span>
    {/if}

    {#each socialLinks as link}
      <a href={link.url} target="_blank" rel="noopener noreferrer"
         class="sec-num hover:text-[var(--text)] transition-colors duration-200">
        {link.platform}
      </a>
    {/each}

    {#if profile?.email && !socialLinks.find(l => l.platform?.toLowerCase() === 'email')}
      <a href="mailto:{profile.email}"
         class="sec-num hover:text-[var(--text)] transition-colors duration-200">Email</a>
    {/if}

    <a href="#projects" class="ml-auto group sec-num hover:text-[var(--text)] transition-colors duration-200">
      View work <span class="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
    </a>
  </div>

  <!-- Scroll cue -->
  <div class="absolute bottom-10 left-6 flex flex-col items-start gap-2 transition-all duration-700"
       style="opacity: {visible ? 1 : 0}; transition-delay: 900ms">
    <span class="sec-num" style="font-size:0.6rem; color: var(--border)">SCROLL</span>
    <div class="w-px h-12 overflow-hidden" style="background: var(--border)">
      <div class="w-full h-full scroll-cue" style="background: var(--muted)"></div>
    </div>
  </div>
</section>
