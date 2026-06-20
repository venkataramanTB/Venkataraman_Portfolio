<script>
  import { reveal } from '$lib/actions/reveal.js';

  export let certificates  = [];
  export let achievements  = [];

  $: certsByCategory = certificates.reduce((acc, c) => {
    const cat = c.category || 'Other';
    (acc[cat] ??= []).push(c);
    return acc;
  }, {});
</script>

<section id="recognition" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <div use:reveal class="mb-14">
    <span class="sec-num">05 / Recognition</span>
  </div>

  <!-- Achievements -->
  {#if achievements.length}
    <div class="mb-20 space-y-0">
      {#each achievements as ach, i}
        <div use:reveal={{ delay: i * 50 }}
             class="grid sm:grid-cols-[48px_1fr] gap-6 py-8 border-b border-[var(--border)]">
          <span class="sec-num pt-1 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
          <div class="space-y-2">
            <div class="flex items-baseline gap-3">
              {#if ach.icon}<span class="text-lg">{ach.icon}</span>{/if}
              <h3 class="text-base font-semibold tracking-tight" style="color: var(--text)">{ach.title}</h3>
              {#if ach.date}<span class="sec-num ml-auto shrink-0">{ach.date}</span>{/if}
            </div>
            {#if ach.description}
              <p class="text-sm leading-relaxed" style="color: var(--muted)">{ach.description}</p>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Certificates -->
  {#if certificates.length}
    <div use:reveal class="mb-10">
      <span class="sec-num">Certifications</span>
    </div>

    <div class="space-y-10">
      {#each Object.entries(certsByCategory) as [cat, certs], gi}
        <div use:reveal={{ delay: gi * 60 }}>
          <p class="sec-num mb-5">{cat}</p>
          <div class="space-y-0">
            {#each certs as cert}
              <div class="flex items-baseline justify-between gap-6 py-4 border-b border-[var(--border)] group">
                <div class="flex items-start gap-4 min-w-0">
                  <p class="text-sm font-medium leading-snug group-hover:text-[var(--text)] transition-colors duration-200"
                     style="color: var(--muted)">
                    {cert.title}
                  </p>
                </div>
                <div class="flex items-center gap-6 shrink-0">
                  <span class="sec-num">{cert.issuer}</span>
                  {#if cert.issued_date}
                    <span class="sec-num tabular-nums">{cert.issued_date}</span>
                  {/if}
                  {#if cert.credential_url}
                    <a href={cert.credential_url} target="_blank" rel="noopener"
                       class="sec-num hover:text-[var(--accent)] transition-colors duration-200">↗</a>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  {#if !certificates.length && !achievements.length}
    <p class="sec-num">Recognition will appear once added via the admin panel.</p>
  {/if}
</section>
