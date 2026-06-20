<script>
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
  <h1 class="text-3xl font-black text-white">CV Import</h1>

  <!-- Status card -->
  {#if status?.has_cv}
    <div class="glass rounded-2xl border border-green-400/20 p-5 flex items-center gap-4">
      <div class="w-10 h-10 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center text-xl shrink-0">✓</div>
      <div class="min-w-0">
        <p class="font-semibold text-white text-sm">{status.filename}</p>
        <p class="text-xs text-slate-500 mt-0.5">
          {status.chunks_count} chunks · {status.has_embeddings ? '🔮 Vector search enabled' : '📝 Text search mode'}
        </p>
      </div>
      <span class="ml-auto text-xs text-slate-600 shrink-0">Active CV</span>
    </div>
  {/if}

  <!-- PDF Upload -->
  <div class="glass rounded-2xl border border-border p-6 space-y-5">
    <div>
      <h2 class="text-lg font-bold text-white mb-1">Upload PDF Resume</h2>
      <p class="text-sm text-slate-500">Claude will read your CV and auto-fill all portfolio sections.</p>
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
          <p class="text-sm text-slate-400">Claude is parsing your CV…</p>
        </div>
      {:else}
        <div class="flex flex-col items-center gap-3 pointer-events-none">
          <span class="text-4xl opacity-60">📄</span>
          <div>
            <p class="text-white font-medium">Drop your PDF here</p>
            <p class="text-sm text-slate-500 mt-1">or click to browse</p>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Result -->
  {#if result}
    <div class="glass rounded-2xl border border-primary/20 p-6 space-y-4">
      <p class="font-semibold text-white text-sm">✨ Import complete</p>
      <div class="grid grid-cols-3 gap-3">
        {#each [
          ['Skills', result.skills_created, '⚡'],
          ['Experiences', result.experiences_created, '💼'],
          ['Education', result.education_created, '🎓'],
          ['Certificates', result.certificates_created, '🏅'],
          ['Achievements', result.achievements_created, '🏆'],
          ['Chunks', result.chunks_embedded || result.chunks_created || 0, '🔮'],
        ] as [label, count, icon]}
          <div class="glass rounded-xl p-3 border border-border text-center">
            <p class="text-lg">{icon}</p>
            <p class="text-xl font-black text-primary">{count}</p>
            <p class="text-xs text-slate-500">{label}</p>
          </div>
        {/each}
      </div>
      <p class="text-xs text-slate-500">{result.message}</p>
    </div>
  {/if}

  <!-- LinkedIn Sync -->
  <div class="glass rounded-2xl border border-border p-6 space-y-4">
    <div>
      <h2 class="text-lg font-bold text-white mb-1">Sync from LinkedIn</h2>
      <p class="text-sm text-slate-500">
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
        class="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors text-sm"
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
        class:border-green-400={linkedinResult.status === 'success'}
        class:text-green-400={linkedinResult.status === 'success'}
        class:border-yellow-400={linkedinResult.status === 'partial'}
        class:text-yellow-400={linkedinResult.status === 'partial'}
        class:bg-green-400={linkedinResult.status === 'success'}
        class:bg-yellow-400={linkedinResult.status === 'partial'}
        style="background-color: transparent;"
      >
        {linkedinResult.message}
        {#if linkedinResult.proxycurl_required}
          <br/><span class="text-slate-500 text-xs">Set PROXYCURL_API_KEY on Render to enable full profile sync.</span>
        {/if}
      </div>
    {/if}
  </div>
</div>
