<script>
  import { onMount } from 'svelte';

  export let socialLinks = [];

  let scrolled  = false;
  let menuOpen  = false;

  const pages = [
    { label: 'About',    href: '#about'    },
    { label: 'Work',     href: '#work'     },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact',  href: '#contact'  },
  ];

  function getSocial(platform) {
    return socialLinks.find(l => l.platform?.toLowerCase() === platform)?.url ?? null;
  }

  onMount(() => {
    const onScroll = () => { scrolled = window.scrollY > 50; };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<nav
  class="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
  style="
    background: {scrolled ? 'rgba(10,10,10,0.92)' : 'transparent'};
    backdrop-filter: {scrolled ? 'blur(14px)' : 'none'};
    border-bottom: 1px solid {scrolled ? 'var(--border)' : 'transparent'};
  "
>
  <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">

    <!-- Logo -->
    <a href="/" class="text-xs font-bold tracking-[0.25em] uppercase"
       style="color: var(--accent)">VTB</a>

    <!-- Desktop nav links -->
    <ul class="hidden md:flex items-center gap-10">
      {#each pages as { label, href }}
        <li>
          <a {href} class="sec-num hover:text-[var(--text)] transition-colors duration-200">
            {label}
          </a>
        </li>
      {/each}
    </ul>

    <!-- Desktop social + CTA -->
    <div class="hidden md:flex items-center gap-6">
      {#if getSocial('github')}
        <a href={getSocial('github')} target="_blank" rel="noopener"
           class="sec-num hover:text-[var(--text)] transition-colors duration-200">GitHub</a>
      {/if}
      {#if getSocial('linkedin')}
        <a href={getSocial('linkedin')} target="_blank" rel="noopener"
           class="sec-num hover:text-[var(--text)] transition-colors duration-200">LinkedIn</a>
      {/if}
        <a href="#contact"
           class="sec-num px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all duration-200 btn btn-primary">
          Hire Me →
        </a>
    </div>

    <!-- Mobile burger -->
    <button
      class="md:hidden flex flex-col gap-[5px] p-2"
      on:click={() => menuOpen = !menuOpen}
      aria-label="Toggle menu"
    >
      <span class="block w-5 h-px bg-[var(--text)] transition-all duration-300"
            style="transform: {menuOpen ? 'rotate(45deg) translate(4px,4px)' : 'none'}"></span>
      <span class="block w-5 h-px bg-[var(--text)] transition-all duration-300"
            style="opacity: {menuOpen ? 0 : 1}"></span>
      <span class="block w-5 h-px bg-[var(--text)] transition-all duration-300"
            style="transform: {menuOpen ? 'rotate(-45deg) translate(4px,-4px)' : 'none'}"></span>
    </button>
  </div>

  <!-- Mobile menu -->
  {#if menuOpen}
    <div class="md:hidden border-t border-[var(--border)] px-6 py-8 space-y-6"
         style="background: var(--bg)">
      {#each pages as { label, href }}
        <a {href} class="block sec-num hover:text-[var(--text)] transition-colors py-1"
           on:click={() => menuOpen = false}>{label}</a>
      {/each}
      <hr class="divider" />
      {#if getSocial('github')}
        <a href={getSocial('github')} target="_blank" rel="noopener"
           class="block sec-num hover:text-[var(--text)] transition-colors py-1">GitHub</a>
      {/if}
      {#if getSocial('linkedin')}
        <a href={getSocial('linkedin')} target="_blank" rel="noopener"
           class="block sec-num hover:text-[var(--text)] transition-colors py-1">LinkedIn</a>
      {/if}
      <a href="#contact" class="block sec-num text-[var(--accent)]"
         on:click={() => menuOpen = false}>Hire Me →</a>
    </div>
  {/if}
</nav>
