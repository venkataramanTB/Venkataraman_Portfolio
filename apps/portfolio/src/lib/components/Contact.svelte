<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  export let profile     = null;
  export let socialLinks = [];

  let labelEl, headingEl, descEl, emailEl, availEl, linksColEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap, SplitText } = g;

    ctx = gsap.context(() => {

      // ── Section label ──────────────────────────────────────────────────────
      gsap.from(labelEl, {
        opacity: 0, x: -30, duration: 0.6,
        scrollTrigger: { trigger: labelEl, start: 'top 88%' },
      });

      // ── Headline: word-by-word clip reveal ─────────────────────────────────
      if (headingEl) {
        const split = new SplitText(headingEl, { type: 'words' });
        gsap.from(split.words, {
          opacity: 0,
          y: 50,
          rotateX: -25,
          duration: 0.75,
          stagger: 0.09,
          ease: 'power4.out',
          transformOrigin: 'top center',
          scrollTrigger: { trigger: headingEl, start: 'top 82%' },
        });
      }

      // ── Description + email + availability stagger ─────────────────────────
      [descEl, emailEl, availEl].filter(Boolean).forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 22, duration: 0.6,
          delay: i * 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: headingEl, start: 'top 78%' },
        });
      });

      // ── Social links column: stagger from right ────────────────────────────
      if (linksColEl) {
        linksColEl.querySelectorAll('.contact-row').forEach((row, i) => {
          gsap.from(row, {
            opacity: 0, x: 30, duration: 0.55,
            delay: i * 0.07,
            ease: 'power3.out',
            scrollTrigger: { trigger: linksColEl, start: 'top 82%' },
          });
        });
      }

      // ── Email link magnetic pull ───────────────────────────────────────────
      if (emailEl) {
        const inner = emailEl.querySelector('a');
        inner?.addEventListener('mousemove', (e) => {
          const r  = inner.getBoundingClientRect();
          const dx = (e.clientX - r.left - r.width  / 2) * 0.22;
          const dy = (e.clientY - r.top  - r.height / 2) * 0.22;
          gsap.to(inner, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
        });
        inner?.addEventListener('mouseleave', () => {
          gsap.to(inner, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
        });
      }

    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="contact" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <!-- Section label -->
  <div bind:this={labelEl} class="mb-14">
    <span class="sec-num text-gradient">06 / Contact</span>
  </div>

  <div class="grid lg:grid-cols-2 gap-20 items-start">

    <!-- Left: heading + email CTA -->
    <div class="space-y-8">
      <h2 bind:this={headingEl}
          class="text-4xl sm:text-5xl font-bold tracking-tight leading-tight"
          style="color: var(--text)">
        Let's build<br />something great.
      </h2>

      <p bind:this={descEl} class="text-sm leading-relaxed" style="color: var(--muted)">
        Whether it's a job opportunity, a project collaboration,<br class="hidden sm:block" />
        or just a chat about AI — my inbox is always open.
      </p>

      {#if profile?.email}
        <div bind:this={emailEl}>
          <a href="mailto:{profile.email}"
             class="inline-flex items-center gap-3 group"
             style="color: var(--text)">
            <span class="text-lg sm:text-xl font-semibold tracking-tight
                         border-b border-[var(--border)] group-hover:border-[var(--accent)]
                         transition-colors duration-200">
              {profile.email}
            </span>
            <span class="sec-num group-hover:text-[var(--accent)] transition-colors duration-200">↗</span>
          </a>
        </div>
      {/if}

      <div bind:this={availEl} class="inline-flex items-center gap-2 sec-num">
        <span class="w-1.5 h-1.5 rounded-full {profile?.open_to_work !== false ? 'animate-pulse' : ''}"
              style="background: {profile?.open_to_work !== false ? 'var(--accent)' : 'var(--muted)'}"></span>
        {profile?.open_to_work !== false ? 'Open to new opportunities' : 'Currently not available'}
      </div>
    </div>

    <!-- Right: social links -->
    <div bind:this={linksColEl} class="space-y-0">
      {#if profile?.location}
        <div class="contact-row py-5 border-b border-[var(--border)] flex items-center justify-between">
          <span class="sec-num">Location</span>
          <span class="sec-num" style="color: var(--text)">{profile.location}</span>
        </div>
      {/if}

      {#each socialLinks as link}
        <div class="contact-row py-5 border-b border-[var(--border)] flex items-center justify-between group">
          <span class="sec-num">{link.platform}</span>
          <a href={link.url} target="_blank" rel="noopener"
             class="sec-num hover:text-[var(--accent)] transition-colors duration-200">
            {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} →
          </a>
        </div>
      {/each}

      {#if profile?.phone}
        <div class="contact-row py-5 border-b border-[var(--border)] flex items-center justify-between">
          <span class="sec-num">Phone</span>
          <span class="sec-num" style="color: var(--text)">{profile.phone}</span>
        </div>
      {/if}
    </div>
  </div>
</section>
