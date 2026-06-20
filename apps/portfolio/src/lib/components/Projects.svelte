<script>
  import { reveal } from '$lib/actions/reveal.js';

  export let projects = [];

  $: featured = projects.filter(p => p.is_featured);
  $: rest     = projects.filter(p => !p.is_featured);
  $: display  = [...featured, ...rest];
</script>

<section id="projects" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <div use:reveal class="mb-14">
    <span class="sec-num">04 / Projects</span>
  </div>

  {#if display.length}
    <div class="space-y-0">
      {#each display as proj, i}
        <div use:reveal={{ delay: i * 50 }}
             class="group py-10 border-b border-[var(--border)] transition-colors duration-300">
          <div class="grid sm:grid-cols-[48px_1fr_auto] gap-6 items-start">

            <!-- Index -->
            <span class="sec-num pt-1 tabular-nums">
              {String(i + 1).padStart(2, '0')}
            </span>

            <!-- Body -->
            <div class="space-y-3 min-w-0">
              <div class="flex flex-wrap items-center gap-3">
                <h3 class="text-lg font-semibold tracking-tight transition-colors duration-200"
                    style="color: var(--text)">
                  {proj.title}
                </h3>
                {#if proj.is_featured}
                  <span class="sec-num px-2 py-0.5 border border-[var(--accent)] text-[var(--accent)]"
                        style="font-size:0.6rem">Featured</span>
                {/if}
                {#if proj.category}
                  <span class="sec-num">{proj.category}</span>
                {/if}
              </div>

              {#if proj.description}
                <p class="text-sm leading-relaxed" style="color: var(--muted)">{proj.description}</p>
              {/if}

              {#if proj.technologies?.length}
                <div class="flex flex-wrap gap-2 pt-1">
                  {#each proj.technologies.slice(0, 6) as tech}
                    <span class="tag">{tech}</span>
                  {/each}
                  {#if proj.technologies.length > 6}
                    <span class="tag">+{proj.technologies.length - 6}</span>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Links -->
            <div class="flex flex-col gap-2 shrink-0 pt-1">
              {#if proj.demo_url}
                <a href={proj.demo_url} target="_blank" rel="noopener"
                   class="sec-num hover:text-[var(--accent)] transition-colors duration-200 whitespace-nowrap">
                  Live →
                </a>
              {/if}
              {#if proj.github_url}
                <a href={proj.github_url} target="_blank" rel="noopener"
                   class="sec-num hover:text-[var(--text)] transition-colors duration-200 whitespace-nowrap">
                  Code →
                </a>
              {/if}
              {#if proj.appstore_url}
                <a href={proj.appstore_url} target="_blank" rel="noopener"
                   class="sec-num hover:text-[var(--text)] transition-colors duration-200 whitespace-nowrap">
                  App Store →
                </a>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="sec-num">Projects will appear once added via the admin panel.</p>
  {/if}
</section>
