<script>
  import { onMount, tick } from 'svelte';
  import { gsap } from 'gsap';
  import { streamChat } from '$lib/api.js';
  import Icon from './Icon.svelte';

  let open      = false;
  let messages  = [];
  let input     = '';
  let streaming = false;
  let errored   = false;
  let mounted   = false;
  let panel, messagesEl, btnEl, inputEl;

  const GREETING =
    "Terminal open. Ask about Venkataraman's stack, service record, builds or credentials.";

  const PROMPTS = [
    'What has he shipped with PyTorch?',
    'Summarise his iOS work.',
    'Which backends has he run in production?',
  ];

  onMount(async () => {
    mounted = true;
    messages = [{ role: 'assistant', content: GREETING }];
    await tick();
    if (btnEl) {
      gsap.fromTo(
        btnEl,
        { yPercent: 130 },
        { yPercent: 0, duration: 0.6, ease: 'expo.out', delay: 1.6 }
      );
    }
  });

  async function toggle() {
    if (!open) {
      open = true;
      await tick();
      // Hard mechanical open: wipe up from the bottom edge, no scale, no fade
      gsap.fromTo(
        panel,
        { clipPath: 'inset(100% 0 0 0)' },
        { clipPath: 'inset(0% 0 0 0)', duration: 0.42, ease: 'expo.out' }
      );
      scrollBottom();
      inputEl?.focus();
    } else {
      await gsap.to(panel, {
        clipPath: 'inset(100% 0 0 0)',
        duration: 0.26,
        ease: 'power2.in',
      });
      open = false;
    }
  }

  function scrollBottom() {
    tick().then(() => {
      if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  async function send(preset) {
    const text = (preset ?? input).trim();
    if (!text || streaming) return;
    if (!preset) input = '';
    errored = false;

    messages = [...messages, { role: 'user', content: text }];
    messages = [...messages, { role: 'assistant', content: '' }];
    streaming = true;
    scrollBottom();

    try {
      const history = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      for await (const chunk of streamChat(history)) {
        messages[messages.length - 1] = {
          role: 'assistant',
          content: messages[messages.length - 1].content + chunk,
        };
        messages = messages;
        scrollBottom();
      }
    } catch (e) {
      errored = true;
      messages[messages.length - 1] = {
        role: 'assistant',
        content: `Connection failed. ${e.message}`,
      };
      messages = messages;
    } finally {
      streaming = false;
      scrollBottom();
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function onPanelKey(e) {
    if (e.key === 'Escape' && open) toggle();
  }
</script>

<svelte:window on:keydown={onPanelKey} />

{#if mounted}
  <!-- Launcher: a squared tab anchored to the bottom-right, not a floating orb -->
  <button
    bind:this={btnEl}
    on:click={toggle}
    class="launcher"
    aria-expanded={open}
    aria-controls="chat-panel"
  >
    <span class="launcher-dot" class:launcher-dot-live={streaming} aria-hidden="true"></span>
    <Icon name={open ? 'close' : 'chat'} size={18}
          label={open ? 'Close assistant' : 'Ask the AI assistant'} />
  </button>

  {#if open}
    <aside bind:this={panel} id="chat-panel" class="panel" aria-label="AI assistant">
      <!-- Header -->
      <header class="panel-head">
        <div class="panel-head-row">
          <span class="t-micro panel-title">&#91; Query Terminal &#93;</span>
          <span class="t-micro panel-stat">
            <span class="dot" class:dot-live={streaming} class:dot-bad={errored} aria-hidden="true"></span>
            {errored ? 'Error' : streaming ? 'Receiving' : 'Ready'}
          </span>
        </div>
        <div class="hazard-stripes panel-stripe" aria-hidden="true"></div>
      </header>

      <!-- Transcript -->
      <div bind:this={messagesEl} class="log" role="log" aria-live="polite">
        {#each messages as msg, i (i)}
          <article class="msg" class:msg-user={msg.role === 'user'}>
            <span class="msg-who t-micro">{msg.role === 'user' ? 'You' : 'Sys'}</span>
            <div class="msg-body">
              {#if msg.role === 'assistant' && !msg.content && streaming}
                <span class="wait" aria-label="Waiting for response">
                  <span class="wait-bar"></span><span class="wait-bar"></span><span class="wait-bar"></span>
                </span>
              {:else}
                {msg.content}
              {/if}
            </div>
          </article>
        {/each}

        <!-- Suggested queries, only before the first exchange -->
        {#if messages.length === 1 && !streaming}
          <div class="prompts">
            <span class="t-micro prompts-label">Try</span>
            {#each PROMPTS as p}
              <button class="prompt" on:click={() => send(p)}>{p}</button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Composer -->
      <div class="composer">
        <label class="sr" for="chat-input">Your question</label>
        <textarea
          bind:this={inputEl}
          id="chat-input"
          bind:value={input}
          on:keydown={onKey}
          rows="1"
          placeholder="Type a query, press Enter"
          disabled={streaming}
          class="composer-input"
        ></textarea>
        <button
          on:click={() => send()}
          disabled={streaming || !input.trim()}
          class="composer-send"
          aria-label="Send query"
          title="Send"
        >
          <Icon name="send" size={16} />
        </button>
      </div>

      <p class="t-micro foot-note">Answers derive from the on-file CV. Verify anything load-bearing.</p>
    </aside>
  {/if}
{/if}

<style>
  .sr {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ─── Launcher ─────────────────────────────────────────────────────────── */
  .launcher {
    position: fixed;
    right: 0;
    bottom: 0;
    z-index: var(--z-overlay);
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--ink);
    color: var(--paper);
    border: 0;
    border-top: 3px solid var(--hazard);
    cursor: pointer;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    will-change: transform;
    transition: background-color 200ms var(--ease-out);
  }
  .launcher:hover { background: var(--hazard); }
  .launcher-dot {
    width: 6px;
    height: 6px;
    background: var(--paper);
    opacity: 0.5;
  }
  .launcher-dot-live { opacity: 1; animation: blink 1.1s step-end infinite; }


  /* ─── Panel ────────────────────────────────────────────────────────────── */
  .panel {
    position: fixed;
    right: 0;
    bottom: 2.75rem;
    z-index: var(--z-modal);
    width: 380px;
    max-width: calc(100vw - 1rem);
    height: min(540px, calc(100dvh - 5rem));
    display: flex;
    flex-direction: column;
    background: var(--paper);
    border: 1px solid var(--ink);
    border-bottom: 0;
    will-change: clip-path;
  }

  .panel-head { border-bottom: 1px solid var(--rule-strong); flex-shrink: 0; }
  .panel-head-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.6875rem 0.875rem;
  }
  .panel-title { color: var(--ink); font-weight: 600; }
  .panel-stat { display: inline-flex; align-items: center; gap: 0.4rem; }
  .dot { width: 6px; height: 6px; background: var(--ink-4); }
  .dot-live { background: var(--hazard); animation: blink 1.1s step-end infinite; }
  .dot-bad { background: var(--hazard); }
  .panel-stripe { height: 6px; opacity: 0.16; }

  /* ─── Transcript ───────────────────────────────────────────────────────── */
  .log {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;
  }

  .msg {
    display: grid;
    grid-template-columns: 2.5rem minmax(0, 1fr);
    gap: 0.75rem;
    padding: 0.625rem 0.875rem;
    border-bottom: 1px solid var(--rule);
  }
  .msg-who { color: var(--ink-4); padding-top: 1px; }
  .msg-user { background: var(--paper-sunk); }
  .msg-user .msg-who { color: var(--hazard); }

  .msg-body {
    font-family: var(--font-mono);
    font-size: 0.78125rem;
    line-height: 1.6;
    color: var(--ink-2);
    white-space: pre-wrap;
    word-break: break-word;
  }
  .msg-user .msg-body { color: var(--ink); }

  /* Waiting indicator: three sweeping bars, not bouncing dots */
  .wait { display: inline-flex; gap: 3px; height: 0.9rem; align-items: center; }
  .wait-bar {
    width: 3px;
    height: 100%;
    background: var(--ink-4);
    animation: wait 0.9s var(--ease-out) infinite;
  }
  .wait-bar:nth-child(2) { animation-delay: 0.12s; }
  .wait-bar:nth-child(3) { animation-delay: 0.24s; }
  @keyframes wait {
    0%, 100% { transform: scaleY(0.35); }
    50%      { transform: scaleY(1); }
  }

  /* ─── Suggested prompts ────────────────────────────────────────────────── */
  .prompts {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.375rem;
    padding: 0.875rem;
  }
  .prompts-label { color: var(--ink-4); }
  .prompt {
    text-align: left;
    padding: 0.4rem 0.5rem;
    background: transparent;
    border: 1px solid var(--rule);
    color: var(--ink-2);
    font-family: var(--font-mono);
    font-size: 0.71875rem;
    line-height: 1.4;
    cursor: pointer;
    transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out),
      border-color 180ms var(--ease-out);
  }
  .prompt:hover {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--paper);
  }

  /* ─── Composer ─────────────────────────────────────────────────────────── */
  .composer {
    display: flex;
    gap: 0;
    border-top: 1px solid var(--rule-strong);
    flex-shrink: 0;
  }
  .composer-input {
    flex: 1;
    resize: none;
    max-height: 96px;
    padding: 0.6875rem 0.75rem;
    background: var(--paper);
    border: 0;
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.78125rem;
    line-height: 1.5;
  }
  .composer-input:focus {
    outline: none;
    background: var(--paper-sunk);
    box-shadow: inset 0 -2px 0 0 var(--hazard);
  }
  .composer-input:disabled { opacity: 0.5; }

  .composer-send {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    flex-shrink: 0;
    background: var(--ink);
    color: var(--paper);
    border: 0;
    border-left: 1px solid var(--rule-strong);
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 180ms var(--ease-out);
  }
  .composer-send:hover:not(:disabled) { background: var(--hazard); }
  .composer-send:disabled { opacity: 0.3; cursor: default; }

  .foot-note {
    margin: 0;
    padding: 0.5rem 0.875rem 0.625rem;
    border-top: 1px solid var(--rule);
    color: var(--ink-4);
    font-size: 0.5625rem;
    letter-spacing: 0.08em;
    text-transform: none;
    flex-shrink: 0;
    background: var(--paper);
  }
</style>
