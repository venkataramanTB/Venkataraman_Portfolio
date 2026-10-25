<script>
  /**
   * Console chrome: identity bar plus a section rail.
   *
   * Top navigation rather than a left sidebar — this console has eleven flat
   * sections with no hierarchy between them, and a rail across the top keeps
   * the full working width for the tables, which are the point.
   */
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { logout } from '$lib/stores/auth.js';
  import { goto } from '$app/navigation';
  import ThemeSwitch from './ThemeSwitch.svelte';
  import Icon from './Icon.svelte';

  // Labels name their contents. The numeric codes the old console showed
  // alongside them were decoration — nobody navigates by "07".
  const navItems = [
    { href: '/dashboard',              label: 'Overview',     icon: 'overview' },
    { href: '/dashboard/profile',      label: 'Profile',      icon: 'profile' },
    { href: '/dashboard/skills',       label: 'Skills',       icon: 'stack' },
    { href: '/dashboard/experience',   label: 'Experience',   icon: 'work' },
    { href: '/dashboard/projects',     label: 'Projects',     icon: 'projects' },
    { href: '/dashboard/certificates', label: 'Certificates', icon: 'verify' },
    { href: '/dashboard/achievements', label: 'Achievements', icon: 'achievements' },
    { href: '/dashboard/education',    label: 'Education',    icon: 'education' },
    { href: '/dashboard/stats',        label: 'Stats',        icon: 'stats' },
    { href: '/dashboard/social',       label: 'Social',       icon: 'link' },
    { href: '/dashboard/cv',           label: 'CV Import',    icon: 'document' },
  ];

  let open = false;

  $: current = navItems.find((i) => `${base}${i.href}` === $page.url.pathname);

  function handleLogout() {
    logout();
    goto(`${base}/login`);
  }
</script>

<header class="nav glass">
  <!-- Identity bar -->
  <div class="bar">
    <a href={`${base}/dashboard`} class="brand">
      <span class="brand-mark" aria-hidden="true">V</span>
      <span class="brand-text">Control</span>
    </a>

    <span class="crumb">{current ? current.label : 'Console'}</span>

    <div class="bar-tail">
      <ThemeSwitch />

      <!-- Absolute root: the portfolio lives at / even when this console is
           mounted under a base path on the same origin. -->
      <a href="/" class="icon-btn" aria-label="View the portfolio" title="View the portfolio">
        <Icon name="site" size={16} />
      </a>

      <button on:click={handleLogout} class="icon-btn" aria-label="Sign out" title="Sign out">
        <Icon name="logout" size={16} />
      </button>

      <button
        class="icon-btn bar-toggle"
        on:click={() => (open = !open)}
        aria-expanded={open}
        aria-controls="nav-tabs"
        aria-label={open ? 'Close sections' : 'Show sections'}
      >
        <Icon name={open ? 'close' : 'menu'} size={17} />
      </button>
    </div>
  </div>

  <!-- Section rail -->
  <nav id="nav-tabs" class="tabs" class:tabs-open={open} aria-label="Sections">
    {#each navItems as item}
      {@const active = $page.url.pathname === `${base}${item.href}`}
      <a
        href={`${base}${item.href}`}
        class="tab"
        class:is-active={active}
        aria-current={active ? 'page' : undefined}
        on:click={() => (open = false)}
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
    border-left: 0;
    border-right: 0;
    border-top: 0;
    border-radius: 0;
  }

  /* ─── Identity bar ─────────────────────────────────────────────────────── */
  .bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.5rem 1rem;
    min-height: 3rem;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    flex-shrink: 0;
  }
  .brand-mark {
    display: grid;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: var(--r-full);
    background: var(--fill);
    color: var(--fill-text);
    font-size: 0.8125rem;
    font-weight: 680;
    letter-spacing: -0.02em;
  }
  .brand-text {
    font-size: 0.9375rem;
    font-weight: 620;
    letter-spacing: -0.014em;
    color: var(--text);
  }

  .crumb {
    flex: 1;
    min-width: 0;
    font-size: 0.875rem;
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-tail {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .icon-btn {
    display: grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border: 0;
    border-radius: var(--r-full);
    background: transparent;
    color: var(--text-3);
    cursor: pointer;
    text-decoration: none;
    transition: background-color 180ms var(--ease-soft), color 180ms var(--ease-soft);
  }
  .icon-btn:hover {
    background: var(--bg-sunk);
    color: var(--text);
  }

  .bar-toggle { display: none; }

  /* ─── Section rail ─────────────────────────────────────────────────────── */
  .tabs {
    display: flex;
    gap: 0.125rem;
    padding: 0 0.75rem 0.5rem;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .tabs::-webkit-scrollbar { display: none; }

  .tab {
    display: inline-flex;
    align-items: center;
    gap: 0.4375rem;
    padding: 0.4375rem 0.75rem;
    flex-shrink: 0;
    border-radius: var(--r-full);
    text-decoration: none;
    font-size: 0.84375rem;
    font-weight: 520;
    letter-spacing: -0.004em;
    color: var(--text-3);
    white-space: nowrap;
    transition: background-color 180ms var(--ease-soft), color 180ms var(--ease-soft);
  }
  .tab:hover {
    background: var(--bg-sunk);
    color: var(--text);
  }
  .tab.is-active {
    background: var(--fill);
    color: var(--fill-text);
  }

  /* ─── Narrow ───────────────────────────────────────────────────────────── */
  @media (max-width: 54rem) {
    .bar-toggle { display: grid; }

    /* The rail becomes a disclosed list rather than a horizontal scroller:
       eleven items scrolled sideways on a phone hides most of them with no
       indication they exist. */
    .tabs {
      display: none;
      flex-direction: column;
      gap: 0.125rem;
      padding: 0 0.5rem 0.5rem;
      max-height: 60dvh;
      overflow-y: auto;
    }
    .tabs-open { display: flex; }

    .tab {
      border-radius: var(--r-md);
      padding: 0.625rem 0.75rem;
    }
    .crumb { font-size: 0.8125rem; }
  }
</style>
