<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import Footer from '$lib/components/Footer.svelte';
  import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
  import Icon from '$lib/components/Icon.svelte';

  export let data;

  $: ({ project, index, total, prev, next, profile, socialLinks } = data);

  let titleEl, bodyEl, specEl, shotEl;
  let ctx;

  // Only build the external-links table from URLs that actually exist.
  $: externals = [
    project.demo_url     && { label: 'Live deployment',   icon: 'site',     url: project.demo_url },
    project.github_url   && { label: 'Source repository', icon: 'github',   url: project.github_url },
    project.appstore_url && { label: 'App Store listing', icon: 'external', url: project.appstore_url },
  ].filter(Boolean);

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap, SplitText } = g;

    ctx = gsap.context(() => {
      const tl = gsap.timeline();

      if (titleEl) {
        const split = new SplitText(titleEl, { type: 'lines', linesClass: 'clip-line' });
        tl.from(split.lines, {
          yPercent: 108,
          duration: 0.85,
          stagger: 0.07,
          ease: 'expo.out',
        });
      }

      if (specEl) {
        tl.from(specEl.querySelectorAll('.srow'), {
          opacity: 0,
          x: -20,
          duration: 0.45,
          stagger: 0.05,
          ease: 'power3.out',
        }, '-=0.4');
      }

      if (shotEl) {
        tl.from(shotEl, {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.9,
          ease: 'expo.inOut',
        }, 0.2);
      }

      if (bodyEl) {
        tl.from(bodyEl.children, {
          opacity: 0,
          y: 18,
          duration: 0.5,
          stagger: 0.06,
          ease: 'power3.out',
        }, '-=0.35');
      }
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<svelte:head>
  <title>{project.title} — Case file / {profile?.name ?? 'Venkataraman TB'}</title>
  <meta name="description" content={project.description ?? `Case file for ${project.title}.`} />
  <meta property="og:type"        content="article" />
  <meta property="og:title"       content="{project.title} — Case file" />
  <meta property="og:description" content={project.description ?? `Case file for ${project.title}.`} />
  {#if project.thumbnail_url}
    <meta property="og:image" content={project.thumbnail_url} />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<!-- Minimal nav: this page's job is to get you back to the index -->
<nav class="bar" aria-label="Breadcrumb">
  <div class="shell bar-inner">
    <a href="/" class="iconlink bar-home" aria-label="Back to index" title="Back to index">
      <Icon name="arrow-left" size={16} />
    </a>
    <span class="t-micro bar-crumb">
      Build {String(index).padStart(3, '0')} / {String(total).padStart(3, '0')}
    </span>
    <ThemeSwitch />
  </div>
</nav>

<main id="main" class="case">
  <div class="shell">
    <!-- ── Masthead ─────────────────────────────────────────────────────── -->
    <header class="masthead">
      <div class="mast-meta">
        <span class="t-micro">&#91; Case file &#93;</span>
        {#if project.category}
          <span class="t-micro mast-cat">{project.category}</span>
        {/if}
        {#if project.is_featured}
          <span class="flag">Key build</span>
        {/if}
      </div>

      <hr class="band-rule-heavy" />

      <h1 class="clip-wrap">
        <span bind:this={titleEl} class="t-macro case-title">{project.title}</span>
      </h1>

      {#if project.description}
        <p class="t-lead case-sub">{project.description}</p>
      {/if}
    </header>

    <!-- ── Plate ────────────────────────────────────────────────────────── -->
    {#if project.thumbnail_url}
      <figure bind:this={shotEl} class="shot">
        <div class="halftone shot-bed">
          <img src={project.thumbnail_url} alt="Interface of {project.title}" loading="lazy" />
        </div>
        <figcaption class="shot-cap">
          <span class="t-micro">Fig. 01</span>
          <span class="t-micro">{project.title}</span>
        </figcaption>
      </figure>
    {/if}

    <!-- ── Body ─────────────────────────────────────────────────────────── -->
    <div class="case-grid">
      <div bind:this={bodyEl} class="case-main">
        {#if project.long_description}
          <div class="sub-head"><span class="t-micro">&#91; Notes &#93;</span></div>
          {#each project.long_description.split(/\n{2,}/) as para}
            {#if para.trim()}
              <p class="t-body case-para">{para.trim()}</p>
            {/if}
          {/each}
        {:else}
          <div class="sub-head"><span class="t-micro">&#91; Notes &#93;</span></div>
          <p class="t-body case-para">
            Detailed notes for this build have not been filed yet. The specification
            opposite lists what it was made of and where it runs.
          </p>
        {/if}

        {#if externals.length}
          <div class="sub-head links-head"><span class="t-micro">&#91; Access &#93;</span></div>
          <div class="ext">
            {#each externals as link}
              <a href={link.url} target="_blank" rel="noopener noreferrer" class="ext-row">
                <span class="ext-ico"><Icon name={link.icon} size={16} /></span>
                <span class="ext-url">{link.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}</span>
                <span class="ext-arrow"><Icon name="external" size={15} /></span>
              </a>
            {/each}
          </div>
        {/if}
      </div>

      <!-- ── Specification ─────────────────────────────────────────────── -->
      <aside bind:this={specEl} class="case-aside">
        <div class="sub-head"><span class="t-micro">&#91; Specification &#93;</span></div>

        <dl class="spec">
          <div class="srow">
            <dt class="t-micro">Unit</dt>
            <dd class="t-data">B-{String(index).padStart(3, '0')}</dd>
          </div>
          {#if project.category}
            <div class="srow">
              <dt class="t-micro">Class</dt>
              <dd class="t-data">{project.category}</dd>
            </div>
          {/if}
          {#if project.created_at}
            <div class="srow">
              <dt class="t-micro">Filed</dt>
              <dd class="t-data">{new Date(project.created_at).toISOString().slice(0, 10)}</dd>
            </div>
          {/if}
          <div class="srow">
            <dt class="t-micro">Status</dt>
            <dd class="t-data">{project.demo_url ? 'Deployed' : 'Archived'}</dd>
          </div>
        </dl>

        {#if project.technologies?.length}
          <div class="sub-head tech-head">
            <span class="t-micro">&#91; Materials &#93;</span>
            <span class="t-micro tech-count">{project.technologies.length}</span>
          </div>
          <ul class="techs">
            {#each project.technologies as tech}
              <li><span class="tag">{tech}</span></li>
            {/each}
          </ul>
        {/if}

        <div class="barcode aside-barcode" aria-hidden="true"></div>
      </aside>
    </div>

    <!-- ── Prev / next ──────────────────────────────────────────────────── -->
    <nav class="pager" aria-label="Other builds">
      <hr class="band-rule" />
      <div class="pager-row">
        {#if prev}
          <a href="/work/{prev.id}" class="pg pg-prev">
            <Icon name="arrow-left" size={15} />
            <span class="pg-title">{prev.title}</span>
          </a>
        {:else}
          <span class="pg pg-dead" aria-hidden="true"></span>
        {/if}

        {#if next}
          <a href="/work/{next.id}" class="pg pg-next">
            <Icon name="arrow-right" size={15} />
            <span class="pg-title">{next.title}</span>
          </a>
        {:else}
          <span class="pg pg-dead" aria-hidden="true"></span>
        {/if}
      </div>
    </nav>

    <!-- Always a way back -->
    <div class="back">
      <a href="/#projects" class="btn" data-press aria-label="All builds" title="All builds">
        <Icon name="projects" size={15} />
        <Icon name="arrow-right" size={14} />
      </a>
    </div>
  </div>
</main>

<Footer {profile} {socialLinks} />

<style>
  .bar {
    position: sticky;
    top: 0;
    z-index: var(--z-nav);
    background: var(--paper);
    border-bottom: 1px solid var(--rule-strong);
  }
  .bar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 2.75rem;
  }

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

  .bar-crumb { color: var(--ink-4); margin-left: auto; margin-right: 1rem; }

  @media (max-width: 560px) {
    .bar-crumb { display: none; }
  }

  .case {
    padding-top: clamp(2rem, 6vh, 3.5rem);
    padding-bottom: clamp(3rem, 8vh, 5rem);
  }

  /* ─── Masthead ─────────────────────────────────────────────────────────── */
  .masthead { margin-bottom: clamp(2rem, 5vh, 3rem); }

  .mast-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.625rem;
  }
  .mast-cat { color: var(--ink); }

  .flag {
    padding: 2px 6px;
    border: 1px solid var(--hazard);
    color: var(--hazard);
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .clip-wrap { margin: clamp(1rem, 3vh, 1.75rem) 0 1.25rem; }
  .clip-wrap :global(.clip-line) { overflow: hidden; }
  .case-title { display: block; font-size: clamp(2.25rem, 8vw, 6.5rem); }

  .case-sub { margin: 0; }

  /* ─── Plate ────────────────────────────────────────────────────────────── */
  .shot {
    margin: 0 0 clamp(2rem, 5vh, 3rem);
    border: 1px solid var(--rule-strong);
    padding: 8px;
    will-change: clip-path;
  }
  .shot-bed {
    background: var(--paper-sunk);
    overflow: hidden;
    aspect-ratio: 16 / 9;
  }
  .shot-bed img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    filter: var(--plate-filter);
    mix-blend-mode: var(--plate-blend);
  }
  .shot-cap {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 8px;
    margin-top: 8px;
    border-top: 1px solid var(--rule);
  }

  /* ─── Grid ─────────────────────────────────────────────────────────────── */
  .case-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: clamp(2rem, 5vw, 4rem);
    align-items: start;
  }
  @media (min-width: 900px) {
    .case-grid { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); }
  }

  .sub-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.625rem;
    border-bottom: 1px solid var(--rule-strong);
    margin-bottom: 1rem;
  }
  .links-head, .tech-head { margin-top: 2rem; }
  .tech-count { color: var(--ink-4); }

  .case-para { margin: 0 0 1rem; }

  /* ─── External links ───────────────────────────────────────────────────── */
  .ext { border-top: 1px solid var(--rule); }
  .ext-row {
    display: grid;
    grid-template-columns: 1.5rem minmax(0, 1fr) 1.5rem;
    gap: 1rem;
    align-items: baseline;
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid var(--rule);
    text-decoration: none;
    transition: background-color 220ms var(--ease-out);
  }
  .ext-row:hover { background: var(--paper-sunk); }

  .ext-ico { color: var(--ink-3); }
  .ext-row:hover .ext-ico { color: var(--hazard); }
  .ext-url {
    font-family: var(--font-mono);
    font-size: 0.71875rem;
    color: var(--ink-3);
    word-break: break-all;
  }
  .ext-arrow { display: flex; justify-content: flex-end; color: var(--ink-4); }

  @media (max-width: 620px) {
    .ext-row { grid-template-columns: 1.5rem minmax(0, 1fr); }
    .ext-arrow { display: none; }
  }

  /* ─── Specification ────────────────────────────────────────────────────── */
  .spec { margin: 0; }
  .srow {
    display: grid;
    grid-template-columns: 4.5rem minmax(0, 1fr);
    gap: 1rem;
    align-items: baseline;
    padding: 0.5625rem 0;
    border-bottom: 1px solid var(--rule);
  }
  .srow dt { margin: 0; }
  .srow dd { margin: 0; color: var(--ink); }

  .techs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .aside-barcode { height: 20px; margin-top: 1.5rem; opacity: 0.45; }

  /* ─── Pager ────────────────────────────────────────────────────────────── */
  .pager { margin-top: clamp(2.5rem, 6vh, 4rem); }
  .pager-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--rule);
  }
  .pg {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 1.125rem 1rem;
    background: var(--paper);
    text-decoration: none;
    transition: background-color 220ms var(--ease-out);
  }
  .pg:hover { background: var(--paper-sunk); }
  .pg:hover .pg-title { color: var(--hazard); }
  .pg-next { text-align: right; align-items: flex-end; }
  .pg-dead { background: var(--paper); }
  .pg-title {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.9375rem;
    line-height: 1.15;
    letter-spacing: -0.015em;
    text-transform: uppercase;
    color: var(--ink);
    transition: color 220ms var(--ease-out);
  }

  .back { padding-top: 1.75rem; }
</style>
