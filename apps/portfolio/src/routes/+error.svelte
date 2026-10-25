<script>
	/**
	 * Error page.
	 *
	 * Never trap the reader: every status gets a plain explanation of what
	 * happened, whether it's worth retrying, and at least one way onward. The
	 * copy is per-status because "something went wrong" tells nobody anything.
	 */
	import { page } from '$app/stores';
	import { press } from '$lib/motion/gestures.js';
	import Icon from '$lib/components/Icon.svelte';

	$: status = $page.status;
	$: message = $page.error?.message ?? '';

	const COPY = {
		404: {
			title: 'No such page',
			body: 'The address is right-looking but nothing lives there. It may have been renamed, or the link may be stale.',
			retry: false
		},
		503: {
			title: 'The server is waking up',
			body: 'The API sleeps when idle on the free tier. Give it twenty seconds and try again — it usually answers on the second attempt.',
			retry: true
		},
		500: {
			title: 'Something broke on our side',
			body: "That's a bug, not something you did. Retrying is worth one attempt; if it persists, the contact form reaches a human.",
			retry: true
		}
	};

	$: copy =
		COPY[status] ?? {
			title: `Error ${status}`,
			body: 'An unexpected response came back. Retrying may help.',
			retry: true
		};
</script>

<svelte:head>
	<title>{copy.title} — Venkataraman TB</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main" class="wrap">
	<div class="shell inner">
		<p class="t-mono status">{status}</p>
		<h1 class="t-display title">{copy.title}</h1>
		<p class="t-lead body">{copy.body}</p>

		{#if message && message !== copy.title}
			<p class="t-mono detail">{message}</p>
		{/if}

		<div class="actions">
			<a class="btn btn-primary" href="/" use:press>
				<Icon name="arrow-left" size={16} />
				<span>Back to the portfolio</span>
			</a>

			{#if copy.retry}
				<button class="btn" on:click={() => location.reload()} use:press>
					<Icon name="retry" size={16} />
					<span>Try again</span>
				</button>
			{/if}

			<a class="btn btn-quiet" href="/#contact" use:press>
				<span>Report it</span>
			</a>
		</div>
	</div>
</main>

<style>
	.wrap {
		min-height: 100svh;
		display: grid;
		place-items: center;
		padding-block: 4rem;
	}

	.inner {
		max-width: 38rem;
	}

	.status {
		font-size: 0.8125rem;
		color: var(--text-4);
		margin-bottom: 1rem;
	}

	.title {
		margin-bottom: 1rem;
	}

	.body {
		margin-bottom: 1.5rem;
	}

	.detail {
		padding: 0.75rem 0.875rem;
		margin-bottom: 1.5rem;
		border-radius: var(--r-sm);
		background: var(--bg-sunk);
		border: 0.5px solid var(--border);
		color: var(--text-3);
		word-break: break-word;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.625rem;
	}
</style>
