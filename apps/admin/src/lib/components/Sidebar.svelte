<script>
  import { page } from '$app/stores';
  import { logout } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';

  const navItems = [
    { href: '/dashboard',       label: 'Dashboard',     icon: '⬡' },
    { href: '/dashboard/profile',      label: 'Profile',       icon: '👤' },
    { href: '/dashboard/skills',       label: 'Skills',        icon: '⚡' },
    { href: '/dashboard/experience',   label: 'Experience',    icon: '💼' },
    { href: '/dashboard/projects',     label: 'Projects',      icon: '🚀' },
    { href: '/dashboard/certificates', label: 'Certificates',  icon: '🏅' },
    { href: '/dashboard/achievements', label: 'Achievements',  icon: '🏆' },
    { href: '/dashboard/education',    label: 'Education',     icon: '🎓' },
    { href: '/dashboard/stats',        label: 'Stats',         icon: '📊' },
    { href: '/dashboard/social',       label: 'Social Links',  icon: '🔗' },
    { href: '/dashboard/cv',           label: 'CV Import',     icon: '📄' },
  ];

  function handleLogout() {
    logout();
    goto('/login');
  }
</script>

<aside class="w-64 shrink-0 h-screen sticky top-0 flex flex-col glass border-r border-border overflow-y-auto">
  <!-- Logo -->
  <div class="px-6 py-6 border-b border-border">
    <a href="/dashboard" class="text-lg font-bold gradient-text">VTB Admin</a>
    <p class="text-xs text-slate-600 mt-0.5">Portfolio Control Panel</p>
  </div>

  <!-- Nav -->
  <nav class="flex-1 px-3 py-4 space-y-1">
    {#each navItems as item}
      {@const active = $page.url.pathname === item.href}
      <a
        href={item.href}
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
        class:bg-primary={active}
        class:text-dark={active}
        class:font-semibold={active}
        class:text-slate-400={!active}
        class:hover:bg-white={!active}
        class:hover:bg-opacity-5={!active}
        class:hover:text-white={!active}
      >
        <span class="text-base">{item.icon}</span>
        {item.label}
      </a>
    {/each}
  </nav>

  <!-- Logout -->
  <div class="px-3 py-4 border-t border-border">
    <button
      on:click={handleLogout}
      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all duration-200"
    >
      <span>↩</span> Logout
    </button>
  </div>
</aside>
