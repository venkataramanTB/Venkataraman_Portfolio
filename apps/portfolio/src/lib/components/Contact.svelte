<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

  export let profile = null;
  export let socialLinks = [];

  let name = '', email = '', message = '';
  let status = ''; // 'sending' | 'sent' | 'error'

  onMount(async () => {
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo('#contact .reveal-up', { opacity: 0, y: 60 }, {
      opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power3.out',
      scrollTrigger: { trigger: '#contact', start: 'top 75%' },
    });
  });

  async function handleSubmit(e) {
    e.preventDefault();
    status = 'sending';
    // Opens default mail client as fallback — swap for API call if desired
    const mailto = `mailto:${profile?.email ?? 'venkataraman.tb@mythics.com'}?subject=Portfolio Inquiry from ${encodeURIComponent(name)}&body=${encodeURIComponent(message + '\n\nFrom: ' + name + '\nEmail: ' + email)}`;
    window.location.href = mailto;
    setTimeout(() => { status = 'sent'; }, 800);
  }

  const socialIconMap = {
    linkedin: '🔗',
    github:   '🐙',
    twitter:  '🐦',
    x:        '✖',
    youtube:  '▶',
    instagram:'📸',
  };
</script>

<section id="contact" class="section-pad relative overflow-hidden">
  <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(56,189,248,0.06)_0%,_transparent_60%)]"></div>

  <!-- Animated glowing orbs -->
  <div class="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse-slow pointer-events-none"></div>
  <div class="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-secondary/5 blur-3xl animate-pulse-slow pointer-events-none"></div>

  <div class="max-w-6xl mx-auto px-6 relative z-10">
    <div class="reveal-up text-center mb-16">
      <p class="text-primary text-sm font-mono uppercase tracking-widest mb-3">Let's build something great</p>
      <h2 class="text-5xl font-black">Get In <span class="gradient-text">Touch</span></h2>
      <p class="mt-4 text-slate-400 max-w-xl mx-auto">
        Whether it's a job opportunity, a project collaboration, or just a chat about AI — my inbox is always open.
      </p>
    </div>

    <div class="grid lg:grid-cols-2 gap-12">
      <!-- Contact form -->
      <div class="reveal-up glass rounded-3xl p-8 border border-border">
        <form on:submit={handleSubmit} class="space-y-5">
          <div>
            <label class="block text-sm text-slate-400 mb-1.5" for="c-name">Your Name</label>
            <input
              id="c-name" type="text" bind:value={name} required
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1.5" for="c-email">Email Address</label>
            <input
              id="c-email" type="email" bind:value={email} required
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors"
              placeholder="john@company.com"
            />
          </div>
          <div>
            <label class="block text-sm text-slate-400 mb-1.5" for="c-msg">Message</label>
            <textarea
              id="c-msg" bind:value={message} rows="5" required
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Tell me about your project or opportunity…"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={status === 'sending'}
            class="w-full py-3.5 rounded-full font-semibold transition-all duration-300 glow-primary"
            class:bg-primary={status !== 'sent'}
            class:text-dark={status !== 'sent'}
            class:bg-green-500={status === 'sent'}
            class:text-white={status === 'sent'}
          >
            {#if status === 'sending'}Sending…
            {:else if status === 'sent'}Message Sent! ✓
            {:else}Send Message →{/if}
          </button>
        </form>
      </div>

      <!-- Info + socials -->
      <div class="reveal-up flex flex-col justify-center space-y-8">
        <div>
          <h3 class="text-2xl font-bold text-white mb-4">Let's connect</h3>
          <div class="space-y-3">
            {#if profile?.email}
              <a href="mailto:{profile.email}" class="flex items-center gap-3 text-slate-400 hover:text-primary transition-colors group">
                <span class="w-10 h-10 rounded-xl glass border border-border flex items-center justify-center text-lg group-hover:border-primary/30 transition-colors">✉️</span>
                <span class="text-sm">{profile.email}</span>
              </a>
            {/if}
            {#if profile?.phone}
              <div class="flex items-center gap-3 text-slate-400">
                <span class="w-10 h-10 rounded-xl glass border border-border flex items-center justify-center text-lg">📞</span>
                <span class="text-sm">{profile.phone}</span>
              </div>
            {/if}
            {#if profile?.location}
              <div class="flex items-center gap-3 text-slate-400">
                <span class="w-10 h-10 rounded-xl glass border border-border flex items-center justify-center text-lg">📍</span>
                <span class="text-sm">{profile.location}</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Social links -->
        {#if socialLinks.length}
          <div>
            <p class="text-sm text-slate-500 uppercase tracking-widest mb-4">Find me online</p>
            <div class="flex flex-wrap gap-3">
              {#each socialLinks as link}
                <a
                  href={link.url} target="_blank" rel="noopener"
                  class="flex items-center gap-2 px-4 py-2.5 rounded-xl glass border border-border hover:border-primary/30 text-slate-400 hover:text-primary transition-all duration-300 text-sm"
                >
                  <span>{socialIconMap[link.icon?.toLowerCase()] ?? '🔗'}</span>
                  {link.platform}
                </a>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Status badge -->
        <div class="glass rounded-2xl p-5 border border-border">
          <div class="flex items-center gap-3">
            <span class="w-3 h-3 rounded-full {profile?.open_to_work ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}"></span>
            <div>
              <p class="font-semibold text-white text-sm">
                {profile?.open_to_work ? 'Open to new opportunities' : 'Currently not available'}
              </p>
              <p class="text-xs text-slate-500 mt-0.5">
                {profile?.open_to_work ? 'Actively looking for AI / Full Stack / iOS roles' : 'Check back later'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
