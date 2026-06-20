<script>
  import { reveal } from '$lib/actions/reveal.js';

  export let skills = [];

  $: grouped = skills.reduce((acc, s) => {
    (acc[s.category] ??= []).push(s);
    return acc;
  }, {});

  $: categories = Object.keys(grouped);
</script>

<section id="skills" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <div use:reveal class="mb-14">
    <span class="sec-num">02 / Skills</span>
  </div>

  {#if categories.length}
    <div class="space-y-10">
      {#each categories as cat, i}
        <div use:reveal={{ delay: i * 60 }} class="grid sm:grid-cols-[160px_1fr] gap-4 sm:gap-8 items-start">
          <span class="sec-num pt-1 shrink-0">{cat}</span>
          <div class="flex flex-wrap gap-2">
            {#each grouped[cat] as skill}
              <span class="tag">{skill.name}</span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <p class="sec-num">Skills will appear once added via the admin panel.</p>
  {/if}
</section>
