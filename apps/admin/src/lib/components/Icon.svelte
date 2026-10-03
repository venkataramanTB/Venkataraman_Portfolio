<script>
  /**
   * Inline icon set — no dependency, one consistent stroke weight.
   * Geometry is deliberately squared (miter joins, square caps, 90° corners)
   * to match the industrial system rather than the rounded Lucide/Feather look.
   *
   * Usage: <Icon name="work" />            decorative, inherits currentColor
   *        <Icon name="work" label="Work"/> standalone + accessible name
   */
  export let name = 'dot';
  export let size = 16;
  /** Set when the icon is the only content of a control. */
  export let label = '';
  /** Stroke weight in viewBox units. */
  export let weight = 1.75;
</script>

<svg
  class="icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={weight}
  stroke-linecap="square"
  stroke-linejoin="miter"
  role={label ? 'img' : 'presentation'}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : 'true'}
  focusable="false"
>
  {#if name === 'index'}
    <!-- document index -->
    <path d="M4 3h16v18H4z" />
    <path d="M8 8h8M8 12h8M8 16h5" />

  {:else if name === 'work'}
    <!-- service record / case -->
    <path d="M3 7h18v13H3z" />
    <path d="M9 7V4h6v3" />
    <path d="M3 13h18" />

  {:else if name === 'projects'}
    <!-- stacked units -->
    <path d="M12 2 3 7l9 5 9-5-9-5z" />
    <path d="M3 12l9 5 9-5" />
    <path d="M3 17l9 5 9-5" />

  {:else if name === 'stack'}
    <!-- instrumentation gauge -->
    <path d="M3 20h18" />
    <path d="M6 20V9M11 20V4M16 20v-8M21 20v-5" />

  {:else if name === 'record'}
    <!-- seal / citation -->
    <path d="M12 3l2.6 1.9 3.2-.2.6 3.1 2.3 2.2-1.7 2.7.6 3.1-3.1.8-1.9 2.6L12 21l-2.6-1.9-3.1-.8.6-3.1L5.2 12l2.3-2.2.6-3.1 3.2.2z" />
    <path d="M9.5 12l1.8 1.8 3.4-3.4" />

  {:else if name === 'contact'}
    <!-- transmit -->
    <path d="M21 3L3 10l7 3 3 7 8-17z" />
    <path d="M10 13l4-4" />

  {:else if name === 'about'}
    <!-- abstract / operator -->
    <path d="M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
    <path d="M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2" />

  {:else if name === 'github'}
    <path d="M9 19c-4 1.3-4-2.2-6-2.7m12 5v-3.6a3.1 3.1 0 0 0-.9-2.4c2.9-.3 4.9-1.5 4.9-5.4a4.2 4.2 0 0 0-1.2-2.9 3.9 3.9 0 0 0-.1-2.9s-1.3-.4-4.2 1.6a10.4 10.4 0 0 0-5 0C5.6 2.3 4.3 2.7 4.3 2.7a3.9 3.9 0 0 0-.1 2.9A4.2 4.2 0 0 0 3 8.5c0 3.9 2 5.1 4.9 5.4a3.1 3.1 0 0 0-.9 2.4V20" />

  {:else if name === 'linkedin'}
    <path d="M4 9h3v12H4zM4 3h3v3H4z" />
    <path d="M11 21V9h3v1.8A4 4 0 0 1 17.3 9c2.4 0 3.7 1.6 3.7 4.5V21h-3v-7c0-1.5-.6-2.4-2-2.4s-2 1-2 2.5V21z" />

  {:else if name === 'mail'}
    <path d="M3 5h18v14H3z" />
    <path d="M3 5l9 7 9-7" />

  {:else if name === 'phone'}
    <path d="M7 3h4l2 5-2.5 1.5a11 11 0 0 0 4 4L16 11l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z" />

  {:else if name === 'location'}
    <path d="M12 21s7-6.3 7-11a7 7 0 0 0-14 0c0 4.7 7 11 7 11z" />
    <path d="M10 10h4v4h-4z" />

  {:else if name === 'external'}
    <path d="M14 4h6v6" />
    <path d="M20 4L10 14" />
    <path d="M18 14v6H4V6h6" />

  {:else if name === 'download'}
    <path d="M12 3v12" />
    <path d="M7 11l5 5 5-5" />
    <path d="M4 21h16" />

  {:else if name === 'arrow-right'}
    <path d="M4 12h15" />
    <path d="M13 6l6 6-6 6" />

  {:else if name === 'arrow-left'}
    <path d="M20 12H5" />
    <path d="M11 6l-6 6 6 6" />

  {:else if name === 'arrow-up'}
    <path d="M12 20V5" />
    <path d="M6 11l6-6 6 6" />

  {:else if name === 'close'}
    <path d="M5 5l14 14M19 5L5 19" />

  {:else if name === 'menu'}
    <path d="M3 6h18M3 12h18M3 18h18" />

  {:else if name === 'send'}
    <path d="M12 20V5" />
    <path d="M6 11l6-6 6 6" />

  {:else if name === 'retry'}
    <path d="M20 5v6h-6" />
    <path d="M20 11A8 8 0 1 0 12 20a8 8 0 0 0 5.7-2.4" />

  {:else if name === 'chat'}
    <path d="M3 4h18v12H8l-5 4z" />
    <path d="M8 10h8" />

  {:else if name === 'verify'}
    <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
    <path d="M9 12l2.2 2.2L15.5 10" />

  {:else if name === 'theme-auto'}
    <!-- contrast: half the square inked -->
    <path d="M4 4h16v16H4z" />
    <path d="M12 4v16" />
    <path d="M12 4h8v16h-8z" fill="currentColor" stroke="none" />

  {:else if name === 'theme-light'}
    <!-- squared light source -->
    <path d="M9 9h6v6H9z" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />

  {:else if name === 'theme-dark'}
    <!-- inked square with a notch -->
    <path d="M4 4h16v16H4z" fill="currentColor" stroke="none" />
    <path d="M4 4h16v16H4z" />
    <path d="M15 7a6 6 0 0 0 0 10 6 6 0 1 1 0-10z" fill="var(--paper)" stroke="none" />

  {:else if name === 'profile'}
    <path d="M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
    <path d="M4 21v-2a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2" />

  {:else if name === 'education'}
    <path d="M3 8l9-4 9 4-9 4-9-4z" />
    <path d="M7 10v6c0 1.5 2.2 3 5 3s5-1.5 5-3v-6" />

  {:else if name === 'achievements'}
    <path d="M7 3h10v6a5 5 0 0 1-10 0z" />
    <path d="M12 14v4M8 21h8" />
    <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />

  {:else if name === 'stats'}
    <path d="M3 3v18h18" />
    <path d="M7 15h3v4H7zM12 9h3v10h-3zM17 12h3v7h-3z" />

  {:else if name === 'link'}
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1.5 1.5" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1.5-1.5" />

  {:else if name === 'document'}
    <path d="M6 2h8l5 5v15H6z" />
    <path d="M14 2v5h5" />
    <path d="M9 13h6M9 17h6" />

  {:else if name === 'edit'}
    <path d="M4 20h4L20 8l-4-4L4 16z" />
    <path d="M14 6l4 4" />

  {:else if name === 'trash'}
    <path d="M4 7h16" />
    <path d="M6 7l1 14h10l1-14" />
    <path d="M9 7V4h6v3M10 11v6M14 11v6" />

  {:else if name === 'plus'}
    <path d="M12 5v14M5 12h14" />

  {:else if name === 'check'}
    <path d="M4 12l5 5L20 6" />

  {:else if name === 'logout'}
    <path d="M10 21H4V3h6" />
    <path d="M15 8l4 4-4 4" />
    <path d="M19 12H9" />

  {:else if name === 'site'}
    <path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z" />
    <path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />

  {:else if name === 'lock'}
    <path d="M5 11h14v10H5z" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />

  {:else if name === 'scroll'}
    <path d="M12 4v14" />
    <path d="M6 13l6 6 6-6" />

  {:else}
    <!-- fallback: registration dot -->
    <path d="M9 9h6v6H9z" fill="currentColor" stroke="none" />
  {/if}
</svg>

<style>
  .icon {
    display: block;
    flex-shrink: 0;
  }
</style>
