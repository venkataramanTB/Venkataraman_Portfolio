<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

  export let projects = [];

  $: categories = ['All', ...new Set(projects.map(p => p.category).filter(Boolean))];
  let active = 'All';
  $: filtered = active === 'All' ? projects : projects.filter(p => p.category === active);

  let hoveredId = null;

  onMount(async () => {
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo('#projects .reveal-up', { opacity: 0, y: 60 }, {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '#projects', start: 'top 75%' },
    });
  });

  function onEnter(id) {
    hoveredId = id;
    gsap.to(`#card-${id}`, { y: -8, duration: 0.4, ease: 'power2.out' });
  }
  function onLeave(id) {
    hoveredId = null;
    gsap.to(`#card-${id}`, { y: 0, duration: 0.4, ease: 'power2.out' });
  }

  const categoryColors = {
    'AI / ML':     'text-primary border-primary/30 bg-primary/5',
    'Full Stack':  'text-secondary border-secondary/30 bg-secondary/5',
    'iOS':         'text-accent border-accent/30 bg-accent/5',
    'DevOps':      'text-green-400 border-green-400/30 bg-green-400/5',
  };

  function catClass(cat) {
    return categoryColors[cat] ?? 'text-slate-400 border-border bg-white/5';
  }
</script>

<section id="projects" class="section-pad relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(251,146,60,0.04)_0%,_transparent_60%)]"></div>

  <div class="max-w-7xl mx-auto px-6 relative z-10">
    <div class="reveal-up text-center mb-12">
      <p class="text-primary text-sm font-mono uppercase tracking-widest mb-3">What I've built</p>
      <h2 class="text-5xl font-black">Featured <span class="gradient-text">Projects</span></h2>
    </div>

    <!-- Filters -->
    <div class="reveal-up flex flex-wrap justify-center gap-3 mb-12">
      {#each categories as cat}
        <button
          class="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300"
          class:bg-primary={active === cat}
          class:text-dark={active === cat}
          class:glass={active !== cat}
          class:text-slate-400={active !== cat}
          class:border={active !== cat}
          class:border-border={active !== cat}
          on:click={() => active = cat}
        >{cat}</button>
      {/each}
    </div>

    <!-- Grid -->
    <div class="reveal-up grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filtered as proj (proj.id)}
        <div
          id="card-{proj.id}"
          class="glass rounded-3xl border border-border overflow-hidden flex flex-col cursor-pointer transition-all duration-300"
          class:border-primary={hoveredId === proj.id}
          on:mouseenter={() => onEnter(proj.id)}
          on:mouseleave={() => onLeave(proj.id)}
          role="article"
        >
          <!-- Thumbnail / Gradient header -->
          <div class="relative h-44 overflow-hidden">
            {#if proj.thumbnail_url}
              <img src={proj.thumbnail_url} alt={proj.title} class="w-full h-full object-cover" />
            {:else}
              <div class="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 flex items-center justify-center">
                <span class="text-4xl opacity-40">
                  {proj.category === 'iOS' ? '📱' : proj.category === 'AI / ML' ? '🧠' : proj.category === 'Full Stack' ? '⚡' : '🚀'}
                </span>
              </div>
            {/if}
            {#if proj.is_featured}
              <span class="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-primary text-dark">Featured</span>
            {/if}
            {#if proj.category}
              <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium border {catClass(proj.category)}">{proj.category}</span>
            {/if}
          </div>

          <!-- Body -->
          <div class="flex flex-col flex-1 p-6">
            <h3 class="text-lg font-bold text-white mb-2">{proj.title}</h3>
            <p class="text-slate-400 text-sm leading-relaxed flex-1 mb-4">{proj.description ?? ''}</p>

            <!-- Tech stack -->
            {#if proj.technologies?.length}
              <div class="flex flex-wrap gap-1.5 mb-5">
                {#each proj.technologies.slice(0, 5) as tech}
                  <span class="px-2 py-0.5 rounded text-xs bg-white/5 text-slate-400 border border-white/10">{tech}</span>
                {/each}
                {#if proj.technologies.length > 5}
                  <span class="px-2 py-0.5 rounded text-xs bg-white/5 text-slate-500">+{proj.technologies.length - 5}</span>
                {/if}
              </div>
            {/if}

            <!-- Links -->
            <div class="flex gap-3 mt-auto">
              {#if proj.demo_url}
                <a href={proj.demo_url} target="_blank" rel="noopener"
                   class="flex-1 py-2 rounded-full text-center text-sm font-medium bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-dark transition-all duration-300">
                  Live Demo
                </a>
              {/if}
              {#if proj.github_url}
                <a href={proj.github_url} target="_blank" rel="noopener"
                   class="flex-1 py-2 rounded-full text-center text-sm font-medium glass border border-border text-slate-400 hover:text-white hover:border-white/30 transition-all duration-300">
                  GitHub
                </a>
              {/if}
              {#if proj.appstore_url}
                <a href={proj.appstore_url} target="_blank" rel="noopener"
                   class="flex-1 py-2 rounded-full text-center text-sm font-medium bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-dark transition-all duration-300">
                  App Store
                </a>
              {/if}
            </div>
          </div>
        </div>
      {/each}

      {#if filtered.length === 0}
        <div class="col-span-3 text-center py-16 text-slate-500">No projects in this category yet.</div>
      {/if}
    </div>
  </div>
</section>
