<script>
  import { onMount, onDestroy } from 'svelte';
  import { reveal } from '$lib/actions/reveal.js';
  import { useGSAP } from '$lib/gsap.js';

  export let skills = [];

  const fallbackSkills = [
    { name: 'Python' }, { name: 'React' }, { name: 'FastAPI' },
    { name: 'SwiftUI' }, { name: 'TensorFlow' }, { name: 'PostgreSQL' },
    { name: 'Docker' }, { name: 'TypeScript' }, { name: 'Svelte' },
    { name: 'Gemini AI' }, { name: 'GSAP' }, { name: 'Three.js' },
    { name: 'Next.js' }, { name: 'Kubernetes' }, { name: 'LangChain' },
  ];

  $: displaySkills = skills.length ? skills : fallbackSkills;

  $: grouped = skills.reduce((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});
  $: categories = Object.keys(grouped);

  let marqueeTrack, labelEl, gridEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {

      // ── Section label ──────────────────────────────────────────────────────
      gsap.from(labelEl, {
        opacity: 0, x: -30, duration: 0.6,
        scrollTrigger: { trigger: labelEl, start: 'top 88%' },
      });

      // ── Infinite marquee ───────────────────────────────────────────────────
      if (marqueeTrack) {
        // Wait one frame so clientWidth is settled
        requestAnimationFrame(() => {
          const halfW = marqueeTrack.scrollWidth / 2;
          gsap.to(marqueeTrack, {
            x: -halfW,
            ease: 'none',
            duration: Math.max(18, displaySkills.length * 1.8),
            repeat: -1,
          });
        });
      }

      // ── Category rows stagger in ───────────────────────────────────────────
      if (gridEl) {
        const rows = gridEl.querySelectorAll('.skill-row');
        rows.forEach((row, i) => {
          gsap.from(row, {
            opacity: 0, x: -40, duration: 0.6,
            delay: i * 0.07,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 88%' },
          });

          // Tags burst in with stagger
          const tags = row.querySelectorAll('.tag');
          gsap.from(tags, {
            opacity: 0, scale: 0.8, y: 10,
            duration: 0.4,
            stagger: 0.04,
            ease: 'back.out(1.4)',
            delay: i * 0.07 + 0.15,
            scrollTrigger: { trigger: row, start: 'top 88%' },
          });
        });
      }

    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="skills" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <!-- Section label -->
  <div bind:this={labelEl} class="mb-14">
    <span class="sec-num text-gradient">02 / Skills</span>
  </div>

  <!-- ── Infinite marquee strip ────────────────────────────────────────────── -->
  <div class="marquee-outer mb-16 py-3 border-y border-[var(--border)]">
    <div bind:this={marqueeTrack} class="marquee-track">
      {#each [...displaySkills, ...displaySkills] as skill}
        <span class="sec-num whitespace-nowrap" style="color: var(--muted)">
          {skill.name}
        </span>
        <span class="sec-num" style="color: var(--border)">·</span>
      {/each}
    </div>
  </div>

  <!-- ── Categorised grid ───────────────────────────────────────────────────── -->
  {#if categories.length}
    <div bind:this={gridEl} class="space-y-10">
      {#each categories as cat}
        <div class="skill-row grid sm:grid-cols-[160px_1fr] gap-4 sm:gap-8 items-start">
          <span class="sec-num pt-1 shrink-0">{cat}</span>
          <div class="flex flex-wrap gap-2">
            {#each grouped[cat] as skill}
              <span class="tag">{skill.name}</span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="sec-num">Skills will appear once added via the admin panel.</p>
  {/if}
</section>
