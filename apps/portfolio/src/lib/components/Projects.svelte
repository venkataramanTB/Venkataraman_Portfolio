<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  export let projects = [];

  $: featured = projects.filter(p => p.is_featured);
  $: rest     = projects.filter(p => !p.is_featured);
  $: display  = [...featured, ...rest];

  let labelEl, listEl;
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

      // ── Project rows: clip reveal from left ────────────────────────────────
      if (listEl) {
        listEl.querySelectorAll('.proj-row').forEach((row, i) => {
          gsap.from(row, {
            opacity: 0,
            clipPath: 'inset(0 100% 0 0)',
            duration: 0.7,
            delay: i * 0.05,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 88%' },
          });

          // ── Hover: GSAP instead of CSS transitions ─────────────────────────
          const title = row.querySelector('.proj-title');
          const num   = row.querySelector('.proj-num');
          const links = row.querySelectorAll('.proj-link');

          row.addEventListener('mouseenter', () => {
            gsap.to(title, { color: 'var(--accent)', x: 6, duration: 0.28, ease: 'power2.out' });
            gsap.to(num,   { color: 'var(--accent)', scale: 1.05, duration: 0.28 });
            gsap.from(links, { opacity: 0, y: 6, stagger: 0.04, duration: 0.22, ease: 'power2.out' });
          });
          row.addEventListener('mouseleave', () => {
            gsap.to(title, { color: 'var(--text)', x: 0, duration: 0.28 });
            gsap.to(num,   { color: 'var(--muted)', scale: 1, duration: 0.28 });
          });
        });
      }

    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="projects" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <!-- Section label -->
  <div bind:this={labelEl} class="mb-14">
    <span class="sec-num text-gradient">04 / Projects</span>
  </div>

  {#if display.length}
    <div bind:this={listEl} class="space-y-0">
      {#each display as proj, i}
        <div class="proj-row group py-10 border-b border-[var(--border)]">
          <div class="grid sm:grid-cols-[52px_1fr_auto] gap-6 items-start">

            <!-- Index -->
            <span class="proj-num sec-num pt-1 tabular-nums"
                  style="color: var(--muted)">
              {String(i + 1).padStart(2, '0')}
            </span>

            <!-- Body -->
            <div class="space-y-3 min-w-0">
              <div class="flex flex-wrap items-center gap-3">
                <h3 class="proj-title text-lg font-semibold tracking-tight"
                    style="color: var(--text)">
                  {proj.title}
                </h3>
                {#if proj.is_featured}
                  <span class="sec-num px-2 py-0.5 border border-[var(--accent)] text-[var(--accent)]"
                        style="font-size:0.6rem">Featured</span>
                {/if}
                {#if proj.category}
                  <span class="sec-num">{proj.category}</span>
                {/if}
              </div>

              {#if proj.description}
                <p class="text-sm leading-relaxed" style="color: var(--muted)">{proj.description}</p>
              {/if}

              {#if proj.technologies?.length}
                <div class="flex flex-wrap gap-2 pt-1">
                  {#each proj.technologies.slice(0, 6) as tech}
                    <span class="tag">{tech}</span>
                  {/each}
                  {#if proj.technologies.length > 6}
                    <span class="tag">+{proj.technologies.length - 6}</span>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Links -->
            <div class="flex flex-col gap-2 shrink-0 pt-1">
              {#if proj.demo_url}
                <a href={proj.demo_url} target="_blank" rel="noopener"
                   class="proj-link sec-num hover:text-[var(--accent)] transition-colors duration-200 whitespace-nowrap">
                  Live →
                </a>
              {/if}
              {#if proj.github_url}
                <a href={proj.github_url} target="_blank" rel="noopener"
                   class="proj-link sec-num hover:text-[var(--text)] transition-colors duration-200 whitespace-nowrap">
                  Code →
                </a>
              {/if}
              {#if proj.appstore_url}
                <a href={proj.appstore_url} target="_blank" rel="noopener"
                   class="proj-link sec-num hover:text-[var(--text)] transition-colors duration-200 whitespace-nowrap">
                  App Store →
                </a>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="sec-num">Projects will appear once added via the admin panel.</p>
  {/if}
</section>
