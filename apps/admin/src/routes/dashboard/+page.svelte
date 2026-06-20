<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';

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

  $: counts = data ? [
    { label: 'Projects',      value: data.projects?.length ?? 0,      href: '/dashboard/projects',     icon: '🚀' },
    { label: 'Skills',        value: data.skills?.length ?? 0,         href: '/dashboard/skills',       icon: '⚡' },
    { label: 'Certificates',  value: data.certificates?.length ?? 0,   href: '/dashboard/certificates', icon: '🏅' },
    { label: 'Achievements',  value: data.achievements?.length ?? 0,   href: '/dashboard/achievements', icon: '🏆' },
    { label: 'Experience',    value: data.experiences?.length ?? 0,    href: '/dashboard/experience',   icon: '💼' },
    { label: 'Education',     value: data.education?.length ?? 0,      href: '/dashboard/education',    icon: '🎓' },
  ] : [];
</script>

<svelte:head><title>Dashboard — VTB Admin</title></svelte:head>

<div class="space-y-8">
  <div>
    <h1 class="text-3xl font-black text-white mb-1">Dashboard</h1>
    <p class="text-slate-500 text-sm">Portfolio content overview</p>
  </div>

  {#if loading}
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-5">
      {#each Array(6) as _}
        <div class="glass rounded-2xl border border-border p-6 animate-pulse">
          <div class="w-8 h-8 rounded-lg bg-white/5 mb-3"></div>
          <div class="h-8 w-12 bg-white/5 rounded mb-2"></div>
          <div class="h-4 w-20 bg-white/5 rounded"></div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-5">
      {#each counts as item}
        <a
          href={item.href}
          class="glass rounded-2xl border border-border p-6 hover:border-primary/30 transition-all duration-300 group"
        >
          <span class="text-3xl mb-3 block">{item.icon}</span>
          <p class="text-4xl font-black text-white mb-1 group-hover:gradient-text transition-all">{item.value}</p>
          <p class="text-sm text-slate-500">{item.label}</p>
        </a>
      {/each}
    </div>

    {#if data?.profile}
      <div class="glass rounded-2xl border border-border p-6">
        <h2 class="font-bold text-white mb-3">Profile</h2>
        <div class="grid sm:grid-cols-2 gap-4 text-sm">
          <div><span class="text-slate-500">Name:</span> <span class="text-slate-200 ml-2">{data.profile.name}</span></div>
          <div><span class="text-slate-500">Email:</span> <span class="text-slate-200 ml-2">{data.profile.email ?? '—'}</span></div>
          <div><span class="text-slate-500">Location:</span> <span class="text-slate-200 ml-2">{data.profile.location ?? '—'}</span></div>
          <div>
            <span class="text-slate-500">Status:</span>
            <span class="ml-2 {data.profile.open_to_work ? 'text-green-400' : 'text-slate-400'}">
              {data.profile.open_to_work ? '● Open to work' : '○ Not available'}
            </span>
          </div>
        </div>
        <a href="/dashboard/profile" class="mt-4 inline-flex text-xs text-primary hover:text-white transition-colors">Edit profile →</a>
      </div>
    {:else}
      <div class="glass rounded-2xl border border-border p-6 text-center text-slate-500">
        No profile created yet. <a href="/dashboard/profile" class="text-primary hover:text-white transition-colors">Create one →</a>
      </div>
    {/if}
  {/if}
</div>
