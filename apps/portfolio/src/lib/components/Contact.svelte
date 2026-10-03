<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';
  import BandHead from './BandHead.svelte';
  import Icon from './Icon.svelte';

  export let profile     = null;
  export let socialLinks = [];

  let name    = '';
  let from    = '';
  let message = '';
  let errors  = {};
  let sent    = false;

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validate() {
    const next = {};
    if (!name.trim())                   next.name    = 'Enter your name.';
    if (!from.trim())                   next.from    = 'Enter your email address.';
    else if (!EMAIL_RE.test(from.trim())) next.from  = 'That email address is not valid.';
    if (message.trim().length < 12)     next.message = 'Add a little more detail — at least 12 characters.';
    errors = next;
    return Object.keys(next).length === 0;
  }

  function submit() {
    if (!validate()) return;

    // No form endpoint on the API, so hand off to the user's mail client with
    // everything pre-filled rather than silently dropping the message.
    const to   = profile?.email ?? 'venkataraman.tb@mythics.com';
    const subj = encodeURIComponent(`Portfolio enquiry — ${name.trim()}`);
    const body = encodeURIComponent(`${message.trim()}\n\n—\n${name.trim()}\n${from.trim()}`);
    window.location.href = `mailto:${to}?subject=${subj}&body=${body}`;
    sent = true;
  }

  // Clear a field's error as soon as the user corrects it
  function touch(field) {
    if (errors[field]) {
      const { [field]: _, ...rest } = errors;
      errors = rest;
    }
  }


  const SOCIAL_ICON = {
    github: 'github', linkedin: 'linkedin', email: 'mail', mail: 'mail',
    twitter: 'link', x: 'link',
  };
  const socialIcon = (p) => SOCIAL_ICON[p?.toLowerCase()] ?? 'link';

  let headEl, formEl, chanEl;
  let ctx;

  onMount(async () => {
    const g = await useGSAP();
    if (!g) return;
    const { gsap, SplitText } = g;

    ctx = gsap.context(() => {
      if (headEl) {
        const split = new SplitText(headEl, { type: 'lines', linesClass: 'clip-line' });
        gsap.from(split.lines, {
          yPercent: 100,
          duration: 0.8,
          stagger: 0.07,
          ease: 'expo.out',
          scrollTrigger: { trigger: headEl, start: 'top 85%' },
        });
      }

      [formEl, chanEl].filter(Boolean).forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.6,
          delay: i * 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });
    });
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<section id="contact" class="band">
  <div class="shell">
    <BandHead index="06" title="Transmit" />

    <h3 bind:this={headEl} class="t-display pitch">
      Hiring, building,<br />or just curious &mdash;<br />send the brief.
    </h3>

    <div class="contact-grid">
      <!-- ── Form ──────────────────────────────────────────────────────── -->
      <form bind:this={formEl} class="form" on:submit|preventDefault={submit} novalidate>
        <div class="field">
          <label class="t-micro" for="c-name">Name <span class="req" aria-hidden="true">*</span></label>
          <input
            id="c-name"
            class="input"
            class:input-bad={errors.name}
            type="text"
            bind:value={name}
            on:input={() => touch('name')}
            autocomplete="name"
            aria-invalid={errors.name ? 'true' : undefined}
            aria-describedby={errors.name ? 'e-name' : undefined}
          />
          {#if errors.name}
            <p id="e-name" class="err" role="alert">{errors.name}</p>
          {/if}
        </div>

        <div class="field">
          <label class="t-micro" for="c-from">Email <span class="req" aria-hidden="true">*</span></label>
          <input
            id="c-from"
            class="input"
            class:input-bad={errors.from}
            type="email"
            bind:value={from}
            on:input={() => touch('from')}
            autocomplete="email"
            aria-invalid={errors.from ? 'true' : undefined}
            aria-describedby={errors.from ? 'e-from' : undefined}
          />
          {#if errors.from}
            <p id="e-from" class="err" role="alert">{errors.from}</p>
          {/if}
        </div>

        <div class="field">
          <label class="t-micro" for="c-msg">Brief <span class="req" aria-hidden="true">*</span></label>
          <textarea
            id="c-msg"
            class="input textarea"
            class:input-bad={errors.message}
            rows="5"
            bind:value={message}
            on:input={() => touch('message')}
            aria-invalid={errors.message ? 'true' : undefined}
            aria-describedby={errors.message ? 'e-msg' : undefined}
          ></textarea>
          {#if errors.message}
            <p id="e-msg" class="err" role="alert">{errors.message}</p>
          {/if}
        </div>

        <div class="form-foot">
          <button type="submit" class="btn btn-hazard" data-press
                  aria-label="Send message" title="Send message">
            <Icon name="send" size={15} />
            <Icon name="arrow-right" size={14} />
          </button>
          {#if sent}
            <p class="ok" role="status">Mail client opened with your brief.</p>
          {:else}
            <p class="t-micro note">Opens in your mail client. Nothing is stored.</p>
          {/if}
        </div>
      </form>

      <!-- ── Channels ──────────────────────────────────────────────────── -->
      <aside bind:this={chanEl}>
        <div class="sub-head">
          <span class="t-micro">&#91; Channels &#93;</span>
        </div>

        <dl class="chans">
          {#if profile?.email}
            <div class="chan">
              <dt class="chan-ico"><Icon name="mail" size={15} label="Email" /></dt>
              <dd><a href="mailto:{profile.email}" class="link chan-val">{profile.email}</a></dd>
            </div>
          {/if}
          {#if profile?.phone}
            <div class="chan">
              <dt class="chan-ico"><Icon name="phone" size={15} label="Phone" /></dt>
              <dd><a href="tel:{profile.phone.replace(/\s/g, '')}" class="link chan-val">{profile.phone}</a></dd>
            </div>
          {/if}
          {#if profile?.location}
            <div class="chan">
              <dt class="chan-ico"><Icon name="location" size={15} label="Location" /></dt>
              <dd class="chan-val">{profile.location}</dd>
            </div>
          {/if}
          {#each socialLinks as link}
            <div class="chan">
              <dt class="chan-ico"><Icon name={socialIcon(link.platform)} size={15} label={link.platform} /></dt>
              <dd>
                <a href={link.url} target="_blank" rel="noopener noreferrer" class="link chan-val">
                  {link.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                </a>
              </dd>
            </div>
          {/each}
        </dl>

        <div class="avail">
          <span class="dot" class:dot-live={profile?.open_to_work !== false} aria-hidden="true"></span>
          <span class="t-micro t-micro-ink">
            {profile?.open_to_work !== false
              ? 'Currently open to new engagements'
              : 'Not taking new work right now'}
          </span>
        </div>

        <div class="hazard-stripes stripe" aria-hidden="true"></div>
      </aside>
    </div>
  </div>
</section>

<style>
  .pitch {
    color: var(--ink);
    margin: 0 0 clamp(2rem, 5vh, 3.25rem);
  }
  .pitch :global(.clip-line) { overflow: hidden; }

  .contact-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: clamp(2rem, 5vw, 4rem);
    align-items: start;
  }
  @media (min-width: 900px) {
    .contact-grid { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); }
  }

  /* ─── Form ─────────────────────────────────────────────────────────────── */
  .form {
    display: flex;
    flex-direction: column;
    gap: 1.125rem;
    border-top: 1px solid var(--rule-strong);
    padding-top: 1.25rem;
  }

  .field { display: flex; flex-direction: column; gap: 0.375rem; }
  .req { color: var(--hazard); }

  .input {
    width: 100%;
    padding: 0.625rem 0.75rem;
    background: var(--paper-sunk);
    border: 1px solid var(--rule-strong);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.5;
    transition: border-color 200ms var(--ease-out), background-color 200ms var(--ease-out);
  }
  .input:hover { background: var(--paper-ink); }
  .input:focus {
    outline: none;
    background: var(--paper);
    border-color: var(--ink);
    box-shadow: inset 0 -2px 0 0 var(--hazard);
  }
  .input-bad { border-color: var(--hazard); }

  .textarea { resize: vertical; min-height: 7rem; }

  .err {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.04em;
    color: var(--hazard-ink);
  }

  .form-foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1rem;
    padding-top: 0.25rem;
  }
  .note { color: var(--ink-4); }
  .ok {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink);
  }

  /* ─── Channels ─────────────────────────────────────────────────────────── */
  .sub-head {
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--rule-strong);
  }

  .chans { margin: 0; }
  .chan {
    display: grid;
    grid-template-columns: 1.5rem minmax(0, 1fr);
    gap: 1rem;
    align-items: baseline;
    padding: 0.6875rem 0;
    border-bottom: 1px solid var(--rule);
  }
  .chan dt { margin: 0; }
  .chan-ico { color: var(--ink-4); }
  .chan dd { margin: 0; min-width: 0; }
  .chan-val {
    font-family: var(--font-mono);
    font-size: 0.78125rem;
    color: var(--ink);
    text-decoration: none;
    word-break: break-word;
  }

  .avail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 0;
  }
  .dot { width: 7px; height: 7px; background: var(--ink-4); flex-shrink: 0; }
  .dot-live { background: var(--hazard); }

  .stripe { height: 10px; opacity: 0.18; }
</style>
