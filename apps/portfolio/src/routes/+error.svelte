<script>
  import { page } from '$app/stores';
  import Icon from '$lib/components/Icon.svelte';

  // Direct, active-voice copy per status. No "Oops!", no exclamation marks.
  const COPY = {
    404: {
      code: '404',
      label: 'Not on file',
      body: 'That address does not match any page in this document. It may have been renumbered, or the link may be mistyped.',
    },
    503: {
      code: '503',
      label: 'Source unavailable',
      body: 'The data service did not respond. It sleeps when idle and takes up to 30 seconds to wake — reloading usually clears it.',
    },
  };

  $: status = $page.status;
  $: copy =
    COPY[status] ?? {
      code: String(status ?? '500'),
      label: 'Fault',
      body: $page.error?.message || 'Something failed on our side while building this page.',
    };
</script>

<svelte:head>
  <title>{copy.code} — {copy.label}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main id="main" class="err">
  <div class="shell err-inner">
    <div class="err-meta">
      <span class="t-micro">&#91; Fault report &#93;</span>
      <span class="t-micro err-unit">Unit D-01</span>
    </div>

    <hr class="band-rule-heavy" />

    <p class="err-code">{copy.code}</p>

    <h1 class="err-label">{copy.label}</h1>

    <p class="t-lead err-body">{copy.body}</p>

    <div class="err-actions">
      <a href="/" class="btn btn-hazard" data-press
         aria-label="Return to index" title="Return to index">
        <Icon name="index" size={15} />
        <Icon name="arrow-right" size={14} />
      </a>
      <a href="/#projects" class="btn" data-press
         aria-label="Browse builds" title="Browse builds">
        <Icon name="projects" size={15} />
        <Icon name="arrow-right" size={14} />
      </a>
      {#if status === 503}
        <button class="btn" on:click={() => location.reload()} data-press
                aria-label="Retry" title="Retry">
          <Icon name="retry" size={15} />
        </button>
      {/if}
    </div>

    <div class="hazard-stripes err-stripe" aria-hidden="true"></div>
  </div>
</main>

<style>
  .err {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: clamp(2rem, 8vh, 5rem) 0;
  }

  .err-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    padding-bottom: 0.625rem;
  }
  .err-unit { color: var(--ink-4); }

  /* The status code is the macro-typographic subject of the page */
  .err-code {
    margin: clamp(1.25rem, 4vh, 2.25rem) 0 0;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: clamp(5rem, 26vw, 20rem);
    line-height: 0.78;
    letter-spacing: -0.06em;
    color: transparent;
    -webkit-text-stroke: 2px var(--ink);
    text-stroke: 2px var(--ink);
    user-select: none;
  }

  .err-label {
    margin: clamp(1rem, 3vh, 1.75rem) 0 0.875rem;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: clamp(1.5rem, 4.5vw, 2.75rem);
    line-height: 0.95;
    letter-spacing: -0.03em;
    text-transform: uppercase;
    color: var(--ink);
  }

  .err-body { margin: 0 0 2rem; }

  .err-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .err-stripe {
    height: 10px;
    opacity: 0.16;
    margin-top: clamp(2rem, 6vh, 3.5rem);
  }
</style>
