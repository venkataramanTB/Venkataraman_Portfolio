<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import ThemeSwitch from './ThemeSwitch.svelte';
  import Icon from './Icon.svelte';

  export let socialLinks = [];

  const pages = [
    { id: 'index',       label: 'Index',    icon: 'index',    href: '#index'       },
    { id: 'about',       label: 'Abstract', icon: 'about',    href: '#about'       },
    { id: 'work',        label: 'Work',     icon: 'work',     href: '#work'        },
    { id: 'projects',    label: 'Projects', icon: 'projects', href: '#projects'    },
    { id: 'stack',       label: 'Stack',    icon: 'stack',    href: '#stack'       },
    { id: 'recognition', label: 'Record',   icon: 'record',   href: '#recognition' },
    { id: 'contact',     label: 'Contact',  icon: 'contact',  href: '#contact'     },
  ];

  // Brand icon per platform, falling back to a generic link glyph.
  const SOCIAL_ICON = {
    github: 'github',
    linkedin: 'linkedin',
    email: 'mail',
    mail: 'mail',
    twitter: 'link',
    x: 'link',
  };
  const socialIcon = (p) => SOCIAL_ICON[p?.toLowerCase()] ?? 'link';

  let menuOpen = false;
  let active   = 'index';
  let clock    = '--:--:--';
  let barEl, ctx, observer, timer;

  function getSocial(platform) {
    return socialLinks.find((l) => l.platform?.toLowerCase() === platform)?.url ?? null;
  }

  function tick() {
    // UTC readout — telemetry, not decoration: it tells you the page is live.
    clock = new Date().toISOString().slice(11, 19);
  }

  onMount(async () => {
    tick();
    timer = setInterval(tick, 1000);

    // Active-section tracking so the nav always says where you are.
    const targets = pages
      .map((p) => document.getElementById(p.id))
      .filter(Boolean);

    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) active = visible.target.id;
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    targets.forEach((t) => observer.observe(t));

    const g = await useGSAP();
    if (!g) return;
    const { gsap, ScrollTrigger } = g;

    ctx = gsap.context(() => {
      // Scroll-progress rule across the very top of the viewport
      if (barEl) {
        gsap.fromTo(
          barEl,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            transformOrigin: 'left',
            scrollTrigger: {
              trigger: document.documentElement,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.3,
            },
          }
        );
      }
    });

    return () => ScrollTrigger.getAll().forEach((t) => t.kill());
  });

  onDestroy(() => {
    ctx?.revert();
    observer?.disconnect();
    clearInterval(timer);
  });
</script>

<!-- Scroll progress: a hazard rule that fills as you descend -->
<div class="progress" aria-hidden="true">
  <div bind:this={barEl} class="progress-bar"></div>
</div>

<nav class="nav" aria-label="Primary">
  <div class="shell nav-inner">
    <!-- Identity block -->
    <a href="#index" class="ident" aria-label="Venkataraman TB — top of page">
      <img
        src="/logo.png"
        alt=""
        class="ident-mark"
        on:error={(e) => e.currentTarget.remove()}
      />
      <span class="ident-text">
        <span class="ident-name">V.TB</span>
        <span class="ident-meta">REV 3.0</span>
      </span>
    </a>

    <!-- Section index -->
    <ul class="links">
      {#each pages as { id, label, icon, href }}
        <li>
          <a
            {href}
            class="navlink"
            class:is-active={active === id}
            aria-current={active === id ? 'true' : undefined}
            aria-label={label}
            title={label}
          >
            <Icon name={icon} size={17} />
          </a>
        </li>
      {/each}
    </ul>

    <!-- Telemetry + CTA -->
    <div class="tail">
      <span class="clock" aria-hidden="true">{clock} <abbr title="Coordinated Universal Time">UTC</abbr></span>
      {#if getSocial('github')}
        <a href={getSocial('github')} target="_blank" rel="noopener noreferrer"
           class="navlink" aria-label="GitHub" title="GitHub">
          <Icon name="github" size={17} />
        </a>
      {/if}
      {#if getSocial('linkedin')}
        <a href={getSocial('linkedin')} target="_blank" rel="noopener noreferrer"
           class="navlink" aria-label="LinkedIn" title="LinkedIn">
          <Icon name="linkedin" size={17} />
        </a>
      {/if}
      <ThemeSwitch />
      <a href="#contact" class="btn btn-hazard nav-cta" data-press
         aria-label="Get in touch" title="Get in touch">
        <Icon name="contact" size={15} />
      </a>
    </div>

    <!-- Mobile toggle -->
    <button
      class="burger"
      on:click={() => (menuOpen = !menuOpen)}
      aria-expanded={menuOpen}
      aria-controls="nav-sheet"
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
    >
      <Icon name={menuOpen ? 'close' : 'menu'} size={20} />
    </button>
  </div>
</nav>

<!-- Mobile sheet -->
{#if menuOpen}
  <div id="nav-sheet" class="sheet">
    <ol class="sheet-list">
      {#each pages as { label, icon, href }, i}
        <li>
          <a {href} class="sheet-link" on:click={() => (menuOpen = false)}>
            <Icon name={icon} size={18} />
            <span class="sheet-label">{label}</span>
            <Icon name="arrow-right" size={15} />
          </a>
        </li>
      {/each}
    </ol>
    <div class="sheet-theme">
      <ThemeSwitch variant="stack" />
    </div>
    <div class="sheet-foot">
      {#each socialLinks as link}
        <a href={link.url} target="_blank" rel="noopener noreferrer"
           class="sheet-social" aria-label={link.platform} title={link.platform}>
          <Icon name={socialIcon(link.platform)} size={18} />
        </a>
      {/each}
    </div>
  </div>
{/if}

<style>
  .progress {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 2px;
    z-index: var(--z-nav);
    pointer-events: none;
  }
  .progress-bar {
    height: 100%;
    width: 100%;
    background: var(--hazard);
    transform: scaleX(0);
    transform-origin: left;
    will-change: transform;
  }

  .nav {
    position: sticky;
    top: 0;
    z-index: var(--z-nav);
    background: var(--paper);
    border-bottom: 1px solid var(--rule-strong);
  }

  .nav-inner {
    display: flex;
    align-items: stretch;
    justify-content: space-between;
    gap: 1.5rem;
    min-height: 3.25rem;
  }

  /* ─── Identity ─────────────────────────────────────────────────────────── */
  .ident {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    text-decoration: none;
    padding-right: 1.25rem;
    border-right: 1px solid var(--rule);
  }
  /* Below the tab breakpoint the links are hidden, so the brand's right-hand
     rule would fence off an empty box. Drop it and let the bar breathe. */
  @media (max-width: 999px) {
    .ident { border-right: 0; padding-right: 0; }
  }
  .ident-mark {
    height: 18px;
    width: auto;
    object-fit: contain;
    /* Logo is dark artwork, so it must invert on the dark substrate */
    filter: grayscale(1) contrast(1.4) invert(var(--mark-invert));
  }
  .ident-text { display: flex; flex-direction: column; line-height: 1; }
  .ident-name {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 0.9375rem;
    letter-spacing: -0.02em;
    color: var(--ink);
  }
  .ident-meta {
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    letter-spacing: 0.14em;
    color: var(--ink-4);
    margin-top: 2px;
  }

  /* ─── Links ────────────────────────────────────────────────────────────── */
  .links {
    display: none;
    align-items: center;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    flex: 1;
  }
  @media (min-width: 1000px) {
    .links { display: flex; }
  }

  .navlink {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 0.8rem;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ink-3);
    text-decoration: none;
    transition: color 200ms var(--ease-out), background-color 200ms var(--ease-out);
  }
  .navlink:hover { color: var(--ink); background: var(--paper-sunk); }

  /* Current section: hazard underline + ink type. Never ambiguous. */
  .navlink.is-active {
    color: var(--ink);
    box-shadow: inset 0 -2px 0 0 var(--hazard);
  }

  /* ─── Tail ─────────────────────────────────────────────────────────────── */
  .tail {
    display: none;
    align-items: center;
    gap: 0.75rem;
  }
  @media (min-width: 1000px) {
    .tail { display: flex; }
  }

  .clock {
    font-family: var(--font-mono);
    font-size: 0.625rem;
    letter-spacing: 0.08em;
    color: var(--ink-4);
    font-variant-numeric: tabular-nums;
    padding-right: 0.5rem;
    border-right: 1px solid var(--rule);
  }
  .clock abbr { text-decoration: none; }

  .nav-cta {
    gap: 0;
    padding: 0.5rem 0.65rem;
    align-self: center;
  }

  /* ─── Burger ───────────────────────────────────────────────────────────── */
  .burger {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: 0;
    border-left: 1px solid var(--rule);
    padding: 0 0 0 1rem;
    cursor: pointer;
    color: var(--ink);
  }
  @media (min-width: 1000px) {
    .burger { display: none; }
  }


  /* ─── Mobile sheet ─────────────────────────────────────────────────────── */
  .sheet {
    position: sticky;
    top: 3.25rem;
    z-index: var(--z-overlay);
    background: var(--paper);
    border-bottom: 3px solid var(--ink);
  }
  @media (min-width: 1000px) {
    .sheet { display: none; }
  }
  .sheet-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .sheet-link {
    display: grid;
    grid-template-columns: 1.5rem 1fr auto;
    align-items: center;
    gap: 1rem;
    padding: 1rem var(--gutter);
    border-top: 1px solid var(--rule);
    text-decoration: none;
    color: var(--ink);
  }
  .sheet-link:hover { background: var(--paper-sunk); }
  .sheet-label {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.125rem;
    text-transform: uppercase;
    letter-spacing: -0.015em;
  }
  .sheet-theme {
    padding: 0.875rem var(--gutter);
    border-top: 1px solid var(--rule);
  }

  .sheet-foot {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    padding: 1rem var(--gutter);
    border-top: 1px solid var(--rule);
  }
  .sheet-foot a { text-decoration: none; }
  .sheet-foot a:hover { color: var(--hazard); }

  .sheet-social {
    display: inline-flex;
    padding: 0.4rem;
    border: 1px solid var(--rule);
    color: var(--ink-3);
    transition: color 180ms var(--ease-out), border-color 180ms var(--ease-out),
      background-color 180ms var(--ease-out);
  }
  .sheet-social:hover {
    color: var(--paper);
    background: var(--ink);
    border-color: var(--ink);
  }
</style>
