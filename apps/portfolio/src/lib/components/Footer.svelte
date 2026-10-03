<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import Icon from './Icon.svelte';

  export let profile     = null;
  export let socialLinks = [];

  const year = new Date().getFullYear();

  // First name only, uppercased — the closing structural gesture of the page.
  $: wordmark = (profile?.name ?? 'Venkataraman TB').trim().split(/\s+/)[0].toUpperCase();
  const BUILT = 'SvelteKit · GSAP · FastAPI · Postgres';


  const SOCIAL_ICON = {
    github: 'github', linkedin: 'linkedin', email: 'mail', mail: 'mail',
    twitter: 'link', x: 'link',
  };
  const socialIcon = (p) => SOCIAL_ICON[p?.toLowerCase()] ?? 'link';

  let wordmarkEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      // Oversized wordmark rises as the page bottoms out
      gsap.from(wordmarkEl, {
        yPercent: 22,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: wordmarkEl, start: 'top 95%' },
      });
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<footer class="foot">
  <div class="shell">
    <!-- Viewport-bleeding wordmark: the last structural gesture -->
    <div class="wordmark-clip">
      <!--
        SVG rather than styled text: textLength + lengthAdjust force the
        wordmark to fill the width exactly, so no glyph is ever clipped no
        matter how long the name is. A font-size in vw cannot guarantee that.
      -->
      <svg
        bind:this={wordmarkEl}
        class="wordmark"
        viewBox="0 0 1000 150"
        preserveAspectRatio="xMinYMid meet"
        aria-hidden="true"
        focusable="false"
      >
        <text
          x="0"
          y="118"
          textLength="1000"
          lengthAdjust="spacingAndGlyphs"
          class="wordmark-text"
        >{wordmark}</text>
      </svg>
    </div>

    <hr class="band-rule-heavy" />

    <div class="foot-grid">
      <div class="foot-col">
        <span class="t-micro">&#91; Index &#93;</span>
        <nav class="foot-icons" aria-label="Footer">
          <a href="#index" class="iconlink" aria-label="Top" title="Top">
            <Icon name="arrow-up" size={16} /></a>
          <a href="#work" class="iconlink" aria-label="Work" title="Work">
            <Icon name="work" size={16} /></a>
          <a href="#projects" class="iconlink" aria-label="Projects" title="Projects">
            <Icon name="projects" size={16} /></a>
          <a href="#contact" class="iconlink" aria-label="Contact" title="Contact">
            <Icon name="contact" size={16} /></a>
        </nav>
      </div>

      {#if socialLinks.length}
        <div class="foot-col">
          <span class="t-micro">&#91; Elsewhere &#93;</span>
          <nav class="foot-icons" aria-label="Social links">
            {#each socialLinks as link}
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                 class="iconlink" aria-label={link.platform} title={link.platform}>
                <Icon name={socialIcon(link.platform)} size={16} />
              </a>
            {/each}
          </nav>
        </div>
      {/if}

      <div class="foot-col">
        <span class="t-micro">&#91; Build &#93;</span>
        <p class="t-data foot-build">{BUILT}</p>
      </div>
    </div>

    <hr class="band-rule" />

    <div class="colophon">
      <p class="t-micro">
        &copy; {year} {profile?.name ?? 'Venkataraman TB'}
        <span class="sep" aria-hidden="true">///</span>
        All rights reserved
      </p>
      <p class="t-micro">
        <span class="reg-mark" aria-hidden="true">&reg;</span>
        Doc Rev 3.0
        <span class="sep" aria-hidden="true">///</span>
        Unit D-01
      </p>
    </div>
  </div>
</footer>

<style>
  .foot {
    padding-top: clamp(3rem, 8vh, 5rem);
    padding-bottom: clamp(1.5rem, 4vh, 2.5rem);
    border-top: 1px solid var(--rule);
  }

  .wordmark-clip { overflow: hidden; }
  .wordmark {
    display: block;
    width: 100%;
    height: auto;
    margin: 0 0 0.5rem;
    will-change: transform;
    user-select: none;
  }

  .wordmark-text {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 150px;      /* in viewBox units; textLength does the fitting */
    fill: none;
    stroke: var(--rule-strong);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;   /* hairline stays hairline at any scale */
  }

  .foot-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.75rem;
    padding: 1.75rem 0;
  }
  @media (min-width: 700px) {
    .foot-grid { grid-template-columns: repeat(3, 1fr); }
  }

  .foot-col { display: flex; flex-direction: column; gap: 0.75rem; }

  .foot-icons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
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


  .foot-build { margin: 0; color: var(--ink-3); max-width: 24ch; }

  .colophon {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 1.5rem;
    padding-top: 1rem;
  }
  .colophon p { margin: 0; color: var(--ink-4); }
  .sep { color: var(--hazard); margin: 0 0.3rem; }

  /* Registration mark used as a geometric element, not legal text */
  .reg-mark {
    font-size: 0.8125rem;
    color: var(--ink-3);
    margin-right: 0.15rem;
  }
</style>
