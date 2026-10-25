<script>
	/**
	 * CV assistant.
	 *
	 * The streaming contract with the API is unchanged. What changed is the
	 * surface: a translucent panel on desktop, and on touch a real bottom
	 * sheet you can drag and throw closed.
	 *
	 * The drag is the showcase for the motion system: it tracks the finger 1:1,
	 * rubber-bands when pulled the wrong way, and on release projects where the
	 * throw was *going* rather than snapping from where the finger stopped. The
	 * sheet can be caught mid-flight and reversed, because the spring animates
	 * from its live position and keeps its velocity through the re-target.
	 */
	import { onMount, onDestroy, tick } from 'svelte';
	import { streamChat } from '$lib/api.js';
	import { Spring, drive, project, withRubberband, SPRINGS, springConfig, prefersReducedMotion } from '$lib/motion/spring.js';
	import { draggable, press } from '$lib/motion/gestures.js';
	import Icon from './Icon.svelte';

	let open = false;
	let messages = [];
	let input = '';
	let streaming = false;
	let errored = false;
	let mounted = false;
	let isTouch = false;

	let panel;
	let logEl;
	let inputEl;

	const GREETING =
		"Ask me anything about Venkataraman's experience — the answers come from his CV on file.";

	const PROMPTS = [
		'What has he shipped with PyTorch?',
		'Summarise his iOS work.',
		'Which backends has he run in production?'
	];

	/* ─── Sheet position ────────────────────────────────────────────────────── */
	/** 0 = fully open, 1 = fully dismissed. Kept normalised so the same spring
	    serves both the drag and the open/close transition. */
	const y = new Spring(1, springConfig(SPRINGS.sheet.bounce, SPRINGS.sheet.response));
	let height = 480;

	const renderSheet = () => {
		if (!panel) return;
		panel.style.transform = `translate3d(0, ${y.value * height}px, 0)`;
		// Fade only in the last stretch of travel, so the sheet stays solid
		// while it is being manipulated and only dissolves as it leaves.
		panel.style.opacity = String(Math.max(0, 1 - Math.max(0, y.value - 0.55) * 2.2));
	};

	function animateTo(target, velocity) {
		y.setTarget(target, velocity);
		drive([y], renderSheet, () => {
			if (y.value >= 0.999) {
				open = false;
				panel = null;
			}
		});
	}

	async function openPanel() {
		open = true;
		await tick();
		height = panel?.offsetHeight ?? 480;
		y.set(1);
		renderSheet();
		animateTo(0);
		if (!isTouch) inputEl?.focus();
		scrollBottom();
	}

	function closePanel() {
		if (!panel) {
			open = false;
			return;
		}
		animateTo(1);
	}

	function toggle() {
		if (open) closePanel();
		else openPanel();
	}

	/* ─── Drag to dismiss ───────────────────────────────────────────────────── */
	function onDragMove({ dy }) {
		if (!panel) return;
		// Downward tracks 1:1. Upward is rubber-banded: there is nothing above
		// the open position, and a hard stop there would read as frozen.
		const raw = dy / height;
		y.set(withRubberband(raw, 0, 1, height) );
		renderSheet();
	}

	function onDragEnd({ dy, vy }) {
		const current = dy / height;
		// Where the throw is heading, not where the finger left off.
		const projected = current + project(vy) / height;

		// Velocity sign decides direction; position only breaks a tie. A slow
		// drag most of the way down still closes, a fast flick back up still
		// reopens even from near the bottom.
		const dismiss = projected > 0.42;
		animateTo(dismiss ? 1 : 0, vy / height);
	}

	/* ─── Transcript ────────────────────────────────────────────────────────── */
	function scrollBottom() {
		tick().then(() => {
			if (logEl) logEl.scrollTop = logEl.scrollHeight;
		});
	}

	async function send(preset) {
		const text = (preset ?? input).trim();
		if (!text || streaming) return;
		if (!preset) input = '';
		errored = false;

		messages = [...messages, { role: 'user', content: text }, { role: 'assistant', content: '' }];
		streaming = true;
		scrollBottom();

		try {
			const history = messages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
			for await (const chunk of streamChat(history)) {
				messages[messages.length - 1] = {
					role: 'assistant',
					content: messages[messages.length - 1].content + chunk
				};
				messages = messages;
				scrollBottom();
			}
		} catch (e) {
			errored = true;
			messages[messages.length - 1] = {
				role: 'assistant',
				content: `Couldn't reach the assistant. ${e.message}`
			};
			messages = messages;
		} finally {
			streaming = false;
			scrollBottom();
		}
	}

	function onKey(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	function onWindowKey(e) {
		if (e.key === 'Escape' && open) closePanel();
	}

	onMount(() => {
		mounted = true;
		isTouch = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
		messages = [{ role: 'assistant', content: GREETING }];
	});

	onDestroy(() => {
		panel = null;
	});
</script>

<svelte:window on:keydown={onWindowKey} />

{#if mounted}
	<button
		class="launcher no-print"
		class:launcher-open={open}
		on:click={toggle}
		aria-expanded={open}
		aria-controls="chat-panel"
		use:press={{ scale: 0.93 }}
	>
		<Icon name={open ? 'close' : 'sparkle'} size={19} label={open ? 'Close assistant' : 'Ask about his CV'} />
		{#if !open}
			<span class="launcher-label">Ask about his CV</span>
		{/if}
		{#if streaming && !open}
			<span class="launcher-live" aria-hidden="true"></span>
		{/if}
	</button>

	{#if open}
		{#if isTouch}
			<!-- A real button: tapping the scrim is a genuine dismiss action, and it
			     needs to be reachable and announced, not an inert div. -->
			<button class="scrim" on:click={closePanel} aria-label="Close assistant"></button>
		{/if}

		<div
			bind:this={panel}
			id="chat-panel"
			class="panel material-thick"
			class:panel-sheet={isTouch}
			role="dialog"
			aria-modal={isTouch}
			aria-label="CV assistant"
		>
			<!-- The grabber is both the affordance and the drag target. Only the
			     sheet form is draggable; a desktop panel has nowhere to go. -->
			{#if isTouch}
				<div
					class="grabber-zone"
					use:draggable={{ axis: 'y', onMove: onDragMove, onEnd: onDragEnd }}
				>
					<span class="grabber" aria-hidden="true"></span>
				</div>
			{/if}

			<header class="head">
				<div class="head-id">
					<span class="head-icon" aria-hidden="true"><Icon name="sparkle" size={15} /></span>
					<div>
						<p class="head-title on-material">CV assistant</p>
						<p class="head-state t-mono">
							{errored ? 'Connection failed' : streaming ? 'Answering…' : 'Ready'}
						</p>
					</div>
				</div>

				<button class="head-close" on:click={closePanel} use:press={{ scale: 0.9 }}>
					<Icon name="close" size={17} label="Close assistant" />
				</button>
			</header>

			<div bind:this={logEl} class="log" role="log" aria-live="polite">
				{#each messages as msg, i (i)}
					<article class="msg" class:msg-user={msg.role === 'user'}>
						{#if msg.role === 'assistant' && !msg.content && streaming}
							<span class="wait" aria-label="Waiting for a response">
								<span></span><span></span><span></span>
							</span>
						{:else}
							<p class="msg-text">{msg.content}</p>
						{/if}
					</article>
				{/each}

				{#if messages.length === 1 && !streaming}
					<div class="prompts">
						{#each PROMPTS as p}
							<button class="prompt" on:click={() => send(p)} use:press={{ scale: 0.98 }}>
								{p}
								<Icon name="arrow-up-right" size={14} />
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<div class="composer">
				<label class="sr" for="chat-input">Your question</label>
				<textarea
					bind:this={inputEl}
					id="chat-input"
					class="composer-input"
					bind:value={input}
					on:keydown={onKey}
					rows="1"
					placeholder="Ask a question…"
					disabled={streaming}
				></textarea>
				<button
					class="composer-send"
					on:click={() => send()}
					disabled={streaming || !input.trim()}
					use:press={{ scale: 0.9 }}
				>
					<Icon name="send" size={16} label="Send" />
				</button>
			</div>

			<p class="disclaimer">
				Generated from his CV. Verify anything you'll act on.
			</p>
		</div>
	{/if}
{/if}

<style>
	/* ─── Launcher ─────────────────────────────────────────────────────────── */
	.launcher {
		position: fixed;
		right: max(1rem, env(safe-area-inset-right));
		bottom: max(1rem, env(safe-area-inset-bottom));
		z-index: var(--z-overlay);
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6875rem 1rem;
		border: 0.5px solid var(--border);
		border-radius: var(--r-full);
		background: var(--mat-thick);
		-webkit-backdrop-filter: blur(var(--blur-regular)) saturate(180%);
		backdrop-filter: blur(var(--blur-regular)) saturate(180%);
		box-shadow: var(--e3), inset 0 0.5px 0 var(--mat-edge);
		color: var(--text);
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 540;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}
	.launcher-open {
		padding: 0.6875rem;
	}
	.launcher-label {
		letter-spacing: -0.006em;
	}
	@media (max-width: 30rem) {
		.launcher-label {
			display: none;
		}
		.launcher {
			padding: 0.6875rem;
		}
	}

	.launcher-live {
		width: 0.4375rem;
		height: 0.4375rem;
		border-radius: var(--r-full);
		background: var(--live);
		animation: breathe 2.4s var(--ease-soft) infinite;
	}

	/* ─── Panel ────────────────────────────────────────────────────────────── */
	.scrim {
		appearance: none;
		border: 0;
		padding: 0;
		position: fixed;
		inset: 0;
		z-index: var(--z-overlay);
		background: var(--scrim);
		animation: fade 240ms var(--ease-soft);
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
	}

	.panel {
		position: fixed;
		right: max(1rem, env(safe-area-inset-right));
		bottom: calc(max(1rem, env(safe-area-inset-bottom)) + 3.5rem);
		z-index: var(--z-sheet);
		display: flex;
		flex-direction: column;
		width: 24rem;
		max-width: calc(100vw - 2rem);
		height: min(32rem, calc(100dvh - 8rem));
		border-radius: var(--r-xl);
		overflow: hidden;
		will-change: transform, opacity;
		/* Origin at the launcher: the panel grows out of the button that opened
		   it, and collapses back into it. */
		transform-origin: bottom right;
	}

	/* On touch it is a true bottom sheet: full width, anchored to the bottom
	   edge, and draggable. */
	.panel-sheet {
		left: 0;
		right: 0;
		bottom: 0;
		width: auto;
		max-width: none;
		height: min(80dvh, 34rem);
		border-radius: var(--r-xl) var(--r-xl) 0 0;
		border-bottom: 0;
		transform-origin: bottom center;
	}

	.grabber-zone {
		display: grid;
		place-items: center;
		padding: 0.625rem 0 0.25rem;
		flex-shrink: 0;
		cursor: grab;
		touch-action: none;
	}
	:global(.grabber-zone[data-dragging]) {
		cursor: grabbing;
	}
	.grabber {
		width: 2.25rem;
		height: 0.3125rem;
		border-radius: var(--r-full);
		background: var(--text-4);
		opacity: 0.6;
	}

	/* ─── Head ─────────────────────────────────────────────────────────────── */
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.75rem 0.875rem 0.75rem 1rem;
		flex-shrink: 0;
	}
	.head-id {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		min-width: 0;
	}
	.head-icon {
		display: grid;
		place-items: center;
		width: 1.875rem;
		height: 1.875rem;
		border-radius: var(--r-full);
		background: var(--accent-soft);
		color: var(--accent-text);
		flex-shrink: 0;
	}
	.head-title {
		margin: 0;
		font-size: 0.90625rem;
	}
	.head-state {
		margin: 0.0625rem 0 0;
		font-size: 0.71875rem;
		color: var(--text-4);
	}
	.head-close {
		display: grid;
		place-items: center;
		width: 1.875rem;
		height: 1.875rem;
		border: 0;
		border-radius: var(--r-full);
		background: transparent;
		color: var(--text-3);
		cursor: pointer;
		flex-shrink: 0;
	}
	.head-close:hover {
		background: var(--hairline);
		color: var(--text);
	}

	/* ─── Log ──────────────────────────────────────────────────────────────── */
	.log {
		flex: 1;
		overflow-y: auto;
		overscroll-behavior: contain;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.25rem 0.875rem 0.75rem;
		/* Content fades out under the composer rather than being cut by a rule. */
		-webkit-mask-image: linear-gradient(to bottom, transparent, #000 1.25rem);
		mask-image: linear-gradient(to bottom, transparent, #000 1.25rem);
	}

	.msg {
		max-width: 88%;
		padding: 0.625rem 0.875rem;
		border-radius: var(--r-md);
		background: var(--bg-raised);
		border: 0.5px solid var(--border);
		align-self: flex-start;
	}
	.msg-user {
		align-self: flex-end;
		background: var(--fill);
		border-color: transparent;
	}
	.msg-text {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.55;
		letter-spacing: -0.004em;
		color: var(--text-2);
		white-space: pre-wrap;
		word-break: break-word;
	}
	.msg-user .msg-text {
		color: var(--fill-text);
	}

	.wait {
		display: inline-flex;
		gap: 0.25rem;
		align-items: center;
		height: 1.1rem;
	}
	.wait span {
		width: 0.375rem;
		height: 0.375rem;
		border-radius: var(--r-full);
		background: var(--text-4);
		animation: wait 1.1s var(--ease-soft) infinite;
	}
	.wait span:nth-child(2) {
		animation-delay: 0.14s;
	}
	.wait span:nth-child(3) {
		animation-delay: 0.28s;
	}
	@keyframes wait {
		0%,
		100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		50% {
			opacity: 1;
			transform: translateY(-2px);
		}
	}

	.prompts {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.375rem;
		padding-top: 0.25rem;
	}
	.prompt {
		display: inline-flex;
		align-items: center;
		gap: 0.4375rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--r-full);
		border: 0.5px solid var(--border);
		background: transparent;
		color: var(--text-2);
		font-family: inherit;
		font-size: 0.8125rem;
		text-align: left;
		cursor: pointer;
		transition: color 180ms var(--ease-soft), border-color 180ms var(--ease-soft);
	}
	.prompt:hover {
		color: var(--text);
		border-color: var(--hairline-strong);
	}

	/* ─── Composer ─────────────────────────────────────────────────────────── */
	.composer {
		display: flex;
		align-items: flex-end;
		gap: 0.375rem;
		margin: 0 0.625rem 0.375rem;
		padding: 0.3125rem;
		border-radius: var(--r-lg);
		border: 0.5px solid var(--border);
		background: var(--bg-raised);
		flex-shrink: 0;
	}
	.composer-input {
		flex: 1;
		resize: none;
		max-height: 6rem;
		padding: 0.5rem 0.5rem 0.5rem 0.625rem;
		border: 0;
		background: transparent;
		color: var(--text);
		font-family: inherit;
		font-size: 0.875rem;
		line-height: 1.5;
	}
	.composer-input:focus {
		outline: none;
	}
	.composer-input:disabled {
		opacity: 0.5;
	}

	.composer-send {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border: 0;
		border-radius: var(--r-full);
		background: var(--fill);
		color: var(--fill-text);
		cursor: pointer;
		flex-shrink: 0;
	}
	.composer-send:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.disclaimer {
		margin: 0;
		padding: 0 1rem calc(0.75rem + env(safe-area-inset-bottom));
		font-size: 0.6875rem;
		line-height: 1.4;
		color: var(--text-4);
		flex-shrink: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.scrim {
			animation: none;
		}
		.launcher-live,
		.wait span {
			animation: none;
			opacity: 1;
		}
	}
</style>
