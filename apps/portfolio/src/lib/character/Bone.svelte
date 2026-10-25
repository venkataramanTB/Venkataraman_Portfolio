<script>
	/**
	 * One bone, and recursively everything hanging off it.
	 *
	 * Forward kinematics comes free from nesting: each bone is a <g> that
	 * translates to its joint and rotates by its own angle, so a child
	 * inherits every transform above it without anyone multiplying a matrix.
	 * Rotating the spine carries the arms, the head and the hands with it,
	 * which is the whole reason the character is a tree rather than a list.
	 */
	import { PALETTE } from './rig.js';

	export let bone;
	/** Resolved joint map: every joint name to an angle in degrees. */
	export let pose;
	/** Length of the parent bone — where this one attaches by default. */
	export let parentLen = 0;

	// A bone attaches at the tip of its parent unless it names its own offset
	// (shoulders and hips branch off the spine, not off its end).
	$: ox = bone.offset?.x ?? 0;
	$: oy = bone.offset?.y ?? parentLen;
	$: angle = pose[bone.name] ?? bone.rest ?? 0;

	const fill = (name) => PALETTE[name] ?? name;
</script>

<g transform={`translate(${ox} ${oy}) rotate(${angle})`}>
	{#each bone.shapes ?? [] as s}
		{#if s.type === 'capsule'}
			<!-- The workhorse: a limb segment running from this joint to the
			     next, rounded at both ends so joints read as joints. -->
			<rect
				x={-s.w / 2}
				y={-s.w / 2}
				width={s.w}
				height={s.len + s.w}
				rx={s.w / 2}
				fill={fill(s.fill)}
			/>
		{:else if s.type === 'rect'}
			<rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx ?? 0} fill={fill(s.fill)} />
		{:else if s.type === 'circle'}
			<circle id={s.id} cx={s.cx} cy={s.cy} r={s.r} fill={fill(s.fill)} />
		{:else if s.type === 'ellipse'}
			<ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={fill(s.fill)} />
		{:else if s.type === 'path'}
			<path d={s.d} fill={fill(s.fill)} />
		{/if}
	{/each}

	{#each bone.children ?? [] as child (child.name)}
		<svelte:self bone={child} {pose} parentLen={bone.len} />
	{/each}
</g>
