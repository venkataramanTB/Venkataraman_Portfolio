<script>
	/**
	 * Contact.
	 *
	 * There is no form endpoint on the API, so this composes a `mailto:` and
	 * hands off to the reader's mail client. That is stated in the interface
	 * rather than hidden: a form that silently opens a mail client when the
	 * reader expected it to send is a small betrayal, and the one thing a
	 * hiring contact must be able to trust is that the message arrived.
	 *
	 * Validation is inline and on blur — not on submit — so a problem is
	 * reported next to the field that caused it, while the reader is still
	 * looking at it.
	 */
	import { reveal } from '$lib/actions/reveal.js';
	import { press } from '$lib/motion/gestures.js';
	import SectionHead from './SectionHead.svelte';
	import Icon from './Icon.svelte';

	export let profile = null;
	export let socialLinks = [];

	const SOCIAL_ICONS = {
		github: 'github',
		linkedin: 'linkedin',
		twitter: 'x',
		x: 'x',
		email: 'mail',
		mail: 'mail',
		website: 'site'
	};

	$: email = profile?.email ?? '';

	let name = '';
	let subject = '';
	let message = '';

	/** Touched tracking keeps errors from appearing before a field was used. */
	let touched = { name: false, message: false };

	$: errors = {
		name: !name.trim() ? 'Tell me who you are.' : '',
		message: !message.trim()
			? 'A message is required.'
			: message.trim().length < 12
				? 'A little more detail would help.'
				: ''
	};
	$: valid = !errors.name && !errors.message;

	$: href = (() => {
		const subj = subject.trim() || `Portfolio enquiry${name.trim() ? ` — ${name.trim()}` : ''}`;
		const body = `${message.trim()}\n\n— ${name.trim()}`;
		return `mailto:${email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
	})();

	function onSubmit(e) {
		// Mark everything touched so a blind submit still reports what's wrong.
		touched = { name: true, message: true };
		if (!valid) {
			e.preventDefault();
			return;
		}
		// Let the anchor-equivalent navigation happen; the mail client takes over.
	}

	let copied = false;
	let copyTimer;

	async function copyEmail() {
		try {
			await navigator.clipboard.writeText(email);
			copied = true;
			clearTimeout(copyTimer);
			// Completion feedback, then back to the resting label.
			copyTimer = setTimeout(() => (copied = false), 1800);
		} catch {
			// Clipboard blocked — the address is visible and selectable anyway.
		}
	}
</script>

<section id="contact" class="section">
	<div class="shell">
		<SectionHead
			eyebrow="Contact"
			icon="contact"
			title="Let's talk"
			note={profile?.open_to_work
				? 'Open to new roles. The fastest route is email — I read everything.'
				: 'Happy to talk about interesting work.'}
		/>

		<div class="layout">
			<!-- Direct routes first: most people want the address, not a form. -->
			<aside class="direct" use:reveal>
				{#if email}
					<div class="direct-item card">
						<p class="t-label">Email</p>
						<a class="direct-value link" href={`mailto:${email}`}>{email}</a>
						<button class="btn btn-sm copy" on:click={copyEmail} use:press>
							<Icon name={copied ? 'check' : 'link'} size={15} />
							<span>{copied ? 'Copied' : 'Copy address'}</span>
						</button>
					</div>
				{/if}

				<dl class="direct-meta card">
					{#if profile?.phone}
						<div class="meta-row">
							<dt class="t-label"><Icon name="phone" size={14} /> Phone</dt>
							<dd><a class="link-quiet" href={`tel:${profile.phone}`}>{profile.phone}</a></dd>
						</div>
					{/if}
					{#if profile?.location}
						<div class="meta-row">
							<dt class="t-label"><Icon name="location" size={14} /> Location</dt>
							<dd>{profile.location}</dd>
						</div>
					{/if}
					{#if profile?.resume_url}
						<div class="meta-row">
							<dt class="t-label"><Icon name="document" size={14} /> Résumé</dt>
							<dd>
								<a class="link-quiet" href={profile.resume_url} target="_blank" rel="noopener noreferrer">
									Download PDF
								</a>
							</dd>
						</div>
					{/if}
				</dl>

				{#if socialLinks.length}
					<ul class="socials">
						{#each socialLinks as link}
							<li>
								<a
									class="social"
									href={link.url}
									target="_blank"
									rel="noopener noreferrer"
									use:press={{ scale: 0.96 }}
								>
									<Icon name={SOCIAL_ICONS[link.platform?.toLowerCase()] ?? 'link'} size={17} />
									<span>{link.platform}</span>
									<Icon name="arrow-up-right" size={15} />
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</aside>

			<!-- Composer -->
			{#if email}
				<form class="form card" on:submit={onSubmit} action={href} use:reveal={{ delay: 80 }}>
					<div class="field-group">
						<label class="t-label" for="c-name">Your name</label>
						<input
							id="c-name"
							class="field"
							bind:value={name}
							on:blur={() => (touched.name = true)}
							aria-invalid={touched.name && !!errors.name}
							aria-describedby={touched.name && errors.name ? 'c-name-err' : undefined}
							autocomplete="name"
							placeholder="Jane Doe"
						/>
						{#if touched.name && errors.name}
							<p id="c-name-err" class="err" role="alert">
								<Icon name="close" size={13} />
								{errors.name}
							</p>
						{/if}
					</div>

					<div class="field-group">
						<label class="t-label" for="c-subject">Subject <span class="opt">optional</span></label>
						<input
							id="c-subject"
							class="field"
							bind:value={subject}
							placeholder="Senior AI engineer role"
						/>
					</div>

					<div class="field-group">
						<label class="t-label" for="c-message">Message</label>
						<textarea
							id="c-message"
							class="field area"
							bind:value={message}
							on:blur={() => (touched.message = true)}
							aria-invalid={touched.message && !!errors.message}
							aria-describedby={touched.message && errors.message ? 'c-message-err' : undefined}
							rows="5"
							placeholder="What are you building, and where would I fit?"
						></textarea>
						{#if touched.message && errors.message}
							<p id="c-message-err" class="err" role="alert">
								<Icon name="close" size={13} />
								{errors.message}
							</p>
						{/if}
					</div>

					<div class="form-foot">
						<button class="btn btn-primary" type="submit" aria-disabled={!valid} use:press>
							<Icon name="mail" size={16} />
							<span>Open in mail app</span>
						</button>
						<!-- Said plainly, before the button is pressed. -->
						<p class="t-small note">
							This opens your own mail app with the message ready — nothing is sent from
							this page.
						</p>
					</div>
				</form>
			{/if}
		</div>
	</div>
</section>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
		gap: 1.25rem;
		align-items: start;
	}
	@media (max-width: 54rem) {
		.layout {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	/* ─── Direct ───────────────────────────────────────────────────────────── */
	.direct {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.direct-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 1.25rem;
	}
	.direct-value {
		font-size: clamp(1rem, 2vw, 1.1875rem);
		font-weight: 560;
		letter-spacing: -0.014em;
		word-break: break-all;
	}
	.copy {
		margin-top: 0.375rem;
	}

	.direct-meta {
		display: flex;
		flex-direction: column;
		margin: 0;
		padding: 0.375rem 1.25rem;
	}
	.meta-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.8125rem 0;
	}
	.meta-row + .meta-row {
		border-top: 1px solid var(--hairline);
	}
	.meta-row dt {
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
	}
	.meta-row dd {
		margin: 0;
		font-size: 0.90625rem;
		color: var(--text-2);
		text-align: right;
	}

	.socials {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.social {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.75rem 1rem;
		border-radius: var(--r-md);
		border: 0.5px solid var(--border);
		background: var(--bg-raised);
		box-shadow: var(--e1);
		color: var(--text-2);
		font-size: 0.90625rem;
		font-weight: 520;
		text-decoration: none;
		text-transform: capitalize;
		transition: color 200ms var(--ease-soft), border-color 200ms var(--ease-soft);
	}
	.social span {
		flex: 1;
	}
	.social:hover {
		color: var(--text);
		border-color: var(--hairline-strong);
	}

	/* ─── Form ─────────────────────────────────────────────────────────────── */
	.form {
		display: flex;
		flex-direction: column;
		gap: 1.125rem;
		padding: 1.5rem;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.4375rem;
	}
	.opt {
		color: var(--text-4);
		font-weight: 400;
		text-transform: none;
		letter-spacing: 0;
	}

	.area {
		resize: vertical;
		min-height: 7rem;
		font-family: inherit;
	}

	.field[aria-invalid='true'] {
		border-color: var(--bad);
	}
	.field[aria-invalid='true']:focus {
		box-shadow: 0 0 0 3.5px color-mix(in srgb, var(--bad) 18%, transparent);
	}

	.err {
		display: flex;
		align-items: center;
		gap: 0.3125rem;
		margin: 0;
		font-size: 0.8125rem;
		color: var(--bad);
	}

	.form-foot {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: flex-start;
		padding-top: 0.375rem;
		border-top: 1px solid var(--hairline);
	}
	.note {
		color: var(--text-4);
		max-width: 44ch;
	}
</style>
