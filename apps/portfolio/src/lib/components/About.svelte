<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

  export let profile = null;
  export let stats = [];

  onMount(async () => {
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo('#about .reveal-up', {
      opacity: 0, y: 60,
    }, {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: '#about', start: 'top 75%' },
    });

    // Counter animation for stats
    stats.forEach((stat, i) => {
      const el = document.querySelector(`.stat-value-${i}`);
      if (!el) return;
      const target = parseInt(stat.value, 10);
      if (isNaN(target)) return;
      gsap.fromTo({ val: 0 }, { val: target }, {
        val: target, duration: 2, ease: 'power2.out',
        scrollTrigger: { trigger: '#about', start: 'top 75%' },
        onUpdate: function() { el.textContent = Math.round(this.targets()[0].val) + (stat.suffix || ''); },
      });
    });
  });

  const domainIcons = {
    'AI Engineer':            { icon: '🧠', color: 'text-primary' },
    'Full Stack Developer':   { icon: '⚡', color: 'text-secondary' },
    'iOS App Developer':      { icon: '📱', color: 'text-accent' },
    'ML Engineer':            { icon: '🔬', color: 'text-green-400' },
  };
</script>

<section id="about" class="section-pad relative">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(56,189,248,0.05)_0%,_transparent_60%)]"></div>

  <div class="max-w-7xl mx-auto px-6 relative z-10">
    <!-- Section header -->
    <div class="reveal-up text-center mb-16">
      <p class="text-primary text-sm font-mono uppercase tracking-widest mb-3">Get to know me</p>
      <h2 class="text-5xl font-black">About <span class="gradient-text">Me</span></h2>
    </div>

    <div class="grid lg:grid-cols-2 gap-16 items-center">
      <!-- Left — bio + domains -->
      <div class="space-y-8">
        <p class="reveal-up text-lg text-slate-300 leading-relaxed">
          {profile?.bio ?? 'I architect intelligent systems that span the full stack — from training ML models and shipping LLM-powered agents to building pixel-perfect iOS apps and high-throughput web backends.'}
        </p>

        <div class="reveal-up grid grid-cols-2 gap-4">
          {#each Object.entries(domainIcons) as [domain, { icon, color }]}
            <div class="glass rounded-2xl p-4 border border-border hover:border-primary/30 transition-all duration-300 group">
              <span class="text-2xl mb-2 block">{icon}</span>
              <p class="text-sm font-semibold text-slate-200 group-hover:text-primary transition-colors">{domain}</p>
            </div>
          {/each}
        </div>

        <div class="reveal-up flex flex-wrap gap-3">
          {#if profile?.location}
            <span class="px-3 py-1.5 rounded-full text-sm glass border border-border text-slate-400">📍 {profile.location}</span>
          {/if}
          {#if profile?.email}
            <a href="mailto:{profile.email}" class="px-3 py-1.5 rounded-full text-sm glass border border-border text-slate-400 hover:text-primary transition-colors">✉️ {profile.email}</a>
          {/if}
        </div>
      </div>

      <!-- Right — animated stats -->
      <div class="reveal-up grid grid-cols-2 gap-6">
        {#each stats as stat, i}
          <div class="glass rounded-3xl p-8 border border-border hover:border-primary/30 transition-all duration-300 text-center group glow-primary opacity-0 group-hover:opacity-100">
            <p class="stat-value-{i} text-4xl font-black gradient-text mb-2">{stat.value}{stat.suffix ?? ''}</p>
            <p class="text-sm text-slate-400">{stat.label}</p>
          </div>
        {/each}

        {#if stats.length === 0}
          {#each [['30+','Projects Shipped'],['10+','AI Models'],['5+','iOS Apps'],['15+','Certs']] as [val, label]}
            <div class="glass rounded-3xl p-8 border border-border text-center">
              <p class="text-4xl font-black gradient-text mb-2">{val}</p>
              <p class="text-sm text-slate-400">{label}</p>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
</section>
