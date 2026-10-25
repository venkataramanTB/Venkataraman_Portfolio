<script>
	/**
	 * Credentials — certificates and achievements behind one segmented control.
	 *
	 * Two lists that answer the same question ("what has been verified about
	 * him") belong in one place with a switch, not in two sections a reader
	 * has to find separately. The count rides on each tab so the switch says
	 * what is behind it before it's pressed.
	 */
	import { reveal } from '$lib/actions/reveal.js';
	import { press } from '$lib/motion/gestures.js';
	import { Spring, drive, SPRINGS, springConfig } from '$lib/motion/spring.js';
	import SectionHead from './SectionHead.svelte';
	import Icon from './Icon.svelte';

	export let certificates = [];
	export let achievements = [];

	let tab = 'certificates';

	$: TABS = [
		{ key: 'certificates', label: 'Certificates', count: certificates.length },
		{ key: 'achievements', label: 'Achievements', count: achievements.length }
	];

	/* ─── Tab thumb ────────────────────────────────────────────────────────── */
	let track;
	/** @type {HTMLButtonElement[]} */
	let tabs = [];
	let thumb;

	const tx = new Spring(0, springConfig(SPRINGS.move.bounce, SPRINGS.move.response));
	const tw = new Spring(0, springConfig(SPRINGS.move.bounce, SPRINGS.move.response));

	const renderThumb = () => {
		if (!thumb) return;
		thumb.style.width = `${tw.value}px`;
		thumb.style.transform = `translate3d(${tx.value}px, 0, 0)`;
	};

	function placeThumb(animate = true) {
		const i = TABS.findIndex((t) => t.key === tab);
		const el = tabs[i];
		if (!el || !track) return;
		const r = track.getBoundingClientRect();
		const b = el.getBoundingClientRect();
		if (!animate) {
			tx.set(b.left - r.left);
			tw.set(b.width);
			renderThumb();
			return;
		}
		tx.setTarget(b.left - r.left);
		tw.setTarget(b.width);
		drive([tx, tw], renderThumb);
	}

	$: if (thumb) placeThumb();

	function onKeydown(e) {
		const i = TABS.findIndex((t) => t.key === tab);
		if (e.key === 'ArrowRight') {
			e.preventDefault();
			tab = TABS[(i + 1) % TABS.length].key;
		} else if (e.key === 'ArrowLeft') {
			e.preventDefault();
			tab = TABS[(i - 1 + TABS.length) % TABS.length].key;
		}
	}

	/** Expired credentials are stated, not hidden — honesty reads better. */
	function expired(cert) {
		if (!cert.expiry_date) return false;
		const d = new Date(cert.expiry_date);
		return !Number.isNaN(d.valueOf()) && d < new Date();
	}
</script>

<section id="credentials" class="section">
	<div class="shell">
		<SectionHead eyebrow="Credentials" icon="record" title="Verified and awarded" aside>
			<div
				bind:this={track}
				class="segmented"
				role="tablist"
				tabindex="-1"
				aria-label="Credential type"
				on:keydown={onKeydown}
			>
				<span bind:this={thumb} class="segmented-thumb" aria-hidden="true"></span>
				{#each TABS as t, i}
					<button
						bind:this={tabs[i]}
						class="segment seg"
						role="tab"
						id={`tab-${t.key}`}
						aria-selected={tab === t.key}
						aria-controls={`panel-${t.key}`}
						tabindex={tab === t.key ? 0 : -1}
						on:click={() => (tab = t.key)}
					>
						{t.label}
						{#if t.count}<span class="seg-count">{t.count}</span>{/if}
					</button>
				{/each}
			</div>
		</SectionHead>

		{#if tab === 'certificates'}
			<div id="panel-certificates" role="tabpanel" aria-labelledby="tab-certificates" tabindex="0" class="panel">
				{#if !certificates.length}
					<p class="t-body empty">No certificates on file yet.</p>
				{:else}
					<ul class="grid">
						{#each certificates as c, i (c.id)}
							<li class="card cert" use:reveal={{ delay: Math.min(i, 8) * 55 }}>
								<div class="cert-top">
									{#if c.image_url}
										<img class="cert-logo" src={c.image_url} alt="" width="36" height="36" loading="lazy" />
									{:else}
										<span class="cert-logo cert-logo-fallback" aria-hidden="true">
											<Icon name="verify" size={18} />
										</span>
									{/if}

									<div class="cert-id">
										<h3 class="t-head cert-title">{c.title}</h3>
										<p class="t-small cert-issuer">{c.issuer}</p>
									</div>
								</div>

								<dl class="cert-meta">
									{#if c.issued_date}
										<div>
											<dt class="t-label">Issued</dt>
											<dd class="t-mono">{c.issued_date}</dd>
										</div>
									{/if}
									{#if c.expiry_date}
										<div>
											<dt class="t-label">{expired(c) ? 'Expired' : 'Expires'}</dt>
											<dd class="t-mono" class:is-expired={expired(c)}>{c.expiry_date}</dd>
										</div>
									{/if}
									{#if c.credential_id}
										<div class="cert-cred">
											<dt class="t-label">Credential</dt>
											<dd class="t-mono cert-cred-id">{c.credential_id}</dd>
										</div>
									{/if}
								</dl>

								{#if c.credential_url}
									<a
										class="btn btn-sm cert-verify"
										href={c.credential_url}
										target="_blank"
										rel="noopener noreferrer"
										use:press
									>
										<Icon name="external" size={15} />
										Verify
									</a>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{:else}
			<div id="panel-achievements" role="tabpanel" aria-labelledby="tab-achievements" tabindex="0" class="panel">
				{#if !achievements.length}
					<p class="t-body empty">No achievements on file yet.</p>
				{:else}
					<ul class="grid">
						{#each achievements as a, i (a.id)}
							<li class="card ach" use:reveal={{ delay: Math.min(i, 8) * 55 }}>
								<span class="ach-icon" aria-hidden="true">
									<Icon name="achievements" size={18} />
								</span>
								<div class="ach-body">
									<h3 class="t-head">{a.title}</h3>
									{#if a.date || a.category}
										<p class="t-mono ach-meta">
											{a.date ?? ''}{#if a.date && a.category}<span class="dim"> · </span>{/if}{a.category ?? ''}
										</p>
									{/if}
									{#if a.description}
										<p class="t-body ach-desc">{a.description}</p>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</div>
</section>

<style>
	.seg {
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
	}
	.seg-count {
		display: inline-grid;
		place-items: center;
		min-width: 1.125rem;
		height: 1.125rem;
		padding-inline: 0.25rem;
		border-radius: var(--r-full);
		background: var(--hairline);
		font-size: 0.6875rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: var(--text-3);
	}
	.segment[aria-selected='true'] .seg-count {
		color: var(--text);
	}

	.panel:focus-visible {
		outline-offset: 8px;
	}

	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: 1rem;
	}

	/* ─── Certificate ──────────────────────────────────────────────────────── */
	.cert {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
	}

	.cert-top {
		display: flex;
		gap: 0.875rem;
		align-items: flex-start;
	}
	.cert-logo {
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--r-xs);
		object-fit: contain;
		background: var(--bg-sunk);
		flex-shrink: 0;
	}
	.cert-logo-fallback {
		display: grid;
		place-items: center;
		color: var(--text-3);
	}
	.cert-id {
		min-width: 0;
	}
	.cert-title {
		text-wrap: pretty;
	}
	.cert-issuer {
		margin-top: 0.1875rem;
	}

	.cert-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1.5rem;
		margin: 0;
		padding-top: 0.875rem;
		border-top: 1px solid var(--hairline);
		flex: 1;
		align-content: flex-start;
	}
	.cert-meta dd {
		margin: 0.1875rem 0 0;
		color: var(--text-2);
	}
	.is-expired {
		color: var(--warn);
	}
	.cert-cred {
		min-width: 0;
		flex: 1 1 100%;
	}
	.cert-cred-id {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.cert-verify {
		align-self: flex-start;
	}

	/* ─── Achievement ──────────────────────────────────────────────────────── */
	.ach {
		display: flex;
		gap: 0.875rem;
		padding: 1.25rem;
	}
	.ach-icon {
		display: grid;
		place-items: center;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: var(--r-sm);
		background: var(--accent-soft);
		color: var(--accent-text);
		flex-shrink: 0;
	}
	.ach-body {
		display: flex;
		flex-direction: column;
		gap: 0.3125rem;
		min-width: 0;
	}
	.ach-meta {
		color: var(--text-4);
	}
	.dim {
		opacity: 0.5;
	}
	.ach-desc {
		margin-top: 0.25rem;
		max-width: none;
	}

	.empty {
		padding: 1.5rem 0;
		color: var(--text-3);
	}
</style>
