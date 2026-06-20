<script>
  import { reveal } from '$lib/actions/reveal.js';

  export let profile     = null;
  export let socialLinks = [];
</script>

<section id="contact" class="py-32 px-6 max-w-5xl mx-auto">
  <hr class="divider mb-16" />

  <div use:reveal class="mb-14">
    <span class="sec-num">06 / Contact</span>
  </div>

  <div class="grid lg:grid-cols-2 gap-20 items-start">

    <!-- Left: heading + email CTA -->
    <div class="space-y-8">
      <h2 use:reveal={{ delay: 80 }}
          class="text-4xl sm:text-5xl font-bold tracking-tight leading-tight" style="color: var(--text)">
        Let's build<br />something great.
      </h2>

      <p use:reveal={{ delay: 140 }} class="text-sm leading-relaxed" style="color: var(--muted)">
        Whether it's a job opportunity, a project collaboration,<br class="hidden sm:block" />
        or just a chat about AI — my inbox is always open.
      </p>

      {#if profile?.email}
        <div use:reveal={{ delay: 200 }}>
          <a href="mailto:{profile.email}"
             class="inline-flex items-center gap-3 group"
             style="color: var(--text)">
            <span class="text-lg sm:text-xl font-semibold tracking-tight
                         border-b border-[var(--border)] group-hover:border-[var(--accent)]
                         transition-colors duration-200">
              {profile.email}
            </span>
            <span class="sec-num group-hover:text-[var(--accent)] transition-colors duration-200">↗</span>
          </a>
        </div>
      {/if}

      <!-- Availability -->
      <div use:reveal={{ delay: 260 }} class="inline-flex items-center gap-2 sec-num">
        <span class="w-1.5 h-1.5 rounded-full {profile?.open_to_work !== false ? 'animate-pulse' : ''}"
              style="background: {profile?.open_to_work !== false ? 'var(--accent)' : 'var(--muted)'}"></span>
        {profile?.open_to_work !== false ? 'Open to new opportunities' : 'Currently not available'}
      </div>
    </div>

    <!-- Right: social links -->
    <div use:reveal={{ delay: 120 }} class="space-y-6">
      {#if profile?.location}
        <div class="py-5 border-b border-[var(--border)] flex items-center justify-between">
          <span class="sec-num">Location</span>
          <span class="sec-num" style="color: var(--text)">{profile.location}</span>
        </div>
      {/if}

      {#each socialLinks as link}
        <div class="py-5 border-b border-[var(--border)] flex items-center justify-between group">
          <span class="sec-num">{link.platform}</span>
          <a href={link.url} target="_blank" rel="noopener"
             class="sec-num hover:text-[var(--accent)] transition-colors duration-200">
            {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')} →
          </a>
        </div>
      {/each}

      {#if profile?.phone}
        <div class="py-5 border-b border-[var(--border)] flex items-center justify-between">
          <span class="sec-num">Phone</span>
          <span class="sec-num" style="color: var(--text)">{profile.phone}</span>
        </div>
      {/if}
    </div>
  </div>
</section>
