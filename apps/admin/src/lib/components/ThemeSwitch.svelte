<script>
  import { theme, setTheme } from '$lib/theme.js';

  /** 'bar' sits inline in the navbar; 'stack' is for the mobile sheet. */
  export let variant = 'bar';

  // Three explicit states instead of a sun/moon toggle: following the OS is a
  // real, distinct choice and a two-state switch cannot express it.
  const OPTIONS = [
    { value: 'auto',  label: 'Auto',  hint: 'Follow system setting' },
    { value: 'light', label: 'Light', hint: 'Paper substrate' },
    { value: 'dark',  label: 'Dark',  hint: 'Terminal substrate' },
  ];
</script>

<div
  class="switch"
  class:is-stack={variant === 'stack'}
  role="radiogroup"
  aria-label="Colour substrate"
>
  <span class="switch-label t-micro" aria-hidden="true">Mode</span>

  <div class="switch-track">
    {#each OPTIONS as opt}
      <button
        type="button"
        role="radio"
        aria-checked={$theme === opt.value}
        aria-label="{opt.label} — {opt.hint}"
        title={opt.hint}
        class="seg"
        class:is-on={$theme === opt.value}
        on:click={() => setTheme(opt.value)}
      >
        {opt.label}
      </button>
    {/each}
  </div>
</div>

<style>
  .switch {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .switch-label {
    color: var(--ink-4);
    font-size: 0.5625rem;
  }

  .switch-track {
    display: inline-flex;
    border: 1px solid var(--rule-strong);
  }

  .seg {
    padding: 0.3rem 0.4rem;
    background: transparent;
    border: 0;
    border-right: 1px solid var(--rule);
    color: var(--ink-4);
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition:
      background-color 180ms var(--ease-out),
      color 180ms var(--ease-out);
  }
  .seg:last-child { border-right: 0; }
  .seg:hover { background: var(--paper-sunk); color: var(--ink); }

  /* Selected state is a solid ink block — unambiguous, matches the nav tabs */
  .seg.is-on {
    background: var(--ink);
    color: var(--paper);
  }

  /* ─── Stacked variant for the mobile sheet ─────────────────────────────── */
  .is-stack {
    display: flex;
    width: 100%;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .is-stack .switch-label { font-size: 0.6875rem; }
  .is-stack .seg { padding: 0.45rem 0.6rem; font-size: 0.625rem; }
</style>
