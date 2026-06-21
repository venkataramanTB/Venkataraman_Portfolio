<script>
  import { onMount, tick } from 'svelte';
  import { gsap } from 'gsap';
  import { streamChat } from '$lib/api.js';

  let open = false;
  let messages = [];
  let input = '';
  let streaming = false;
  let panel, messagesEl, btnEl;
  let mounted = false;

  const GREETING = "Hi! I'm Venkataraman's AI assistant. Ask me anything about his skills, experience, projects, or achievements! 👋";

  onMount(async () => {
    mounted = true;
    messages = [{ role: 'assistant', content: GREETING }];
    await tick();
    if (btnEl) {
      gsap.fromTo(btnEl,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)', delay: 2 }
      );
    }
  });

  async function toggle() {
    if (!open) {
      open = true;
      await tick();
      gsap.fromTo(panel,
        { opacity: 0, y: 30, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out' }
      );
      scrollBottom();
    } else {
      await gsap.to(panel, { opacity: 0, y: 20, scale: 0.95, duration: 0.25, ease: 'power2.in' });
      open = false;
    }
  }

  function scrollBottom() {
    tick().then(() => {
      if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    input = '';

    messages = [...messages, { role: 'user', content: text }];
    messages = [...messages, { role: 'assistant', content: '' }];
    streaming = true;
    scrollBottom();

    try {
      const history = messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      for await (const chunk of streamChat(history)) {
        messages[messages.length - 1] = {
          role: 'assistant',
          content: messages[messages.length - 1].content + chunk,
        };
        messages = messages; // trigger reactivity
        scrollBottom();
      }
    } catch (e) {
      messages[messages.length - 1] = { role: 'assistant', content: `Sorry, I ran into an issue: ${e.message}` };
      messages = messages;
    } finally {
      streaming = false;
      scrollBottom();
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }
</script>

{#if mounted}
  <!-- Floating button -->
  <button
    bind:this={btnEl}
    on:click={toggle}
    class="fixed bottom-6 right-6 z-[9000] w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
    style="background: linear-gradient(135deg, #a78bfa, #38bdf8); box-shadow: 0 0 30px rgba(167,139,250,0.5);"
    aria-label="Chat with AI"
  >
    {#if open}
      <span class="text-xl text-white font-bold">×</span>
    {:else}
      <span class="text-xl">🤖</span>
      <!-- Pulse ring -->
      <span class="absolute inset-0 rounded-full animate-ping opacity-20"
        style="background: linear-gradient(135deg, #a78bfa, #38bdf8);"></span>
    {/if}
  </button>

  <!-- Chat panel -->
  {#if open}
    <div
      bind:this={panel}
      class="fixed bottom-24 right-6 z-[9000] w-[360px] max-w-[calc(100vw-2rem)] flex flex-col rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      style="height: 520px; background: rgba(10,10,15,0.95); backdrop-filter: blur(24px);"
    >
      <!-- Header -->
      <div class="px-5 py-4 border-b border-white/10 shrink-0"
        style="background: linear-gradient(135deg, rgba(167,139,250,0.15), rgba(56,189,248,0.1));">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style="background: linear-gradient(135deg, #a78bfa, #38bdf8);">🤖</div>
          <div>
            <p class="text-sm font-bold text-white">Ask about Venkataraman</p>
            <div class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-green-400 {streaming ? 'animate-pulse' : ''}"></span>
              <p class="text-xs text-slate-500">{streaming ? 'Typing…' : 'AI Assistant · Online'}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div bind:this={messagesEl} class="flex-1 overflow-y-auto p-4 space-y-3">
        {#each messages as msg, i (i)}
          <div class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
            <div
              class="max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
              class:rounded-br-sm={msg.role === 'user'}
              class:rounded-bl-sm={msg.role !== 'user'}
              style={msg.role === 'user'
                ? 'background: linear-gradient(135deg, #a78bfa, #7c3aed); color: white;'
                : 'background: rgba(255,255,255,0.06); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.08);'}
            >
              {#if msg.role === 'assistant' && !msg.content && streaming}
                <span class="inline-flex gap-1 items-center h-4">
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay:0ms"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay:150ms"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style="animation-delay:300ms"></span>
                </span>
              {:else}
                {msg.content}
              {/if}
            </div>
          </div>
        {/each}
      </div>

      <!-- Input -->
      <div class="px-4 py-3 border-t border-white/10 shrink-0">
        <div class="flex gap-2 items-end">
          <textarea
            bind:value={input}
            on:keydown={onKey}
            rows="1"
            placeholder="Ask about skills, experience, projects…"
            disabled={streaming}
            class="flex-1 resize-none rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 bg-white/5 border border-white/10 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            style="max-height: 96px;"
          ></textarea>
          <button
            on:click={send}
            disabled={streaming || !input.trim()}
            class="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30"
            style="background: linear-gradient(135deg, #a78bfa, #38bdf8);"
            aria-label="Send"
          >
            <span class="text-white text-sm font-bold">↑</span>
          </button>
        </div>
        <p class="text-[10px] text-slate-700 mt-2 text-center">Powered by Gemini · Answers based on Venkataraman's CV</p>
      </div>
    </div>
  {/if}
{/if}
