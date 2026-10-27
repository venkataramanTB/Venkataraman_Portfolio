<script>
	/**
	 * One bone and everything hanging off it.
	 *
	 * Forward kinematics comes free from nesting: each bone is a <g> that
	 * translates to its joint and rotates by its own angle, so a child
	 * inherits every transform above it. Rotating the spine carries the arms
	 * and head with it.
	 */
	import { SOFT_PALETTE } from './softrig.js';

	export let bone;
	/** Resolved joint map: joint name → degrees. */
	export let pose;
	/** Length of the parent bone — where this one attaches by default. */
	export let parentLen = 0;

	$: ox = bone.offset?.x ?? 0;
	$: oy = bone.offset?.y ?? parentLen;
	$: angle = pose[bone.name] ?? bone.rest ?? 0;

	const fill = (n) => SOFT_PALETTE[n] ?? n;
</script>

<g transform={`translate(${ox} ${oy}) rotate(${angle})`}>
	{#each bone.shapes ?? [] as s}
		{#if s.type === 'capsule'}
			<!-- A limb segment running from this joint to the next, fully
			     rounded at both ends so joints read as joints. -->
			<rect
				x={-s.w / 2}
				y={-s.w / 2}
				width={s.w}
				height={s.len + s.w}
				rx={s.w / 2}
				fill={fill(s.fill)}
			/>
		{:else if s.type === 'rrect'}
			<rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} fill={fill(s.fill)} />
		{:else if s.type === 'circle'}
			<circle id={s.id} cx={s.cx} cy={s.cy} r={s.r} fill={fill(s.fill)} />
		{:else if s.type === 'poly'}
			<!-- A straight-edged shape: hair spikes, angular eyes, sharp brows.
			     Circles can only ever make something soft and round, and this
			     character is built out of points. -->
			<polygon points={s.points} fill={fill(s.fill)} />
		{:else if s.type === 'path'}
			<path d={s.d} fill={s.fill ? fill(s.fill) : 'none'} stroke={s.stroke ? fill(s.stroke) : 'none'} stroke-width={s.sw ?? 2} stroke-linecap="round" />
		{:else if s.type === 'smile'}
			<path
				d={`M${s.cx - s.w / 2} ${s.cy} q${s.w / 2} ${s.w * 0.55} ${s.w} 0`}
				fill="none"
				stroke={fill(s.fill)}
				stroke-width="2.6"
				stroke-linecap="round"
			/>
		{/if}
	{/each}

	{#each bone.children ?? [] as child (child.name)}
		<svelte:self bone={child} {pose} parentLen={bone.len} />
	{/each}
</g>
