<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  export let certificates = [];
  export let achievements = [];

  $: certsByCategory = certificates.reduce((acc, c) => {
    const cat = c.category || 'Other';
    (acc[cat] ??= []).push(c);
    return acc;
  }, {});

  let labelEl, achListEl, certSectionEl;
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

      // ── Achievements: slide in from right ──────────────────────────────────
      if (achListEl) {
        achListEl.querySelectorAll('.ach-entry').forEach((el, i) => {
          gsap.from(el, {
            opacity: 0, x: 36, duration: 0.6,
            delay: i * 0.06,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 87%' },
          });
        });
      }

      // ── Certificate rows: stagger fade-up ────────────────────────────────
      if (certSectionEl) {
        certSectionEl.querySelectorAll('.cert-group').forEach((group, gi) => {
          gsap.from(group.querySelector('.cert-cat-label'), {
            opacity: 0, y: 16, duration: 0.5,
            scrollTrigger: { trigger: group, start: 'top 88%' },
          });

          group.querySelectorAll('.cert-row').forEach((row, ri) => {
            gsap.from(row, {
              opacity: 0, y: 14, duration: 0.45,
              delay: ri * 0.05,
              ease: 'power3.out',
              scrollTrigger: { trigger: group, start: 'top 85%' },
            });
          });
        });
      }

    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="recognition" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <!-- Section label -->
  <div bind:this={labelEl} class="mb-14">
    <span class="sec-num text-gradient">05 / Recognition</span>
  </div>

  <!-- Achievements -->
  {#if achievements.length}
    <div bind:this={achListEl} class="mb-20 space-y-0">
      {#each achievements as ach, i}
        <div class="ach-entry grid sm:grid-cols-[52px_1fr] gap-6 py-8 border-b border-[var(--border)]">
          <span class="sec-num pt-1 tabular-nums text-gradient">{String(i + 1).padStart(2, '0')}</span>
          <div class="space-y-2">
            <div class="flex items-baseline gap-3">
              {#if ach.icon}<span class="text-lg">{ach.icon}</span>{/if}
              <h3 class="text-base font-semibold tracking-tight" style="color: var(--text)">{ach.title}</h3>
              {#if ach.date}<span class="sec-num ml-auto shrink-0">{ach.date}</span>{/if}
            </div>
            {#if ach.description}
              <p class="text-sm leading-relaxed" style="color: var(--muted)">{ach.description}</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Certificates -->
  {#if certificates.length}
    <div class="mb-10">
      <span class="sec-num">Certifications</span>
    </div>

    <div bind:this={certSectionEl} class="space-y-10">
      {#each Object.entries(certsByCategory) as [cat, certs]}
        <div class="cert-group">
          <p class="cert-cat-label sec-num mb-5">{cat}</p>
          <div class="space-y-0">
            {#each certs as cert}
              <div class="cert-row flex items-baseline justify-between gap-6 py-4 border-b border-[var(--border)] group">
                <p class="text-sm font-medium leading-snug group-hover:text-[var(--text)] transition-colors duration-200"
                   style="color: var(--muted)">
                  {cert.title}
                </p>
                <div class="flex items-center gap-6 shrink-0">
                  <span class="sec-num">{cert.issuer}</span>
                  {#if cert.issued_date}
                    <span class="sec-num tabular-nums">{cert.issued_date}</span>
                  {/if}
                  {#if cert.credential_url}
                    <a href={cert.credential_url} target="_blank" rel="noopener"
                       class="sec-num hover:text-[var(--accent)] transition-colors duration-200">↗</a>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if !certificates.length && !achievements.length}
    <p class="sec-num">Recognition will appear once added via the admin panel.</p>
  {/if}
</section>
