<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import Icon from './Icon.svelte';

  export let profile     = null;
  export let socialLinks = [];

  const DISCIPLINES = [
    { code: 'D-01', name: 'AI Engineering',    note: 'LLM agents · RAG · evals' },
    { code: 'D-02', name: 'Full Stack',        note: 'SvelteKit · FastAPI · Postgres' },
    { code: 'D-03', name: 'iOS Development',   note: 'Swift · SwiftUI · UIKit' },
    { code: 'D-04', name: 'Machine Learning',  note: 'PyTorch · pipelines · serving' },
  ];

  $: fullName = profile?.name ?? 'Venkataraman TB';
  $: nameParts = fullName.trim().split(/\s+/);
  $: line1 = nameParts.slice(0, Math.max(1, nameParts.length - 1)).join(' ');
  $: line2 = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';


  const SOCIAL_ICON = {
    github: 'github', linkedin: 'linkedin', email: 'mail', mail: 'mail',
    twitter: 'link', x: 'link',
  };
  const socialIcon = (p) => SOCIAL_ICON[p?.toLowerCase()] ?? 'link';

  let line1El, line2El, metaEl, specEl, bioEl, linksEl, plateEl, cueEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });

      // Meta strip types in first — the machine booting
      tl.from(metaEl?.children ?? [], {
        opacity: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: 'none',
      });

      // Name: hard mechanical slide from behind the clip edge. No fade, no blur.
      tl.from(
        [line1El, line2El].filter(Boolean),
        {
          yPercent: 108,
          duration: 0.9,
          stagger: 0.08,
          ease: 'expo.out',
        },
        '-=0.1'
      );

      // Spec rows deal out like punch cards
      if (specEl) {
        tl.from(
          specEl.querySelectorAll('.spec'),
          { opacity: 0, x: -24, duration: 0.45, stagger: 0.06, ease: 'power3.out' },
          '-=0.45'
        );
      }

      tl.from([bioEl, linksEl].filter(Boolean), {
        opacity: 0,
        y: 16,
        duration: 0.55,
        stagger: 0.08,
        ease: 'power3.out',
      }, '-=0.3');

      // Photo plate: clipped wipe downward, like a plate being printed
      if (plateEl) {
        tl.from(plateEl, {
          clipPath: 'inset(0 0 100% 0)',
          duration: 1.05,
          ease: 'expo.inOut',
        }, 0.25);
      }

      tl.from(cueEl, { opacity: 0, duration: 0.5 }, '-=0.2');
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="index" class="hero">
  <div class="shell">
    <!-- ── Telemetry strip ──────────────────────────────────────────────── -->
    <div bind:this={metaEl} class="meta">
      <span class="t-micro">Unit / {profile?.location ?? 'Chennai, IN'}</span>
      <span class="meta-sep" aria-hidden="true">///</span>
      <span class="t-micro">Doc / Portfolio</span>
      <span class="meta-sep" aria-hidden="true">///</span>
      <span class="t-micro status">
        <span class="dot" class:dot-live={profile?.open_to_work !== false} aria-hidden="true"></span>
        {profile?.open_to_work !== false ? 'Available for hire' : 'Not available'}
      </span>
    </div>

    <hr class="band-rule-heavy" />

    <!-- ── Macro identity ──────────────────────────────────────────────── -->
    <h1 class="name">
      <span class="clip">
        <span bind:this={line1El} class="t-macro name-line" style="--chars:{line1.length}">{line1}</span>
      </span>
      {#if line2}
        <span class="clip">
          <span bind:this={line2El} class="t-macro name-line name-line-2" style="--chars:{line2.length}">{line2}</span>
        </span>
      {/if}
    </h1>

    <div class="hero-grid">
      <!-- Left: discipline spec table -->
      <div class="col-main">
        <div bind:this={specEl} class="spec-table">
          <div class="spec spec-head">
            <span>Idx</span>
            <span>Discipline</span>
            <span class="spec-note-col">Instrumentation</span>
          </div>
          {#each DISCIPLINES as d}
            <div class="spec">
              <span class="t-idx">{d.code}</span>
              <span class="spec-name">{d.name}</span>
              <span class="spec-note">{d.note}</span>
            </div>
          {/each}
        </div>

        <p bind:this={bioEl} class="t-lead bio">
          {profile?.bio ??
            'I build intelligent systems end to end — LLM-powered agents, ML pipelines, native iOS apps, and the high-throughput backends underneath them.'}
        </p>

        <div bind:this={linksEl} class="links">
          <a href="#projects" class="btn" data-press aria-label="View work" title="View work">
            <Icon name="projects" size={15} />
            <Icon name="arrow-right" size={14} />
          </a>
          {#if profile?.resume_url}
            <a href={profile.resume_url} target="_blank" rel="noopener noreferrer"
               class="btn" data-press aria-label="Download resume" title="Download resume">
              <Icon name="document" size={15} />
              <Icon name="download" size={14} />
            </a>
          {/if}
          <div class="link-list">
            {#each socialLinks as link}
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                 class="iconlink" aria-label={link.platform} title={link.platform}>
                <Icon name={socialIcon(link.platform)} size={17} />
              </a>
            {/each}
            {#if profile?.email && !socialLinks.find((l) => l.platform?.toLowerCase() === 'email')}
              <a href="mailto:{profile.email}" class="iconlink" aria-label="Email" title="Email">
                <Icon name="mail" size={17} />
              </a>
            {/if}
          </div>
        </div>
      </div>

      <!-- Right: print plate -->
      <aside class="col-plate">
        <figure bind:this={plateEl} class="plate-frame">
          <div class="halftone plate-bed">
            <img
              src="/profile_picture.png"
              alt="{fullName}, photographed in black and white"
              class="plate"
              loading="eager"
            />
          </div>
          <figcaption class="plate-cap">
            <span class="t-micro">Fig. 01</span>
            <span class="t-micro">{fullName}</span>
          </figcaption>
        </figure>

        <div class="barcode plate-barcode" aria-hidden="true"></div>
      </aside>
    </div>
  </div>

  <!-- ── Scroll cue ───────────────────────────────────────────────────── -->
  <div bind:this={cueEl} class="cue" aria-hidden="true">
    <Icon name="scroll" size={14} />
    <span class="cue-track"><span class="cue-dash scroll-cue"></span></span>
  </div>
</section>

<style>
  .hero {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-top: clamp(2rem, 6vh, 4rem);
    padding-bottom: clamp(4rem, 10vh, 6rem);
    position: relative;
  }

  /* ─── Telemetry strip ──────────────────────────────────────────────────── */
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.625rem;
    margin-bottom: 0.75rem;
  }
  .meta-sep {
    font-family: var(--font-mono);
    font-size: 0.625rem;
    color: var(--ink-4);
  }
  .status { display: inline-flex; align-items: center; gap: 0.4rem; }
  .dot {
    width: 6px;
    height: 6px;
    background: var(--ink-4);
  }
  .dot-live { background: var(--hazard); }

  /* ─── Macro identity ───────────────────────────────────────────────────── */
  .name {
    margin: clamp(1rem, 3vh, 2rem) 0 clamp(1.5rem, 4vh, 2.75rem);
    /* Lets the macro type size itself against this box rather than the
       viewport, so a long name scales down instead of overflowing. */
    container-type: inline-size;
  }

  /* Size the name from its own character count so it always fits the column.
     0.76 is the measured average advance width of Archivo Black at weight 900
     (measured 0.736 for caps, rounded up for safety margin and letter-spacing).
     A fixed vw size cannot do this: a longer name simply overflows. */
  .name .name-line {
    font-size: min(
      clamp(3.25rem, 11vw, 11rem),
      calc(100cqw / (var(--chars, 12) * 0.76))
    );
  }
  .name-line {
    display: block;
    will-change: transform;
  }
  /* Second line is outlined, not filled — textural contrast against the slab */
  .name-line-2 {
    color: transparent;
    -webkit-text-stroke: 1.5px var(--ink);
    text-stroke: 1.5px var(--ink);
  }

  /* ─── Grid ─────────────────────────────────────────────────────────────── */
  .hero-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: clamp(2rem, 5vw, 3.5rem);
    align-items: start;
  }
  @media (min-width: 960px) {
    .hero-grid { grid-template-columns: minmax(0, 1fr) minmax(240px, 27%); }
  }

  /* ─── Spec table ───────────────────────────────────────────────────────── */
  .spec-table {
    border-top: 1px solid var(--rule-strong);
    margin-bottom: 2rem;
    /* Keep the table to a readable measure: stretched to the full column the
       discipline and instrumentation values drifted far apart. */
    max-width: 46rem;
  }
  .spec {
    display: grid;
    grid-template-columns: 3.5rem minmax(0, 13rem) minmax(0, 1fr);
    gap: 1rem;
    align-items: baseline;
    padding: 0.6875rem 0;
    border-bottom: 1px solid var(--rule);
  }
  .spec-head > span {
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-4);
  }
  .spec-head { padding: 0.375rem 0; }

  .spec-name {
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.9375rem;
    letter-spacing: -0.012em;
    text-transform: uppercase;
    color: var(--ink);
  }
  .spec-note {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.04em;
    color: var(--ink-3);
  }
  @media (max-width: 560px) {
    .spec { grid-template-columns: 3rem minmax(0, 1fr); }
    .spec-note-col { display: none; }
    .spec-note { grid-column: 2; }
  }

  .bio { margin: 0 0 2rem; }

  /* ─── Links ────────────────────────────────────────────────────────────── */
  .links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1rem;
  }
  .link-list {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-left: auto;
  }
  .link-list a { text-decoration: none; }

  /* Square icon cell — same affordance as the nav */
  .iconlink {
    display: inline-flex;
    padding: 0.4rem;
    border: 1px solid var(--rule);
    color: var(--ink-3);
    text-decoration: none;
    transition: color 180ms var(--ease-out), background-color 180ms var(--ease-out),
      border-color 180ms var(--ease-out);
  }
  .iconlink:hover {
    color: var(--paper);
    background: var(--ink);
    border-color: var(--ink);
  }

  @media (max-width: 640px) {
    .link-list { margin-left: 0; width: 100%; }
  }

  /* ─── Print plate ──────────────────────────────────────────────────────── */
  .plate-frame {
    margin: 0;
    border: 1px solid var(--rule-strong);
    padding: 7px;
    background: var(--paper);
    will-change: clip-path;
  }
  .plate-bed {
    aspect-ratio: 3 / 4;
    overflow: hidden;
    background: var(--paper-sunk);
  }
  .plate-bed img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    display: block;
  }
  .plate-cap {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    padding-top: 7px;
    margin-top: 7px;
    border-top: 1px solid var(--rule);
  }
  .plate-barcode {
    height: 22px;
    margin-top: 0.75rem;
    opacity: 0.5;
  }
  @media (max-width: 960px) {
    .col-plate { max-width: 300px; }
  }

  /* ─── Scroll cue ───────────────────────────────────────────────────────── */
  .cue {
    position: absolute;
    bottom: clamp(1.25rem, 4vh, 2.25rem);
    left: var(--gutter);
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .cue-track {
    display: block;
    width: 1px;
    height: 36px;
    background: var(--rule);
    overflow: hidden;
  }
  .cue-dash {
    display: block;
    width: 100%;
    height: 100%;
    background: var(--hazard);
  }
</style>
