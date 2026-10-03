<script>
  import { goto } from '$app/navigation';
  import { token } from '$lib/stores/auth.js';
  import { api } from '$lib/api.js';
  import { toast } from '$lib/stores/toast.js';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import ThemeSwitch from '$lib/components/ThemeSwitch.svelte';
  import Icon from '$lib/components/Icon.svelte';

  let email = '';
  let password = '';
  let loading = false;
  let errors = {};
  let failed = '';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  onMount(() => {
    if (get(token)) goto('/dashboard');
  });

  function validate() {
    const next = {};
    if (!email.trim()) next.email = 'Enter your email address.';
    else if (!EMAIL_RE.test(email.trim())) next.email = 'That email address is not valid.';
    if (!password) next.password = 'Enter your password.';
    errors = next;
    return Object.keys(next).length === 0;
  }

  async function login() {
    failed = '';
    if (!validate()) return;

    loading = true;
    try {
      const res = await api.login(email.trim(), password);
      token.set(res.access_token);
      toast('Signed in');
      goto('/dashboard');
    } catch (e) {
      // Inline, specific, no alert dialog and no "Oops".
      failed = e.message || 'Sign-in failed. Check your credentials and try again.';
      toast(failed, 'error');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Sign in — VTB Control</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="gate">
  <div class="panel">
    <!-- Masthead -->
    <header class="gate-head">
      <div class="gate-meta">
        <span class="t-micro">&#91; Restricted &#93;</span>
        <span class="t-micro gate-unit">Unit D-01</span>
      </div>
      <h1 class="gate-title">VTB<br />Control</h1>
      <div class="hazard-stripes gate-stripe" aria-hidden="true"></div>
    </header>

    <form on:submit|preventDefault={login} class="form" novalidate>
      {#if failed}
        <p class="alert" role="alert">{failed}</p>
      {/if}

      <div class="row">
        <label class="label" for="email">Operator email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          on:input={() => { errors = { ...errors, email: undefined }; }}
          class="field"
          class:field-bad={errors.email}
          autocomplete="username"
          placeholder="you@example.com"
          aria-invalid={errors.email ? 'true' : undefined}
          aria-describedby={errors.email ? 'e-email' : undefined}
        />
        {#if errors.email}
          <p id="e-email" class="err" role="alert">{errors.email}</p>
        {/if}
      </div>

      <div class="row">
        <label class="label" for="pw">Passphrase</label>
        <input
          id="pw"
          type="password"
          bind:value={password}
          on:input={() => { errors = { ...errors, password: undefined }; }}
          class="field"
          class:field-bad={errors.password}
          autocomplete="current-password"
          aria-invalid={errors.password ? 'true' : undefined}
          aria-describedby={errors.password ? 'e-pw' : undefined}
        />
        {#if errors.password}
          <p id="e-pw" class="err" role="alert">{errors.password}</p>
        {/if}
      </div>

      <button type="submit" disabled={loading} class="btn btn-hazard submit"
            aria-label="Sign in" title="Sign in">
        {#if loading}
          <span class="submit-wait" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
        {:else}
          <Icon name="lock" size={15} />
          <Icon name="arrow-right" size={14} />
        {/if}
      </button>
    </form>

    <footer class="gate-foot">
      <ThemeSwitch />
      <a href="/" class="back" aria-label="Back to portfolio" title="Back to portfolio">
        <Icon name="arrow-left" size={16} />
      </a>
    </footer>
  </div>
</main>

<style>
  .gate {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    /* Blueprint grid, drawn in ink rather than violet */
    background-image:
      linear-gradient(var(--grid-line) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  .panel {
    width: 100%;
    max-width: 25rem;
    background: var(--paper);
    border: 1px solid var(--ink);
  }

  /* ─── Masthead ─────────────────────────────────────────────────────────── */
  .gate-head { padding: 1.25rem 1.25rem 0; }

  .gate-meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  .gate-unit { color: var(--ink-4); }

  .gate-title {
    margin: 0.875rem 0 1rem;
    font-family: var(--font-display);
    font-weight: 900;
    font-size: clamp(2.25rem, 11vw, 3.25rem);
    line-height: 0.85;
    letter-spacing: -0.045em;
    text-transform: uppercase;
    color: var(--ink);
  }

  .gate-stripe { height: 8px; opacity: 0.16; }

  /* ─── Form ─────────────────────────────────────────────────────────────── */
  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
  }

  .row { display: flex; flex-direction: column; }

  .alert {
    margin: 0;
    padding: 0.625rem 0.75rem;
    background: var(--hazard);
    color: var(--paper);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.45;
  }

  .err {
    margin: 0.3rem 0 0;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--hazard-ink);
  }

  .submit { padding: 0.75rem; margin-top: 0.25rem; }

  /* Three sweeping bars — matches the portfolio's waiting indicator */
  .submit-wait {
    display: inline-flex;
    gap: 2px;
    height: 0.7rem;
    align-items: center;
    margin-right: 0.4rem;
  }
  .submit-wait span {
    width: 3px;
    height: 100%;
    background: var(--paper);
    animation: wait 0.9s var(--ease-out) infinite;
  }
  .submit-wait span:nth-child(2) { animation-delay: 0.12s; }
  .submit-wait span:nth-child(3) { animation-delay: 0.24s; }
  @keyframes wait {
    0%, 100% { transform: scaleY(0.35); }
    50%      { transform: scaleY(1); }
  }

  /* ─── Footer ───────────────────────────────────────────────────────────── */
  .gate-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--rule);
  }
  .back {
    display: inline-flex;
    padding: 0.4rem;
    border: 1px solid var(--rule);
    text-decoration: none;
    color: var(--ink-3);
    transition: color 180ms var(--ease-out), background-color 180ms var(--ease-out),
      border-color 180ms var(--ease-out);
  }
  .back:hover {
    color: var(--paper);
    background: var(--ink);
    border-color: var(--ink);
  }
  .back:hover { color: var(--hazard); }
</style>
