<script>
  import Icon from '$lib/components/Icon.svelte';
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { toast } from '$lib/stores/toast.js';

  let status = null;
  let uploading = false;
  let syncing = false;
  let dragOver = false;
  let result = null;
  let linkedinUrl = '';
  let linkedinResult = null;
  let fileInput;

  onMount(async () => {
    try { status = await api.getCVStatus(); } catch {}
  });

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.pdf')) {
      toast('Only PDF files are accepted', 'error');
      return;
    }
    uploading = true;
    result = null;
    try {
      result = await api.uploadCV(file);
      status = await api.getCVStatus();
      toast('CV uploaded and processed!');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      uploading = false;
    }
  }

  function onFileChange(e) { handleFile(e.target.files?.[0]); }
  function onDrop(e) {
    e.preventDefault();
    dragOver = false;
    handleFile(e.dataTransfer?.files?.[0]);
  }

  async function handleLinkedIn() {
    if (!linkedinUrl.trim()) { toast('Enter a LinkedIn URL', 'error'); return; }
    syncing = true;
    linkedinResult = null;
    try {
      linkedinResult = await api.syncLinkedIn(linkedinUrl.trim());
      toast(linkedinResult.message || 'LinkedIn synced!');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      syncing = false;
    }
  }
</script>

<svelte:head><title>CV Import — VTB Admin</title></svelte:head>

<div class="space-y-8 max-w-2xl">
  <h1 class="text-3xl font-black text-ink">CV Import</h1>

  <!-- Status card -->
  {#if status?.has_cv}
    <div class="glass rounded-2xl border border-ink/20 p-5 flex items-center gap-4">
      <div class="w-10 h-10 rounded-xl bg-ink/10 border border-ink/20 flex items-center justify-center text-xl shrink-0">✓</div>
      <div class="min-w-0">
        <p class="font-semibold text-ink text-sm">{status.filename}</p>
        <p class="text-xs text-ink-3 mt-0.5">
          {status.chunks_count} chunks · {status.has_embeddings ? '🔮 Vector search enabled' : '📝 Text search mode'}
        </p>
      </div>
      <span class="ml-auto text-xs text-ink-4 shrink-0">Active CV</span>
    </div>
  {/if}

  <!-- PDF Upload -->
  <div class="glass rounded-2xl border border-border p-6 space-y-5">
    <div>
      <h2 class="text-lg font-bold text-ink mb-1">Upload PDF Resume</h2>
      <p class="text-sm text-ink-3">Claude will read your CV and auto-fill all portfolio sections.</p>
    </div>

    <!-- Drop zone -->
    <div
      role="button"
      tabindex="0"
      class="relative rounded-2xl border-2 border-dashed transition-all duration-300 p-10 text-center cursor-pointer"
      class:border-primary={dragOver}
      class:bg-primary={dragOver}
      class:bg-opacity-5={dragOver}
      class:border-border={!dragOver}
      on:dragover|preventDefault={() => dragOver = true}
      on:dragleave={() => dragOver = false}
      on:drop={onDrop}
      on:click={() => fileInput?.click()}
      on:keydown={(e) => e.key === 'Enter' && fileInput?.click()}
    >
      <input bind:this={fileInput} type="file" accept=".pdf" class="hidden" on:change={onFileChange} />
      {#if uploading}
        <div class="flex flex-col items-center gap-3">
          <div class="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-ink-3">Claude is parsing your CV…</p>
        </div>
      {:else}
        <div class="flex flex-col items-center gap-3 pointer-events-none">
          <span class="text-4xl opacity-60">📄</span>
          <div>
            <p class="text-ink font-medium">Drop your PDF here</p>
            <p class="text-sm text-ink-3 mt-1">or click to browse</p>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Result -->
  {#if result}
    <div class="panel p-6 space-y-4">
      <p class="done">
        <Icon name="check" size={16} />
        <span>Import complete</span>
      </p>
      <div class="grid grid-cols-3 gap-3">
        {#each [
          ['Skills', result.skills_created, 'stack'],
          ['Experiences', result.experiences_created, 'work'],
          ['Education', result.education_created, 'education'],
          ['Certificates', result.certificates_created, 'verify'],
          ['Achievements', result.achievements_created, 'achievements'],
          ['Chunks', result.chunks_embedded || result.chunks_created || 0, 'document'],
        ] as [label, count, icon]}
          <div class="result-cell">
            <span class="result-icon" aria-hidden="true"><Icon name={icon} size={16} /></span>
            <p class="result-count">{count}</p>
            <p class="text-xs text-ink-3">{label}</p>
          </div>
        {/each}
      </div>
      <p class="text-xs text-ink-3">{result.message}</p>
    </div>
  {/if}

  <!-- LinkedIn Sync -->
  <div class="glass rounded-2xl border border-border p-6 space-y-4">
    <div>
      <h2 class="text-lg font-bold text-ink mb-1">Sync from LinkedIn</h2>
      <p class="text-sm text-ink-3">
        Paste your LinkedIn profile URL. With a
        <a href="https://nubela.co/proxycurl" target="_blank" rel="noopener" class="text-primary hover:underline">Proxycurl</a>
        API key configured on Render, this syncs your full profile.
        Without it, the URL is saved as your LinkedIn social link.
      </p>
    </div>

    <div class="flex gap-3">
      <input
        type="url"
        bind:value={linkedinUrl}
        placeholder="https://linkedin.com/in/your-profile"
        class="flex-1 px-4 py-3 rounded-xl bg-ink/5 border border-border text-ink placeholder-ink-4 focus:outline-none focus:border-primary transition-colors text-sm"
      />
      <button
        on:click={handleLinkedIn}
        disabled={syncing}
        class="px-6 py-3 rounded-xl font-semibold text-sm bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary hover:text-dark transition-all duration-200 disabled:opacity-50 whitespace-nowrap"
      >
        {syncing ? 'Syncing…' : 'Sync →'}
      </button>
    </div>

    {#if linkedinResult}
      <div class="rounded-xl px-4 py-3 text-sm border"
        class:border-ink={linkedinResult.status === 'success'}
        class:text-ink={linkedinResult.status === 'success'}
        class:border-hazard={linkedinResult.status === 'partial'}
        class:text-hazard={linkedinResult.status === 'partial'}
        class:bg-ink={linkedinResult.status === 'success'}
        class:bg-hazard={linkedinResult.status === 'partial'}
        style="background-color: transparent;"
      >
        {linkedinResult.message}
        {#if linkedinResult.proxycurl_required}
          <br/><span class="text-ink-3 text-xs">Set PROXYCURL_API_KEY on Render to enable full profile sync.</span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .done {
    display: flex;
    align-items: center;
    gap: 0.4375rem;
    margin: 0;
    font-size: 0.875rem;
    font-weight: 560;
    color: var(--live);
  }

  .result-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.875rem 0.5rem;
    border-radius: var(--r-md);
    border: 0.5px solid var(--border);
    background: var(--bg-sunk);
    text-align: center;
  }
  .result-icon {
    color: var(--text-3);
  }
  .result-count {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 640;
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
    color: var(--text);
  }
</style>
