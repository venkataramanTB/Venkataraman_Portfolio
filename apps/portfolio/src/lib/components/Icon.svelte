<script>
	/**
	 * Inline icon set — no dependency, one consistent stroke weight.
	 *
	 * Geometry is rounded (round caps, round joins, generous corner radii) to
	 * sit with the rest of the system. Icons are drawn on a 24px grid and
	 * optically weighted rather than mathematically uniform, so a dense glyph
	 * does not read heavier than a sparse one at the same stroke width.
	 *
	 * Usage: <Icon name="work" />              decorative, inherits currentColor
	 *        <Icon name="work" label="Work" /> standalone control + a11y name
	 */
	export let name = 'dot';
	export let size = 18;
	/** Set when the icon is the only content of a control. */
	export let label = '';
	/** Stroke weight in viewBox units. 1.6 is the house weight. */
	export let weight = 1.6;
</script>

<svg
	class="icon"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={weight}
	stroke-linecap="round"
	stroke-linejoin="round"
	role={label ? 'img' : 'presentation'}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
	focusable="false"
>
	{#if name === 'overview'}
		<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z" />

	{:else if name === 'work'}
		<rect x="3" y="7" width="18" height="13" rx="3" />
		<path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
		<path d="M3 12h18" />

	{:else if name === 'projects'}
		<path d="M12 3.2 20 7.6v8.8L12 20.8 4 16.4V7.6z" />
		<path d="M4 7.6 12 12l8-4.4M12 12v8.8" />

	{:else if name === 'stack'}
		<path d="M4 19V11M9.33 19V5M14.67 19v-6M20 19v-9" />

	{:else if name === 'record'}
		<path
			d="M12 3.5l2.3 1.6 2.8-.1.5 2.7 2 1.9-1.5 2.4.5 2.7-2.7.7-1.7 2.3L12 16.9l-2.2 1.3-1.7-2.3-2.7-.7.5-2.7L4.4 10l2-1.9.5-2.7 2.8.1z"
		/>
		<path d="M9.8 11.5l1.7 1.7 3-3.2" />

	{:else if name === 'contact'}
		<path d="M21 4L3 10.4l7.2 2.9L13.2 20z" />
		<path d="M10.2 13.3L21 4" />

	{:else if name === 'about'}
		<circle cx="12" cy="8" r="4" />
		<path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />

	{:else if name === 'ai'}
		<!-- practice area: AI engineering — a node graph, not a brain cliché -->
		<circle cx="12" cy="5" r="2.2" />
		<circle cx="5" cy="17" r="2.2" />
		<circle cx="19" cy="17" r="2.2" />
		<path d="M10.5 6.8L6.4 15M13.5 6.8L17.6 15M7.2 17h9.6" />

	{:else if name === 'ml'}
		<path d="M3 17.5c3.5 0 4-10.5 7.5-10.5S14.5 14 18 14c1.4 0 2.3-1 3-2.3" />
		<circle cx="18" cy="14" r="1.6" />

	{:else if name === 'ios'}
		<rect x="7" y="2.5" width="10" height="19" rx="3" />
		<path d="M10.5 5.4h3" />
		<path d="M11 18.6h2" />

	{:else if name === 'web'}
		<path d="M4 5.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z" />
		<path d="M3 9.5h18" />
		<path d="M6.2 7.5h.01M8.6 7.5h.01" />

	{:else if name === 'github'}
		<path
			d="M9 19.3c-4 1.2-4-2.1-5.7-2.6m11.7 4.8v-3.4a3 3 0 0 0-.8-2.3c2.8-.3 4.8-1.4 4.8-5.2a4 4 0 0 0-1.2-2.8 3.7 3.7 0 0 0-.1-2.8s-1.2-.4-4 1.5a10 10 0 0 0-4.8 0C6.1 4.6 4.9 5 4.9 5a3.7 3.7 0 0 0-.1 2.8 4 4 0 0 0-1.2 2.9c0 3.7 2 4.9 4.7 5.2a3 3 0 0 0-.8 2.3v3.4"
		/>

	{:else if name === 'linkedin'}
		<rect x="3.5" y="9" width="3.2" height="11.5" rx="1" />
		<circle cx="5.1" cy="4.6" r="1.8" />
		<path d="M11 20.5V9h3v1.7A3.9 3.9 0 0 1 17.4 8.8c2.3 0 3.6 1.6 3.6 4.5v7.2h-3.2v-6.8c0-1.5-.6-2.4-1.9-2.4s-2.1 1-2.1 2.5v6.7z" />

	{:else if name === 'x'}
		<path d="M4 4l7 9.2L4.4 20h2.3l5.4-5.6 4.1 5.6H20l-7.2-9.5L19.6 4h-2.3l-5 5.2L8.6 4z" />

	{:else if name === 'mail'}
		<rect x="3" y="5" width="18" height="14" rx="3" />
		<path d="M3.8 7.2l7.3 5.2a1.5 1.5 0 0 0 1.8 0l7.3-5.2" />

	{:else if name === 'phone'}
		<path
			d="M7.2 3.5h2.5l1.6 4-2 1.3a11.5 11.5 0 0 0 4.4 4.4l1.3-2 4 1.6v2.5a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 5.2 5.7a2 2 0 0 1 2-2.2z"
		/>

	{:else if name === 'location'}
		<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z" />
		<circle cx="12" cy="10" r="2.6" />

	{:else if name === 'external'}
		<path d="M14 4.5h5.5V10" />
		<path d="M19.5 4.5L11 13" />
		<path d="M18 14.5v3a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3" />

	{:else if name === 'download'}
		<path d="M12 3.5v11.5" />
		<path d="M7.5 10.5L12 15l4.5-4.5" />
		<path d="M4.5 19.5h15" />

	{:else if name === 'appstore'}
		<rect x="3" y="3" width="18" height="18" rx="5" />
		<path d="M9 16l3-6 3 6M10.2 14h3.6" />

	{:else if name === 'arrow-right'}
		<path d="M4.5 12h14" />
		<path d="M13 6.5l6 5.5-6 5.5" />

	{:else if name === 'arrow-left'}
		<path d="M19.5 12h-14" />
		<path d="M11 6.5L5 12l6 5.5" />

	{:else if name === 'arrow-up'}
		<path d="M12 19.5v-14" />
		<path d="M6.5 11L12 5l5.5 6" />

	{:else if name === 'arrow-up-right'}
		<path d="M7 17L17 7" />
		<path d="M9.5 7H17v7.5" />

	{:else if name === 'chevron-down'}
		<path d="M6 9.5l6 5.5 6-5.5" />

	{:else if name === 'chevron-right'}
		<path d="M9.5 6l5.5 6-5.5 6" />

	{:else if name === 'close'}
		<path d="M6 6l12 12M18 6L6 18" />

	{:else if name === 'menu'}
		<path d="M4 7.5h16M4 12h16M4 16.5h11" />

	{:else if name === 'send'}
		<path d="M12 20V5" />
		<path d="M6.5 10.5L12 5l5.5 5.5" />

	{:else if name === 'retry'}
		<path d="M19.5 5.5v5h-5" />
		<path d="M19.2 10.5A7.5 7.5 0 1 0 12 19.5a7.5 7.5 0 0 0 5.3-2.2" />

	{:else if name === 'chat'}
		<path d="M20.5 11.8c0 3.9-3.8 7-8.5 7a9.7 9.7 0 0 1-2.3-.3L4.5 20.5l1.2-3.4a6.7 6.7 0 0 1-2.2-5c0-3.9 3.8-7.1 8.5-7.1s8.5 3.2 8.5 7z" />
		<path d="M9 12h.01M12 12h.01M15 12h.01" />

	{:else if name === 'sparkle'}
		<path d="M12 3.5l1.6 4.4L18 9.5l-4.4 1.6L12 15.5l-1.6-4.4L6 9.5l4.4-1.6z" />
		<path d="M18.5 16l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />

	{:else if name === 'verify'}
		<path d="M12 3.2l7 2.6v6.4c0 4-2.9 7-7 8.6-4.1-1.6-7-4.6-7-8.6V5.8z" />
		<path d="M9.2 12l2.1 2.1 3.6-3.8" />

	{:else if name === 'education'}
		<path d="M3 8.5L12 4.5l9 4-9 4z" />
		<path d="M7 11v4.6c0 1.5 2.2 2.6 5 2.6s5-1.1 5-2.6V11" />
		<path d="M20 9.5v4.5" />

	{:else if name === 'achievements'}
		<path d="M8 3.5h8v5.3a4 4 0 0 1-8 0z" />
		<path d="M12 12.8v3.7M8.5 20.5h7" />
		<path d="M8 5H5.2v1.6a3 3 0 0 0 2.6 3M16 5h2.8v1.6a3 3 0 0 1-2.6 3" />

	{:else if name === 'stats'}
		<path d="M3.5 3.5v17h17" />
		<path d="M7.5 16v-3M12 16V8.5M16.5 16v-5.5" />

	{:else if name === 'link'}
		<path d="M10.2 13.8a3.8 3.8 0 0 0 5.4 0l2.8-2.8a3.8 3.8 0 0 0-5.4-5.4l-1.4 1.4" />
		<path d="M13.8 10.2a3.8 3.8 0 0 0-5.4 0l-2.8 2.8a3.8 3.8 0 0 0 5.4 5.4l1.4-1.4" />

	{:else if name === 'document'}
		<path d="M6.5 3h7L19 8.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-15A1.5 1.5 0 0 1 6.5 3z" />
		<path d="M13.5 3v5.5H19" />
		<path d="M9 13.5h6M9 17h4" />

	{:else if name === 'theme-auto'}
		<circle cx="12" cy="12" r="8" />
		<path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none" />

	{:else if name === 'theme-light'}
		<circle cx="12" cy="12" r="4" />
		<path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5" />

	{:else if name === 'theme-dark'}
		<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />

	{:else if name === 'scroll'}
		<path d="M12 5v13" />
		<path d="M7.5 13.5L12 18l4.5-4.5" />

	{:else if name === 'lock'}
		<rect x="4.5" y="10.5" width="15" height="10.5" rx="3" />
		<path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />

	{:else if name === 'check'}
		<path d="M4.5 12.5l5 5 10-11" />

	{:else if name === 'plus'}
		<path d="M12 5.5v13M5.5 12h13" />

	{:else if name === 'edit'}
		<path d="M4 20h4.2L20 8.2 15.8 4 4 15.8z" />
		<path d="M14.4 5.4l4.2 4.2" />

	{:else if name === 'trash'}
		<path d="M4.5 7h15" />
		<path d="M6.5 7l.9 12.2a1.8 1.8 0 0 0 1.8 1.6h5.6a1.8 1.8 0 0 0 1.8-1.6L17.5 7" />
		<path d="M9.5 7V5.2a1.2 1.2 0 0 1 1.2-1.2h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />

	{:else if name === 'logout'}
		<path d="M10 20.5H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h4" />
		<path d="M15.5 8.5L19 12l-3.5 3.5" />
		<path d="M19 12H9.5" />

	{:else if name === 'profile'}
		<circle cx="12" cy="8" r="4" />
		<path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />

	{:else if name === 'site'}
		<circle cx="12" cy="12" r="8.5" />
		<path d="M3.5 12h17" />
		<path d="M12 3.5a13 13 0 0 1 0 17 13 13 0 0 1 0-17z" />

	{:else}
		<!-- fallback: a dot -->
		<circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
	{/if}
</svg>

<style>
	.icon {
		display: block;
		flex-shrink: 0;
	}
</style>
