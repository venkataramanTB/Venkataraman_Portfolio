<script>
  import BandHead from './BandHead.svelte';

  export let experiences = [];
  export let education   = [];

  function period(start, end, current) {
    const a = start || '';
    if (current) return a ? `${a} — Present` : 'Present';
    if (end) return a ? `${a} — ${end}` : end;
    return a;
  }

  // Entries are deliberately static: the record reads as a document, and
  // staggering every row in was the generic treatment.
</script>

<section id="work" class="band">
  <div class="shell">
    <BandHead
      index="02"
      title="Service Record"
      meta="{experiences.length} {experiences.length === 1 ? 'posting' : 'postings'}"
    />

    {#if experiences.length}
      <div class="log">
        <!-- Column headers: this is a table, so label it like one -->
        <div class="log-head" aria-hidden="true">
          <span>Idx</span>
          <span>Role / Company</span>
          <span>Period</span>
        </div>

        {#each experiences as exp, i}
          <article class="entry">
            <span class="t-idx entry-idx">{String(i + 1).padStart(3, '0')}</span>

            <div class="entry-body">
              <h3 class="entry-title">
                {exp.role}
                {#if exp.is_current}
                  <span class="live">
                    <span class="live-dot blink" aria-hidden="true"></span>Active
                  </span>
                {/if}
              </h3>

              <p class="entry-org">
                {exp.company}{#if exp.location}<span class="entry-loc"> &middot; {exp.location}</span>{/if}
              </p>

              {#if exp.description}
                <p class="entry-desc">{exp.description}</p>
              {/if}

              {#if exp.technologies?.length}
                <ul class="techs">
                  {#each exp.technologies as tech}
                    <li><span class="tag">{tech}</span></li>
                  {/each}
                </ul>
              {/if}
            </div>

            <span class="entry-period t-data">
              {period(exp.start_date, exp.end_date, exp.is_current)}
            </span>
          </article>
        {/each}
      </div>
    {/if}

    {#if education.length}
      <div class="sub">
        <hr class="band-rule" />
        <div class="sub-head">
          <span class="t-micro">&#91; Education &#93;</span>
          <span class="t-micro sub-count">{education.length}</span>
        </div>

        <div class="log">
          {#each education as edu, i}
            <article class="entry">
              <span class="t-idx entry-idx">E-{String(i + 1).padStart(2, '0')}</span>

              <div class="entry-body">
                <h3 class="entry-title">{edu.degree}</h3>
                <p class="entry-org">
                  {edu.institution}{#if edu.field}<span class="entry-loc"> &middot; {edu.field}</span>{/if}
                </p>
                {#if edu.description}
                  <p class="entry-desc">{edu.description}</p>
                {/if}
                {#if edu.gpa}
                  <p class="t-data gpa">GPA <strong>{edu.gpa}</strong></p>
                {/if}
              </div>

              <span class="entry-period t-data">
                {period(edu.start_date, edu.end_date, false)}
              </span>
            </article>
          {/each}
        </div>
      </div>
    {/if}

    {#if !experiences.length && !education.length}
      <!-- Composed empty state, not a bare sentence -->
      <div class="empty">
        <span class="t-micro">&#91; No records on file &#93;</span>
        <p class="t-body empty-copy">
          Service history is loaded from the admin panel. Once postings are added they
          appear here as dated entries.
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
  .log { border-top: 1px solid var(--rule-strong); }

  .log-head {
    display: grid;
    grid-template-columns: 4rem minmax(0, 1fr) 9.5rem;
    gap: 1.25rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--rule);
  }
  .log-head > span {
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-4);
  }
  .log-head > span:last-child { text-align: right; }

  /* ─── Entry ────────────────────────────────────────────────────────────── */
  .entry {
    display: grid;
    grid-template-columns: 4rem minmax(0, 1fr) 9.5rem;
    gap: 1.25rem;
    align-items: start;
    padding: 1.5rem 0.5rem 1.625rem 0.5rem;
    border-bottom: 1px solid var(--rule);
    position: relative;
    transition: background-color 240ms var(--ease-out);
  }
  .entry::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--hazard);
    transform: scaleY(0);
    transform-origin: top;
    transition: transform 280ms var(--ease-mech);
  }
  .entry:hover { background: var(--paper-sunk); }
  .entry:hover::before { transform: scaleY(1); }
  .entry:hover .entry-idx { color: var(--hazard); }

  .entry-idx { padding-top: 0.25rem; transition: color 240ms var(--ease-out); }

  .entry-title {
    margin: 0 0 0.3rem;
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(1rem, 1.9vw, 1.1875rem);
    line-height: 1.12;
    letter-spacing: -0.018em;
    text-transform: uppercase;
    color: var(--ink);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.625rem;
  }

  .live {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 2px 6px;
    background: var(--hazard);
    color: var(--paper);
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .live-dot {
    width: 5px;
    height: 5px;
    background: var(--paper);
  }

  .entry-org {
    margin: 0 0 0.625rem;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0.03em;
    color: var(--ink);
  }
  .entry-loc { color: var(--ink-4); font-weight: 400; }

  .entry-desc {
    margin: 0 0 0.75rem;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.65;
    color: var(--ink-2);
    max-width: 68ch;
    text-wrap: pretty;
  }

  .techs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .entry-period {
    text-align: right;
    padding-top: 0.3rem;
    color: var(--ink-3);
    white-space: nowrap;
  }

  .gpa { margin: 0; color: var(--ink-3); }
  .gpa strong { color: var(--ink); }

  @media (max-width: 760px) {
    .log-head { display: none; }
    .entry {
      grid-template-columns: 3.25rem minmax(0, 1fr);
      gap: 0.75rem 1rem;
    }
    .entry-period {
      grid-column: 2;
      grid-row: 2;
      text-align: left;
      padding-top: 0;
    }
    .entry-body { grid-column: 2; grid-row: 1; }
  }

  /* ─── Education sub-band ───────────────────────────────────────────────── */
  .sub { margin-top: clamp(2.5rem, 6vh, 4rem); }
  .sub-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 0 0.75rem;
  }
  .sub-count { color: var(--ink-4); }

  /* ─── Empty state ──────────────────────────────────────────────────────── */
  .empty {
    border: 1px solid var(--rule);
    padding: 1.5rem;
  }
  .empty-copy { margin: 0.75rem 0 1.25rem; }
  .empty-skel { display: flex; flex-direction: column; gap: 0.5rem; }
  .skel-row { height: 2.25rem; }
  .skel-row:nth-child(2) { width: 82%; }
  .skel-row:nth-child(3) { width: 64%; }
</style>
