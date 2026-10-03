<script>
  import { page } from '$app/stores';
  import { logout } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import ThemeSwitch from './ThemeSwitch.svelte';
  import Icon from './Icon.svelte';

  // Index codes instead of emoji. No rocketships, no graduation caps.
  const navItems = [
    { href: '/dashboard',              code: '00', label: 'Overview',     icon: 'index' },
    { href: '/dashboard/profile',      code: '01', label: 'Profile',      icon: 'profile' },
    { href: '/dashboard/skills',       code: '02', label: 'Skills',       icon: 'stack' },
    { href: '/dashboard/experience',   code: '03', label: 'Experience',   icon: 'work' },
    { href: '/dashboard/projects',     code: '04', label: 'Projects',     icon: 'projects' },
    { href: '/dashboard/certificates', code: '05', label: 'Certificates', icon: 'verify' },
    { href: '/dashboard/achievements', code: '06', label: 'Achievements', icon: 'achievements' },
    { href: '/dashboard/education',    code: '07', label: 'Education',    icon: 'education' },
    { href: '/dashboard/stats',        code: '08', label: 'Stats',        icon: 'stats' },
    { href: '/dashboard/social',       code: '09', label: 'Social',       icon: 'link' },
    { href: '/dashboard/cv',           code: '10', label: 'CV Import',    icon: 'document' },
  ];

  let open = false;

  $: current = navItems.find((i) => i.href === $page.url.pathname);

  function handleLogout() {
    logout();
    goto('/login');
  }
</script>

<header class="nav">
  <!-- Identity bar -->
  <div class="bar">
    <a href="/dashboard" class="brand">
      <span class="brand-name">VTB</span>
      <span class="brand-sub">Control</span>
    </a>

    <span class="t-micro crumb">
      {#if current}
        <span class="crumb-code">{current.code}</span> / {current.label}
      {:else}
        Console
      {/if}
    </span>

    <div class="bar-tail">
      <ThemeSwitch />
      <a href="/" class="btn btn-ghost bar-btn" aria-label="View site" title="View site">
        <Icon name="site" size={15} />
      </a>
      <button on:click={handleLogout} class="btn btn-ghost bar-btn"
              aria-label="Sign out" title="Sign out">
        <Icon name="logout" size={15} />
      </button>
      <button
        class="btn btn-ghost bar-btn bar-toggle"
        on:click={() => (open = !open)}
        aria-expanded={open}
        aria-controls="nav-tabs"
        aria-label={open ? 'Close sections' : 'Show sections'}
        title={open ? 'Close sections' : 'Show sections'}
      >
        <Icon name={open ? 'close' : 'menu'} size={16} />
      </button>
    </div>
  </div>

  <!-- Section tabs: top navigation, not a left rail -->
  <nav id="nav-tabs" class="tabs" class:tabs-open={open} aria-label="Sections">
    {#each navItems as item}
      {@const active = $page.url.pathname === item.href}
      <a
        href={item.href}
        class="tab"
        class:is-active={active}
        aria-current={active ? 'page' : undefined}
        on:click={() => (open = false)}
        aria-label={item.label}
        title={item.label}
      >
        <Icon name={item.icon} size={16} />
        <span class="tab-label">{item.label}</span>
      </a>
    {/each}
  </nav>
</header>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: var(--z-nav);
    background: var(--paper);
    border-bottom: 1px solid var(--rule-strong);
  }

  /* ─── Identity bar ─────────────────────────────────────────────────────── */
  .bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0 1rem;
    min-height: 3rem;
    border-bottom: 1px solid var(--rule);
  }

  .brand {
    display: flex;
    align-items: baseline;
    gap: 0.4rem;
    text-decoration: none;
    padding-right: 1rem;
    border-right: 1px solid var(--rule);
  }
  .brand-name {
    font-family: var(--font-display);
    font-weight: 900;
    font-size: 1rem;
    letter-spacing: -0.025em;
    color: var(--ink);
  }
  .brand-sub {
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--ink-4);
  }

  .crumb { flex: 1; color: var(--ink-3); }
  .crumb-code { color: var(--hazard); font-weight: 600; }

  .bar-tail { display: flex; align-items: center; gap: 0.5rem; }
  .bar-btn { padding: 0.35rem 0.5rem; }
  .bar-toggle { display: none; }

  /* ─── Tabs ─────────────────────────────────────────────────────────────── */
  .tabs {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .tabs::-webkit-scrollbar { display: none; }

  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.5rem 0.8rem;
    flex-shrink: 0;
    border-right: 1px solid var(--rule);
    text-decoration: none;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-3);
    transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out);
  }
  .tab:hover { background: var(--paper-sunk); color: var(--ink); }

  .tab.is-active {
    background: var(--ink);
    color: var(--paper);
  }

  .tab-label { display: none; }

  @media (max-width: 860px) {
    .tab-label { display: inline; }
  }

  /* ─── Mobile: collapse tabs behind the toggle ──────────────────────────── */
  @media (max-width: 860px) {
    .bar-toggle { display: inline-flex; }
    .tabs {
      display: none;
      flex-direction: column;
      overflow: visible;
    }
    .tabs-open { display: flex; }
    .tab {
      border-right: 0;
      border-bottom: 1px solid var(--rule);
      padding: 0.6875rem 1rem;
    }
  }
</style>
