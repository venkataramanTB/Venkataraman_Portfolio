<script>
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import Icon from '$lib/components/Icon.svelte';

  let data = null;
  let loading = true;

  onMount(async () => {
    try {
      data = await api.getPortfolio();
    } catch {
      data = {};
    } finally {
      loading = false;
    }
  });

  // Icons come from the shared set, not emoji: emoji render differently on
  // every platform, cannot inherit the text colour, and read as placeholder
  // art in a tool the owner uses daily.
  $: counts = data ? [
    { label: 'Projects',      value: data.projects?.length ?? 0,      href: '/dashboard/projects',     icon: 'projects' },
    { label: 'Skills',        value: data.skills?.length ?? 0,         href: '/dashboard/skills',       icon: 'stack' },
    { label: 'Certificates',  value: data.certificates?.length ?? 0,   href: '/dashboard/certificates', icon: 'verify' },
    { label: 'Achievements',  value: data.achievements?.length ?? 0,   href: '/dashboard/achievements', icon: 'achievements' },
    { label: 'Experience',    value: data.experiences?.length ?? 0,    href: '/dashboard/experience',   icon: 'work' },
    { label: 'Education',     value: data.education?.length ?? 0,      href: '/dashboard/education',    icon: 'education' },
  ] : [];
</script>

<svelte:head><title>Dashboard — VTB Admin</title></svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="t-display mb-1">Dashboard</h1>
    <p class="text-ink-3 text-sm">Portfolio content overview</p>
  </div>

  {#if loading}
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-5">
      {#each Array(6) as _}
        <div class="panel p-6">
          <div class="w-8 h-8 rounded-lg bg-ink/5 mb-3"></div>
          <div class="h-8 w-12 bg-ink/5 rounded mb-2"></div>
          <div class="h-4 w-20 bg-ink/5 rounded"></div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-5">
      {#each counts as item}
        <a href={`${base}${item.href}`} class="panel stat-card group">
          <span class="stat-icon" aria-hidden="true">
            <Icon name={item.icon} size={18} />
          </span>
          <p class="stat-figure">{item.value}</p>
          <p class="text-sm text-ink-3">{item.label}</p>
        </a>
      {/each}
    </div>

    {#if data?.profile}
      <div class="panel p-6">
        <h2 class="font-bold text-ink mb-3">Profile</h2>
        <div class="grid sm:grid-cols-2 gap-4 text-sm">
          <div><span class="text-ink-3">Name:</span> <span class="text-ink-2 ml-2">{data.profile.name}</span></div>
          <div><span class="text-ink-3">Email:</span> <span class="text-ink-2 ml-2">{data.profile.email ?? '—'}</span></div>
          <div><span class="text-ink-3">Location:</span> <span class="text-ink-2 ml-2">{data.profile.location ?? '—'}</span></div>
          <div>
            <span class="text-ink-3">Status:</span>
            <span class="ml-2 {data.profile.open_to_work ? 'text-ink font-semibold' : 'text-ink-3'}">
              {data.profile.open_to_work ? '● Open to work' : '○ Not available'}
            </span>
          </div>
        </div>
        <a href="{base}/dashboard/profile" class="mt-4 inline-flex text-xs text-primary hover:text-ink transition-colors">Edit profile →</a>
      </div>
    {:else}
      <div class="panel p-6 text-center text-ink-3">
        No profile created yet. <a href="{base}/dashboard/profile" class="text-primary hover:text-ink transition-colors">Create one →</a>
      </div>
    {/if}
  {/if}
</div>

<style>
  .stat-card {
    display: block;
    padding: 1.25rem 1.375rem;
    text-decoration: none;
    transition: border-color 200ms var(--ease-soft), box-shadow 200ms var(--ease-soft),
      transform 140ms var(--ease-out);
  }
  .stat-card:hover {
    border-color: var(--hairline-strong);
    box-shadow: var(--e2);
  }
  /* Feedback on press, not on release. */
  .stat-card:active {
    transform: scale(0.99);
  }

  .stat-icon {
    display: grid;
    place-items: center;
    width: 2.125rem;
    height: 2.125rem;
    margin-bottom: 0.875rem;
    border-radius: var(--r-sm);
    background: var(--accent-soft);
    color: var(--accent-text);
  }

  @media (prefers-reduced-motion: reduce) {
    .stat-card:active { transform: none; }
  }
</style>
