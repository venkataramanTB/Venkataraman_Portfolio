<script>
  export let profile = null;
  export let socialLinks = [];
  const year = new Date().getFullYear();
</script>

<footer class="border-t border-border py-10">
  <div class="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
    <p class="text-slate-600 text-sm">
      © {year} <span class="gradient-text font-semibold">{profile?.name ?? 'Venkataraman TB'}</span>. Built with Svelte, GSAP & Three.js.
    </p>

    <div class="flex items-center gap-5">
      {#each socialLinks as link}
        <a
          href={link.url} target="_blank" rel="noopener"
          class="text-slate-600 hover:text-primary transition-colors text-sm capitalize"
        >{link.platform}</a>
      {/each}
    </div>
  </div>
</footer>
