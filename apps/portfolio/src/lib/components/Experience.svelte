<script>
  import { reveal } from '$lib/actions/reveal.js';

  export let experiences = [];
  export let education   = [];
</script>

<section id="work" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <div use:reveal class="mb-14">
    <span class="sec-num">03 / Work</span>
  </div>

  <!-- Work experience -->
  {#if experiences.length}
    <div class="space-y-0 mb-24">
      {#each experiences as exp, i}
        <div use:reveal={{ delay: i * 60 }}
             class="grid sm:grid-cols-[48px_1fr] gap-6 py-10 border-b border-[var(--border)] group">

          <!-- Index -->
          <span class="sec-num pt-1 tabular-nums">
            {String(i + 1).padStart(2, '0')}
          </span>

          <!-- Content -->
          <div class="space-y-3">
            <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 class="text-lg font-semibold tracking-tight" style="color: var(--text)">
                {exp.role}
                <span class="font-normal ml-2" style="color: var(--muted)">@ {exp.company}</span>
              </h3>
              <span class="sec-num tabular-nums shrink-0">
                {exp.start_date ?? ''}{exp.end_date || exp.is_current ? ` — ${exp.is_current ? 'Present' : exp.end_date}` : ''}
              </span>
            </div>

            {#if exp.location}
              <p class="sec-num">{exp.location}</p>
            {/if}

            {#if exp.description}
              <p class="text-sm leading-relaxed" style="color: var(--muted)">{exp.description}</p>
            {/if}

            {#if exp.technologies?.length}
              <div class="flex flex-wrap gap-2 pt-1">
                {#each exp.technologies as tech}
                  <span class="tag">{tech}</span>
                {/each}
              </div>
            {/if}

            {#if exp.is_current}
              <span class="inline-flex items-center gap-1.5 sec-num" style="color: var(--accent)">
                <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: var(--accent)"></span>
                Current
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Education -->
  {#if education.length}
    <div use:reveal class="mb-10">
      <span class="sec-num">Education</span>
    </div>

    <div class="space-y-0">
      {#each education as edu, i}
        <div use:reveal={{ delay: i * 60 }}
             class="grid sm:grid-cols-[48px_1fr] gap-6 py-10 border-b border-[var(--border)]">
          <span class="sec-num pt-1 tabular-nums">{String(i + 1).padStart(2, '0')}</span>

          <div class="space-y-2">
            <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 class="text-lg font-semibold tracking-tight" style="color: var(--text)">
                {edu.degree}
                <span class="font-normal ml-2" style="color: var(--muted)">@ {edu.institution}</span>
              </h3>
              <span class="sec-num tabular-nums shrink-0">
                {edu.start_date ?? ''}{edu.end_date ? ` — ${edu.end_date}` : ''}
              </span>
            </div>
            {#if edu.field}
              <p class="sec-num">{edu.field}</p>
            {/if}
            {#if edu.gpa}
              <p class="sec-num">GPA: {edu.gpa}</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if !experiences.length && !education.length}
    <p class="sec-num">Experience entries will appear once added via the admin panel.</p>
  {/if}
</section>
