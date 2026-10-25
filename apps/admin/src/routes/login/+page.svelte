<script>
  import { base } from '$app/paths';
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
    if (get(token)) goto(`${base}/dashboard`);
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
      goto(`${base}/dashboard`);
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
  <div class="panel card">
    <!-- Masthead. The old console shouted RESTRICTED / UNIT D-01 at its own
         operator; there is one user and he knows what this is. -->
    <header class="gate-head">
      <span class="gate-mark" aria-hidden="true">V</span>
      <h1 class="gate-title">Control</h1>
      <p class="gate-sub">Sign in to manage the portfolio’s content.</p>
    </header>

    <form on:submit|preventDefault={login} class="form" novalidate>
      {#if failed}
        <p class="alert" role="alert">
          <Icon name="close" size={15} />
          <span>{failed}</span>
        </p>
      {/if}

      <div class="row">
        <label class="label" for="email">Email</label>
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
        <label class="label" for="pw">Password</label>
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

      <!-- A primary action states what it does. The old button was two icons
           and an aria-label, which left sighted users guessing. -->
      <button type="submit" disabled={loading} class="btn btn-primary submit">
        {#if loading}
          <span class="submit-wait" aria-hidden="true">
            <span></span><span></span><span></span>
          </span>
          <span>Signing in…</span>
        {:else}
          <Icon name="lock" size={15} />
          <span>Sign in</span>
        {/if}
      </button>
    </form>

    <footer class="gate-foot">
      <ThemeSwitch />
      <!-- Absolute root: the public site lives at / even when this console is
           mounted under /admin on the same origin. -->
      <a href="/" class="back">
        <Icon name="arrow-left" size={15} />
        <span>Portfolio</span>
      </a>
    </footer>
  </div>
</main>

<style>
  .gate {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: 1.5rem;
  }

  .panel {
    width: 100%;
    max-width: 23rem;
    padding: 1.75rem;
    border-radius: var(--r-xl);
    box-shadow: var(--e3), var(--e-ring);
  }

  /* ─── Masthead ─── */
  .gate-head {
    margin-bottom: 1.5rem;
  }
  .gate-mark {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    margin-bottom: 1rem;
    border-radius: var(--r-full);
    background: var(--fill);
    color: var(--fill-text);
    font-size: 1.125rem;
    font-weight: 680;
    letter-spacing: -0.02em;
  }
  .gate-title {
    margin: 0 0 0.3125rem;
    font-size: 1.625rem;
    font-weight: 660;
    line-height: 1.1;
    letter-spacing: -0.028em;
  }
  .gate-sub {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-3);
  }

  /* ─── Form ─── */
  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .row {
    display: block;
    padding: 0;
    border: 0;
  }

  .alert {
    display: flex;
    align-items: flex-start;
    gap: 0.4375rem;
    margin: 0;
    padding: 0.625rem 0.75rem;
    border-radius: var(--r-sm);
    background: var(--bad-soft);
    border: 0.5px solid rgb(var(--bad-rgb) / 0.3);
    color: var(--bad);
    font-size: 0.8125rem;
    line-height: 1.45;
  }

  .err {
    margin: 0.375rem 0 0;
    font-size: 0.8125rem;
    color: var(--bad);
  }

  .submit {
    width: 100%;
    margin-top: 0.25rem;
    padding-block: 0.625rem;
  }

  .submit-wait {
    display: inline-flex;
    gap: 0.1875rem;
    align-items: center;
  }
  .submit-wait span {
    width: 0.3125rem;
    height: 0.3125rem;
    border-radius: var(--r-full);
    background: currentColor;
    animation: wait 1.1s var(--ease-soft) infinite;
  }
  .submit-wait span:nth-child(2) { animation-delay: 0.14s; }
  .submit-wait span:nth-child(3) { animation-delay: 0.28s; }
  @keyframes wait {
    0%, 100% { opacity: 0.3; }
    50%      { opacity: 1; }
  }

  /* ─── Foot ─── */
  .gate-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--hairline);
  }
  /* The card is narrower than the theme control's full labelled width, so in
     this one context it collapses to icons. The choice itself is never
     removed — all three modes stay reachable. */
  .gate-foot :global(.seg-text) {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .gate-foot :global(.segment) {
    padding-inline: 0.5rem;
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: var(--text-3);
    text-decoration: none;
    transition: color 180ms var(--ease-soft);
  }
  .back:hover { color: var(--text); }

  @media (prefers-reduced-motion: reduce) {
    .submit-wait span { animation: none; opacity: 1; }
  }
</style>
