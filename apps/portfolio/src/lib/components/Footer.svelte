<script>
  export let profile     = null;
  export let socialLinks = [];
  const year = new Date().getFullYear();
</script>

<footer class="py-10 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-10" />
  <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <p class="sec-num">
      © {year} {profile?.name ?? 'Venkataraman TB'} — Built with SvelteKit + GSAP
    </p>
    <div class="flex items-center gap-6">
      {#each socialLinks as link}
        <a href={link.url} target="_blank" rel="noopener"
           class="sec-num hover:text-[var(--text)] transition-colors duration-200">
          {link.platform}
        </a>
      {/each}
      <a href="#home" class="sec-num hover:text-[var(--text)] transition-colors duration-200">
        ↑ Top
      </a>
    </div>
  </div>
</footer>
