<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

  export let experiences = [];
  export let education = [];

  let activeTab = 'work';

  onMount(async () => {
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo('#experience .reveal-up', { opacity: 0, y: 60 }, {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: '#experience', start: 'top 75%' },
    });
  });
</script>

<section id="experience" class="section-pad relative">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(56,189,248,0.04)_0%,_transparent_60%)]"></div>

  <div class="max-w-5xl mx-auto px-6 relative z-10">
    <div class="reveal-up text-center mb-12">
      <p class="text-primary text-sm font-mono uppercase tracking-widest mb-3">My journey</p>
      <h2 class="text-5xl font-black">Experience & <span class="gradient-text">Education</span></h2>
    </div>

    <!-- Tab switcher -->
    <div class="reveal-up flex justify-center gap-2 mb-12">
      {#each [['work','Work Experience'],['edu','Education']] as [tab, label]}
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

    <!-- Timeline -->
    <div class="reveal-up relative">
      <!-- Vertical line -->
      <div class="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-transparent"></div>

      <div class="space-y-8 pl-20">
        {#if activeTab === 'work'}
          {#each experiences as exp (exp.id)}
            <div class="relative group">
              <!-- Dot -->
              <div class="absolute -left-[3.25rem] top-6 w-4 h-4 rounded-full border-2 border-primary bg-dark group-hover:bg-primary transition-all duration-300 group-hover:scale-125"></div>

              <div class="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 class="text-lg font-bold text-white">{exp.role}</h3>
                    <p class="text-primary font-medium">{exp.company}</p>
                  </div>
                  <div class="text-right">
                    <span class="text-sm text-slate-500 font-mono">
                      {exp.start_date ?? ''} — {exp.is_current ? 'Present' : (exp.end_date ?? '')}
                    </span>
                    {#if exp.location}
                      <p class="text-xs text-slate-600 mt-1">{exp.location}</p>
                    {/if}
                  </div>
                </div>

                {#if exp.description}
                  <p class="text-slate-400 text-sm leading-relaxed mb-4">{exp.description}</p>
                {/if}

                {#if exp.technologies?.length}
                  <div class="flex flex-wrap gap-2">
                    {#each exp.technologies as tech}
                      <span class="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">{tech}</span>
                    {/each}
                  </div>
                {/if}

                {#if exp.is_current}
                  <span class="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-xs bg-green-400/10 text-green-400 border border-green-400/20">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    Current
                  </span>
                {/if}
              </div>
            </div>
          {/each}

          {#if experiences.length === 0}
            <p class="text-slate-500 text-center py-12">No experience entries yet.</p>
          {/if}
        {:else}
          {#each education as edu (edu.id)}
            <div class="relative group">
              <div class="absolute -left-[3.25rem] top-6 w-4 h-4 rounded-full border-2 border-secondary bg-dark group-hover:bg-secondary transition-all duration-300 group-hover:scale-125"></div>

              <div class="glass rounded-2xl p-6 border border-border hover:border-secondary/30 transition-all duration-300">
                <div class="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 class="text-lg font-bold text-white">{edu.degree}</h3>
                    <p class="text-secondary font-medium">{edu.institution}</p>
                    {#if edu.field}<p class="text-slate-500 text-sm">{edu.field}</p>{/if}
                  </div>
                  <span class="text-sm text-slate-500 font-mono">
                    {edu.start_date ?? ''} — {edu.end_date ?? 'Present'}
                  </span>
                </div>
                {#if edu.gpa}
                  <p class="text-sm text-slate-400">GPA: <span class="text-secondary font-semibold">{edu.gpa}</span></p>
                {/if}
                {#if edu.description}
                  <p class="text-slate-400 text-sm leading-relaxed mt-2">{edu.description}</p>
                {/if}
              </div>
            </div>
          {/each}

          {#if education.length === 0}
            <p class="text-slate-500 text-center py-12">No education entries yet.</p>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</section>
