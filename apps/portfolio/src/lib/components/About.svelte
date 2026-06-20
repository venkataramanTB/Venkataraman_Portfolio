<script>
  import { reveal } from '$lib/actions/reveal.js';

  export let profile = null;
  export let stats   = [];

  const fallbackStats = [
    { value: '3+',  suffix: '', label: 'Years of experience'  },
    { value: '20+', suffix: '', label: 'Projects shipped'     },
    { value: '4',   suffix: '',  label: 'Domains: AI, Web, iOS, ML' },
    { value: '10+', suffix: '', label: 'Certifications'       },
  ];

  $: displayStats = stats.length ? stats : fallbackStats;
</script>

<section id="about" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <!-- Section label -->
  <div use:reveal class="mb-14">
    <span class="sec-num">01 / About</span>
  </div>

  <div class="grid lg:grid-cols-[1fr_auto] gap-16 lg:gap-24 items-start">

    <!-- Bio -->
    <div class="space-y-6">
      <h2 use:reveal={{ delay: 80 }}
          class="text-3xl sm:text-4xl font-bold leading-snug tracking-tight" style="color: var(--text)">
        {profile?.name ?? 'Venkataraman TB'}
      </h2>

      <p use:reveal={{ delay: 140 }} class="text-base leading-loose" style="color: var(--muted)">
        {profile?.bio ?? 'I architect intelligent systems that span the full stack — from training ML models and shipping LLM-powered agents to building pixel-perfect iOS apps and high-throughput web backends.'}
      </p>

      {#if profile?.location || profile?.email}
        <div use:reveal={{ delay: 220 }} class="flex flex-wrap gap-5 pt-2">
          {#if profile?.location}
            <span class="sec-num">📍 {profile.location}</span>
          {/if}
          {#if profile?.email}
            <a href="mailto:{profile.email}"
               class="sec-num hover:text-[var(--text)] transition-colors duration-200">
              {profile.email}
            </a>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Stats -->
    <div use:reveal={{ delay: 100 }} class="grid grid-cols-2 gap-8 lg:gap-10 shrink-0">
      {#each displayStats.slice(0, 4) as stat}
        <div class="text-right lg:text-left">
          <p class="text-3xl font-bold tracking-tight" style="color: var(--text)">
            {stat.value}{stat.suffix ?? ''}
          </p>
          <p class="sec-num mt-1">{stat.label}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
