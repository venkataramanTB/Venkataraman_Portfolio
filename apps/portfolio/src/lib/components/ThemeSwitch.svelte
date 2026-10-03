<script>
  import { theme, setTheme } from '$lib/theme.js';
  import Icon from './Icon.svelte';

  /** 'bar' sits inline in the navbar; 'stack' is for the mobile sheet. */
  export let variant = 'bar';

  // Three explicit states instead of a sun/moon toggle: following the OS is a
  // real, distinct choice and a two-state switch cannot express it.
  const OPTIONS = [
    { value: 'auto',  label: 'Auto',  icon: 'theme-auto',  hint: 'Follow system setting' },
    { value: 'light', label: 'Light', icon: 'theme-light', hint: 'Paper substrate' },
    { value: 'dark',  label: 'Dark',  icon: 'theme-dark',  hint: 'Terminal substrate' },
  ];
</script>

<div
  class="switch"
  class:is-stack={variant === 'stack'}
  role="radiogroup"
  aria-label="Colour substrate"
>
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
        <Icon name={opt.icon} size={14} />
        <!-- Label is kept only in the stacked (mobile) variant -->
        <span class="seg-label">{opt.label}</span>
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


  .switch-track {
    display: inline-flex;
    border: 1px solid var(--rule-strong);
  }

  .seg {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.45rem;
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
  .is-stack .seg { padding: 0.5rem 0.7rem; font-size: 0.625rem; }
  /* Icon-only is fine in the dense nav bar; the mobile sheet shows both. */
  .seg-label { display: none; }
  .is-stack .seg-label { display: inline; }
  .is-stack .switch-track { flex: 1; }
  .is-stack .seg { flex: 1; justify-content: center; }
</style>
