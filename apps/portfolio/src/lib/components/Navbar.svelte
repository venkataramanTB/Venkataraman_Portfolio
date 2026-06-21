<script>
  import { onMount, onDestroy } from 'svelte';
  import { useGSAP } from '$lib/gsap.js';

  export let socialLinks = [];

  let scrolled  = false;
  let menuOpen  = false;
  let nav, logoEl, linksEl, ctaEl;
  let ctx;

  const pages = [
    { label: 'About',    href: '#about'    },
    { label: 'Work',     href: '#work'     },
    { label: 'Projects', href: '#projects' },
    { label: 'Contact',  href: '#contact'  },
  ];

  function getSocial(platform) {
    return socialLinks.find(l => l.platform?.toLowerCase() === platform)?.url ?? null;
  }

  onMount(async () => {
    const onScroll = () => { scrolled = window.scrollY > 50; };
    window.addEventListener('scroll', onScroll, { passive: true });

    const g = await useGSAP();
    if (!g) return;
    const { gsap } = g;

    ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.15 });

      // Logo slides down
      tl.from(logoEl, { y: -28, opacity: 0, duration: 0.55, ease: 'power3.out' });

      // Nav links stagger in
      if (linksEl) {
        tl.from(linksEl.querySelectorAll('a'),
          { y: -18, opacity: 0, duration: 0.45, stagger: 0.07, ease: 'power3.out' },
          '-=0.3'
        );
      }

      // CTA button
      if (ctaEl) {
        tl.from(ctaEl, { y: -18, opacity: 0, duration: 0.45, ease: 'back.out(1.4)' }, '-=0.25');
      }

      // Logo magnetic
      logoEl?.addEventListener('mouseenter', () =>
        gsap.to(logoEl, { scale: 1.12, duration: 0.3, ease: 'back.out(2)' })
      );
      logoEl?.addEventListener('mouseleave', () =>
        gsap.to(logoEl, { scale: 1, duration: 0.35, ease: 'power2.out' })
      );

      // Link underline hover via GSAP
      linksEl?.querySelectorAll('.nav-link').forEach(link => {
        const bar = link.querySelector('.nav-bar');
        link.addEventListener('mouseenter', () =>
          gsap.to(bar, { scaleX: 1, duration: 0.25, ease: 'power2.out', transformOrigin: 'left' })
        );
        link.addEventListener('mouseleave', () =>
          gsap.to(bar, { scaleX: 0, duration: 0.2, ease: 'power2.in', transformOrigin: 'right' })
        );
      });
    });

    return () => window.removeEventListener('scroll', onScroll);
  });

  onDestroy(() => { ctx?.revert(); });
</script>

<nav
  bind:this={nav}
  class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
  style="
    background: {scrolled ? 'rgba(8,8,8,0.92)' : 'transparent'};
    backdrop-filter: {scrolled ? 'blur(16px) saturate(180%)' : 'none'};
    border-bottom: 1px solid {scrolled ? 'var(--border)' : 'transparent'};
  "
>
  <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">

    <!-- Logo -->
    <a bind:this={logoEl} href="/"
       class="text-xs font-bold tracking-[0.28em] uppercase text-gradient inline-block">VTB</a>

    <!-- Desktop nav -->
    <ul bind:this={linksEl} class="hidden md:flex items-center gap-10">
      {#each pages as { label, href }}
        <li>
          <a {href} class="nav-link sec-num hover:text-[var(--text)] transition-colors duration-200 relative block py-1">
            {label}
            <span class="nav-bar absolute bottom-0 left-0 w-full h-px origin-left scale-x-0"
                  style="background: var(--accent)"></span>
          </a>
        </li>
      {/each}
    </ul>

    <!-- Desktop right -->
    <div class="hidden md:flex items-center gap-6">
      {#if getSocial('github')}
        <a href={getSocial('github')} target="_blank" rel="noopener"
           class="sec-num hover:text-[var(--text)] transition-colors duration-200">GitHub</a>
      {/if}
      {#if getSocial('linkedin')}
        <a href={getSocial('linkedin')} target="_blank" rel="noopener"
           class="sec-num hover:text-[var(--text)] transition-colors duration-200">LinkedIn</a>
      {/if}
      <a bind:this={ctaEl} href="#contact"
         class="sec-num px-4 py-2 btn btn-primary" data-magnetic>Hire Me →</a>
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
