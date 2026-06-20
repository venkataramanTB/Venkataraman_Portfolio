<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

  export let certificates = [];
  export let achievements = [];

  let activeTab = 'certs';

  onMount(async () => {
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo('#certificates .reveal-up', { opacity: 0, y: 60 }, {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power3.out',
      scrollTrigger: { trigger: '#certificates', start: 'top 75%' },
    });
  });
</script>

<section id="certificates" class="section-pad relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(167,139,250,0.06)_0%,_transparent_60%)]"></div>

  <div class="max-w-7xl mx-auto px-6 relative z-10">
    <div class="reveal-up text-center mb-12">
      <p class="text-primary text-sm font-mono uppercase tracking-widest mb-3">Recognition & credentials</p>
      <h2 class="text-5xl font-black">Certificates & <span class="gradient-text">Achievements</span></h2>
    </div>

    <!-- Tab -->
    <div class="reveal-up flex justify-center gap-2 mb-12">
      {#each [['certs','Certificates'],['awards','Achievements']] as [tab, label]}
        <button
          class="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300"
          class:bg-primary={activeTab === tab}
          class:text-dark={activeTab === tab}
          class:glass={activeTab !== tab}
          class:text-slate-400={activeTab !== tab}
          class:border={activeTab !== tab}
          class:border-border={activeTab !== tab}
          on:click={() => activeTab = tab}
        >{label}</button>
      {/each}
    </div>

    {#if activeTab === 'certs'}
      <div class="reveal-up grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {#each certificates as cert (cert.id)}
          <div class="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 group flex flex-col gap-3">
            <!-- Header row -->
            <div class="flex items-start gap-4">
              {#if cert.image_url}
                <img src={cert.image_url} alt={cert.issuer} class="w-12 h-12 rounded-xl object-contain bg-white/5 p-1.5 shrink-0" />
              {:else}
                <div class="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-xl">🏅</div>
              {/if}
              <div class="min-w-0">
                <h3 class="font-bold text-white leading-snug text-sm group-hover:text-primary transition-colors line-clamp-2">{cert.title}</h3>
                <p class="text-xs text-slate-400 mt-0.5">{cert.issuer}</p>
              </div>
            </div>

            {#if cert.issued_date}
              <p class="text-xs text-slate-600 font-mono">Issued: {cert.issued_date}{cert.expiry_date ? ` · Expires: ${cert.expiry_date}` : ''}</p>
            {/if}

            {#if cert.credential_url}
              <a
                href={cert.credential_url} target="_blank" rel="noopener"
                class="mt-auto inline-flex items-center gap-1.5 text-xs text-primary hover:text-white transition-colors"
              >
                View Credential →
              </a>
            {/if}
          </div>
        {/each}

        {#if certificates.length === 0}
          <div class="col-span-3 text-center py-16 text-slate-500">Certificates will appear here once added via the admin panel.</div>
        {/if}
      </div>

    {:else}
      <div class="reveal-up grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {#each achievements as ach (ach.id)}
          <div class="glass rounded-2xl p-6 border border-border hover:border-accent/30 transition-all duration-300 group">
            <div class="text-3xl mb-3">{ach.icon ?? '🏆'}</div>
            <h3 class="font-bold text-white mb-2 group-hover:text-accent transition-colors">{ach.title}</h3>
            {#if ach.description}
              <p class="text-sm text-slate-400 leading-relaxed mb-3">{ach.description}</p>
            {/if}
            {#if ach.date}
              <p class="text-xs text-slate-600 font-mono">{ach.date}</p>
            {/if}
          </div>
        {/each}

        {#if achievements.length === 0}
          <div class="col-span-3 text-center py-16 text-slate-500">Achievements will appear here once added via the admin panel.</div>
        {/if}
      </div>
    {/if}
  </div>
</section>
