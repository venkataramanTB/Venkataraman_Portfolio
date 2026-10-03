<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import BandHead from './BandHead.svelte';
  import Icon from './Icon.svelte';

  export let certificates = [];
  export let achievements = [];

  $: byCategory = certificates.reduce((acc, c) => {
    const key = c.category || 'General';
    (acc[key] ??= []).push(c);
    return acc;
  }, {});

  let achEl, certEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      if (achEl) {
        gsap.from(achEl.querySelectorAll('.ach'), {
          opacity: 0,
          y: 20,
          duration: 0.55,
          stagger: 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: achEl, start: 'top 88%' },
        });
      }

      if (certEl) {
        certEl.querySelectorAll('.cert-group').forEach((group, i) => {
          gsap.from(group.querySelectorAll('.cert'), {
            opacity: 0,
            x: -18,
            duration: 0.45,
            stagger: 0.035,
            ease: 'power3.out',
            scrollTrigger: { trigger: group, start: 'top 90%' },
          });
        });
      }
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="recognition" class="band">
  <div class="shell">
    <BandHead
      index="05"
      title="Record"
      meta="{achievements.length + certificates.length} filed"
    />

    <!-- ── Citations ────────────────────────────────────────────────────── -->
    {#if achievements.length}
      <div class="sub-head">
        <span class="t-micro">&#91; Citations &#93;</span>
        <span class="t-micro count">{achievements.length}</span>
      </div>

      <div bind:this={achEl} class="achs grid-hairline">
        {#each achievements as ach, i}
          <article class="ach">
            <div class="ach-top">
              <span class="t-idx">C-{String(i + 1).padStart(2, '0')}</span>
              {#if ach.date}<span class="t-data ach-date">{ach.date}</span>{/if}
            </div>
            <h3 class="ach-title">{ach.title}</h3>
            {#if ach.description}
              <p class="ach-desc">{ach.description}</p>
            {/if}
            {#if ach.category}
              <span class="tag ach-cat">{ach.category}</span>
            {/if}
          </article>
        {/each}
      </div>
    {/if}

    <!-- ── Certifications ───────────────────────────────────────────────── -->
    {#if certificates.length}
      <div class="sub" class:sub-spaced={achievements.length}>
        <div class="sub-head">
          <span class="t-micro">&#91; Certifications &#93;</span>
          <span class="t-micro count">{certificates.length}</span>
        </div>

        <div bind:this={certEl}>
          {#each Object.entries(byCategory) as [cat, certs]}
            <section class="cert-group">
              <h3 class="cert-cat">
                <span class="cert-cat-rule" aria-hidden="true"></span>
                {cat}
                <span class="t-micro count">{certs.length}</span>
              </h3>

              <div class="cert-list">
                {#each certs as cert}
                  <article class="cert">
                    <span class="cert-title">{cert.title}</span>
                    <span class="cert-issuer t-data">{cert.issuer}</span>
                    <span class="cert-date t-data">{cert.issued_date ?? '—'}</span>
                    <span class="cert-link">
                      {#if cert.credential_url}
                        <a
                          href={cert.credential_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="iconlink"
                          title="Verify credential"
                          aria-label="Verify {cert.title} credential"
                        ><Icon name="verify" size={15} /></a>
                      {:else}
                        <span class="t-micro cert-noverify" aria-hidden="true">&mdash;</span>
                      {/if}
                    </span>
                  </article>
                {/each}
              </div>
            </section>
          {/each}
        </div>
      </div>
    {/if}

    {#if !certificates.length && !achievements.length}
      <div class="empty">
        <span class="t-micro">&#91; No entries filed &#93;</span>
        <p class="t-body empty-copy">
          Citations and certifications are loaded from the admin panel. Verified
          credentials link out to their issuer.
        </p>
        <div class="empty-skel">
          {#each Array(3) as _}
            <div class="skel skel-row"></div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>

<style>
  .sub-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--rule-strong);
    margin-bottom: 1.25rem;
  }
  .count { color: var(--ink-4); }

  .sub-spaced { margin-top: clamp(2.5rem, 6vh, 3.75rem); }

  /* ─── Citations: asymmetric hairline grid (2-up, not 3) ────────────────── */
  .achs {
    grid-template-columns: 1fr;
    border: 1px solid var(--rule);
    margin-bottom: 0.5rem;
  }
  @media (min-width: 820px) {
    .achs { grid-template-columns: repeat(2, 1fr); }
  }

  .ach {
    padding: 1.125rem 1.25rem 1.375rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ach-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--rule);
  }
  .ach-date { color: var(--ink-4); }

  .ach-title {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1rem;
    line-height: 1.15;
    letter-spacing: -0.015em;
    text-transform: uppercase;
    color: var(--ink);
  }

  .ach-desc {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.78125rem;
    line-height: 1.6;
    color: var(--ink-2);
    text-wrap: pretty;
  }

  /* Pin the category tag to the bottom so they align across the row */
  .ach-cat { align-self: flex-start; margin-top: auto; }

  /* ─── Certifications ──────────────────────────────────────────────────── */
  .cert-group { margin-bottom: 1.75rem; }

  .cert-cat {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin: 0 0 0.5rem;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink);
  }
  .cert-cat-rule {
    width: 14px;
    height: 3px;
    background: var(--hazard);
    flex-shrink: 0;
  }

  .cert-list { border-top: 1px solid var(--rule); }

  .cert {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 11rem 6rem 5.5rem;
    gap: 1rem;
    align-items: baseline;
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid var(--rule);
    transition: background-color 220ms var(--ease-out);
  }
  .cert:hover { background: var(--paper-sunk); }

  .cert-title {
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.4;
    color: var(--ink);
  }
  .cert-issuer { color: var(--ink-2); }
  .cert-date   { color: var(--ink-4); }
  .cert-link   { text-align: right; }
  .cert-link { display: flex; justify-content: flex-end; }
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

  .cert-noverify { color: var(--ink-4); }

  @media (max-width: 820px) {
    .cert {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.3rem 1rem;
    }
    .cert-issuer { grid-column: 1; }
    .cert-date   { grid-column: 2; grid-row: 2; text-align: right; }
    .cert-link   { grid-column: 2; grid-row: 1; }
  }

  /* ─── Empty state ──────────────────────────────────────────────────────── */
  .empty { border: 1px solid var(--rule); padding: 1.5rem; }
  .empty-copy { margin: 0.75rem 0 1.25rem; }
  .empty-skel { display: flex; flex-direction: column; gap: 0.5rem; }
  .skel-row { height: 2.25rem; }
  .skel-row:nth-child(2) { width: 84%; }
  .skel-row:nth-child(3) { width: 66%; }
</style>
