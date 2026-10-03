<script>
  import { toasts } from '$lib/stores/toast.js';

  const MARK = { success: '×', error: '!', info: '·' };
  const WORD = { success: 'Done', error: 'Failed', info: 'Note' };
</script>

<div class="stack" aria-live="polite" aria-atomic="false">
  {#each $toasts as t (t.id)}
    <div class="toast" class:is-error={t.type === 'error'} role={t.type === 'error' ? 'alert' : 'status'}>
      <span class="toast-kind">
        <span class="toast-mark" aria-hidden="true">{MARK[t.type] ?? MARK.info}</span>
        {WORD[t.type] ?? WORD.info}
      </span>
      <span class="toast-msg">{t.message}</span>
    </div>
  {/each}
</div>

<style>
  .stack {
    position: fixed;
    bottom: 0;
    right: 0;
    z-index: var(--z-modal);
    display: flex;
    flex-direction: column-reverse;
    gap: 1px;
    pointer-events: none;
    max-width: min(420px, calc(100vw - 1rem));
  }

  /* Squared status strip anchored to the corner, not a floating pill */
  .toast {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.625rem;
    align-items: baseline;
    padding: 0.625rem 0.875rem;
    background: var(--ink);
    color: var(--paper);
    border-top: 3px solid var(--paper);
  }

  .is-error { border-top-color: var(--hazard); }

  .toast-kind {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--paper);
    opacity: 0.6;
    white-space: nowrap;
  }
  .is-error .toast-kind { color: var(--hazard); opacity: 1; }

  .toast-mark { font-size: 0.75rem; line-height: 1; }

  .toast-msg {
    font-family: var(--font-mono);
    font-size: 0.78125rem;
    line-height: 1.45;
    color: var(--paper);
    word-break: break-word;
  }
</style>
