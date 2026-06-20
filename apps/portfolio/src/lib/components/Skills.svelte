<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

  export let skills = [];

  $: categories = [...new Set(skills.map(s => s.category))];
  let activeCategory = 'all';
  $: filtered = activeCategory === 'all' ? skills : skills.filter(s => s.category === activeCategory);

  onMount(async () => {
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo('#skills .reveal-up', { opacity: 0, y: 60 }, {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#skills', start: 'top 75%' },
    });
  });

  function animateBars() {
    gsap.fromTo('.skill-bar-fill', { scaleX: 0 }, {
      scaleX: 1, duration: 1, ease: 'power3.out', stagger: 0.04,
    });
  }

  $: if (filtered) setTimeout(animateBars, 50);
</script>

<section id="skills" class="section-pad relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(167,139,250,0.06)_0%,_transparent_60%)]"></div>

  <div class="max-w-7xl mx-auto px-6 relative z-10">
    <div class="reveal-up text-center mb-12">
      <p class="text-primary text-sm font-mono uppercase tracking-widest mb-3">What I work with</p>
      <h2 class="text-5xl font-black">Technical <span class="gradient-text">Skills</span></h2>
    </div>

    <!-- Category filters -->
    <div class="reveal-up flex flex-wrap justify-center gap-3 mb-12">
      <button
        class="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300"
        class:bg-primary={activeCategory === 'all'}
        class:text-dark={activeCategory === 'all'}
        class:glass={activeCategory !== 'all'}
        class:text-slate-400={activeCategory !== 'all'}
        class:border={activeCategory !== 'all'}
        class:border-border={activeCategory !== 'all'}
        on:click={() => activeCategory = 'all'}
      >All</button>
      {#each categories as cat}
        <button
          class="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300"
          class:bg-primary={activeCategory === cat}
          class:text-dark={activeCategory === cat}
          class:glass={activeCategory !== cat}
          class:text-slate-400={activeCategory !== cat}
          class:border={activeCategory !== cat}
          class:border-border={activeCategory !== cat}
          on:click={() => activeCategory = cat}
        >{cat}</button>
      {/each}
    </div>

    <!-- Skills grid -->
    <div class="reveal-up grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {#each filtered as skill (skill.id)}
        <div class="glass rounded-2xl p-5 border border-border hover:border-primary/30 transition-all duration-300 group">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div class="w-2.5 h-2.5 rounded-full" style="background-color: {skill.color ?? '#a78bfa'}"></div>
              <span class="font-semibold text-slate-200 group-hover:text-white transition-colors">{skill.name}</span>
            </div>
            <span class="text-sm font-mono text-primary">{skill.proficiency}%</span>
          </div>

          <!-- Bar -->
          <div class="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              class="skill-bar-fill h-full rounded-full origin-left"
              style="width:{skill.proficiency}%; background: linear-gradient(90deg, {skill.color ?? '#a78bfa'}, {skill.color ?? '#a78bfa'}88);"
            ></div>
          </div>

          <p class="mt-2 text-xs text-slate-600">{skill.category}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
