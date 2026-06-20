<script>
  import { onMount } from 'svelte';
  import { gsap } from 'gsap';

  let scrolled = false;
  let menuOpen = false;

  const links = [
    { label: 'About',        href: '#about' },
    { label: 'Skills',       href: '#skills' },
    { label: 'Experience',   href: '#experience' },
    { label: 'Projects',     href: '#projects' },
    { label: 'Certificates', href: '#certificates' },
    { label: 'Contact',      href: '#contact' },
  ];

  onMount(() => {
    gsap.fromTo('nav', { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.5 });

    const onScroll = () => { scrolled = window.scrollY > 20; };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>

<nav
  class="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
  class:glass={scrolled}
  class:border-b={scrolled}
  class:border-border={scrolled}
>
  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <!-- Logo -->
    <a href="/" class="text-xl font-bold gradient-text tracking-tight">
      VTB<span class="text-white opacity-30">.</span>
    </a>

    <!-- Desktop links -->
    <ul class="hidden md:flex items-center gap-8">
      {#each links as { label, href }}
        <li>
          <a
            {href}
            class="text-sm text-slate-400 hover:text-white transition-colors duration-200 relative group"
          >
            {label}
            <span class="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full"></span>
          </a>
        </li>
      {/each}
    </ul>

    <!-- CTA -->
    <a
      href="#contact"
      class="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-dark transition-all duration-300"
    >
      Hire Me
    </a>

    <!-- Mobile burger -->
    <button
      class="md:hidden flex flex-col gap-1.5 p-2"
      on:click={() => menuOpen = !menuOpen}
      aria-label="Toggle menu"
    >
      <span class="w-6 h-0.5 bg-white transition-all" class:rotate-45={menuOpen} class:translate-y-2={menuOpen}></span>
      <span class="w-6 h-0.5 bg-white transition-all" class:opacity-0={menuOpen}></span>
      <span class="w-6 h-0.5 bg-white transition-all" class:-rotate-45={menuOpen} class:-translate-y-2={menuOpen}></span>
    </button>
  </div>

  <!-- Mobile menu -->
  {#if menuOpen}
    <div class="md:hidden glass border-t border-border px-6 py-6 flex flex-col gap-4">
      {#each links as { label, href }}
        <a {href} class="text-slate-300 hover:text-white transition-colors" on:click={() => menuOpen = false}>{label}</a>
      {/each}
      <a href="#contact" class="mt-2 px-5 py-2.5 rounded-full text-sm font-medium text-center bg-primary text-dark" on:click={() => menuOpen = false}>Hire Me</a>
    </div>
  {/if}
</nav>
