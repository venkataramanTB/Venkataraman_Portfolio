<script>
  import { onMount, onDestroy } from 'svelte';
  import { reveal } from '$lib/actions/reveal.js';
  import { useGSAP } from '$lib/gsap.js';

  export let experiences = [];
  export let education   = [];

  let labelEl, timelineEl, lineEl, eduLabelEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap, ScrollTrigger } = g;

    ctx = gsap.context(() => {

      // ── Section label ──────────────────────────────────────────────────────
      gsap.from(labelEl, {
        opacity: 0, x: -30, duration: 0.6,
        scrollTrigger: { trigger: labelEl, start: 'top 88%' },
      });

      // ── Vertical timeline line scrubs with scroll ──────────────────────────
      if (lineEl && timelineEl) {
        gsap.fromTo(lineEl,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            transformOrigin: 'top',
            scrollTrigger: {
              trigger: timelineEl,
              start: 'top 70%',
              end:   'bottom 40%',
              scrub: 1.2,
            },
          }
        );
      }

      // ── Experience entries slide in ────────────────────────────────────────
      if (timelineEl) {
        timelineEl.querySelectorAll('.exp-entry').forEach((entry, i) => {
          gsap.from(entry, {
            opacity: 0, x: 40, duration: 0.65,
            ease: 'power3.out',
            scrollTrigger: { trigger: entry, start: 'top 86%' },
          });

          // Tech tags burst in after entry appears
          entry.querySelectorAll('.tag').forEach((tag, j) => {
            gsap.from(tag, {
              opacity: 0, scale: 0.75, duration: 0.35,
              delay: j * 0.04,
              ease: 'back.out(1.6)',
              scrollTrigger: { trigger: entry, start: 'top 84%' },
            });
          });
        });
      }

      // ── Education entries ──────────────────────────────────────────────────
      document.querySelectorAll('.edu-entry').forEach(entry => {
        gsap.from(entry, {
          opacity: 0, x: 40, duration: 0.6,
          ease: 'power3.out',
          scrollTrigger: { trigger: entry, start: 'top 86%' },
        });
      });

    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="work" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <!-- Section label -->
  <div bind:this={labelEl} class="mb-14">
    <span class="sec-num text-gradient">03 / Work</span>
  </div>

  <!-- Work experience -->
  {#if experiences.length}
    <div bind:this={timelineEl} class="relative mb-24">

      <!-- Animated timeline line -->
      <div bind:this={lineEl}
           class="absolute left-0 top-0 w-px origin-top"
           style="height: 100%; background: linear-gradient(to bottom, var(--accent), var(--accent2)); opacity: 0.5; transform: scaleY(0)">
      </div>

      <div class="space-y-0 pl-0">
        {#each experiences as exp, i}
          <div class="exp-entry grid sm:grid-cols-[52px_1fr] gap-6 py-10 border-b border-[var(--border)]">

            <!-- Index -->
            <span class="sec-num pt-1 tabular-nums text-gradient">
              {String(i + 1).padStart(2, '0')}
            </span>

            <!-- Content -->
            <div class="space-y-3">
              <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 class="text-lg font-semibold tracking-tight" style="color: var(--text)">
                  {exp.role}
                  <span class="font-normal ml-2" style="color: var(--muted)">@ {exp.company}</span>
                </h3>
                <span class="sec-num tabular-nums shrink-0">
                  {exp.start_date ?? ''}{exp.end_date || exp.is_current ? ` — ${exp.is_current ? 'Present' : exp.end_date}` : ''}
                </span>
              </div>

              {#if exp.location}
                <p class="sec-num">{exp.location}</p>
              {/if}

              {#if exp.description}
                <p class="text-sm leading-relaxed" style="color: var(--muted)">{exp.description}</p>
              {/if}

              {#if exp.technologies?.length}
                <div class="flex flex-wrap gap-2 pt-1">
                  {#each exp.technologies as tech}
                    <span class="tag">{tech}</span>
                  {/each}
                </div>
              {/if}

              {#if exp.is_current}
                <span class="inline-flex items-center gap-1.5 sec-num" style="color: var(--accent)">
                  <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: var(--accent)"></span>
                  Current
                </span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Education -->
  {#if education.length}
    <div bind:this={eduLabelEl} use:reveal class="mb-10">
      <span class="sec-num">Education</span>
    </div>

    <div class="space-y-0">
      {#each education as edu, i}
        <div class="edu-entry grid sm:grid-cols-[52px_1fr] gap-6 py-10 border-b border-[var(--border)]">
          <span class="sec-num pt-1 tabular-nums text-gradient">{String(i + 1).padStart(2, '0')}</span>

          <div class="space-y-2">
            <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 class="text-lg font-semibold tracking-tight" style="color: var(--text)">
                {edu.degree}
                <span class="font-normal ml-2" style="color: var(--muted)">@ {edu.institution}</span>
              </h3>
              <span class="sec-num tabular-nums shrink-0">
                {edu.start_date ?? ''}{edu.end_date ? ` — ${edu.end_date}` : ''}
              </span>
            </div>
            {#if edu.field}<p class="sec-num">{edu.field}</p>{/if}
            {#if edu.gpa}<p class="sec-num">GPA: {edu.gpa}</p>{/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if !experiences.length && !education.length}
    <p class="sec-num">Experience entries will appear once added via the admin panel.</p>
  {/if}
</section>
