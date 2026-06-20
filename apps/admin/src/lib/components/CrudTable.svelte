<script>
  /**
   * Reusable CRUD table/form component.
   * Props:
   *   resource    — API resource name e.g. "skills"
   *   fields      — Array of field descriptor objects
   *   items       — Current item list (bound from parent)
   *   title       — Section heading
   */
  import { api } from '$lib/api.js';
  import { toast } from '$lib/stores/toast.js';
  import { createEventDispatcher } from 'svelte';

  export let resource = '';
  export let fields = [];
  export let items = [];
  export let title = '';

  const dispatch = createEventDispatcher();

  let showForm = false;
  let editing = null;   // item being edited
  let form = {};
  let saving = false;
  let deleteConfirm = null;

  function openCreate() {
    editing = null;
    form = Object.fromEntries(fields.map(f => [f.key, f.default ?? '']));
    showForm = true;
  }

  function openEdit(item) {
    editing = item;
    form = { ...item };
    showForm = true;
  }

  async function save() {
    saving = true;
    try {
      const payload = buildPayload(form);
      if (editing) {
        const updated = await api.update(resource, editing.id, payload);
        items = items.map(i => i.id === editing.id ? updated : i);
        toast(`${title} updated`);
      } else {
        const created = await api.create(resource, payload);
        items = [...items, created];
        toast(`${title} created`);
      }
      showForm = false;
      dispatch('change');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      saving = false;
    }
  }

  async function remove(item) {
    try {
      await api.remove(resource, item.id);
      items = items.filter(i => i.id !== item.id);
      deleteConfirm = null;
      toast(`Deleted`);
      dispatch('change');
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  function buildPayload(f) {
    const p = {};
    for (const field of fields) {
      let v = f[field.key];
      if (field.type === 'number') v = Number(v);
      if (field.type === 'boolean') v = Boolean(v);
      if (field.type === 'tags') v = typeof v === 'string' ? v.split(',').map(s => s.trim()).filter(Boolean) : (v ?? []);
      p[field.key] = v;
    }
    return p;
  }

  function displayValue(item, field) {
    const v = item[field.key];
    if (field.type === 'boolean') return v ? '✓' : '✗';
    if (field.type === 'tags') return Array.isArray(v) ? v.join(', ') : (v ?? '');
    return v ?? '—';
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h2 class="text-2xl font-bold text-white">{title}</h2>
    <button
      on:click={openCreate}
      class="px-5 py-2.5 rounded-xl bg-primary text-dark text-sm font-semibold hover:bg-white transition-all duration-200"
    >+ Add New</button>
  </div>

  <!-- Table -->
  {#if items.length === 0}
    <div class="glass rounded-2xl border border-border p-12 text-center text-slate-500">
      No {title.toLowerCase()} yet. Click "Add New" to get started.
    </div>
  {:else}
    <div class="overflow-x-auto rounded-2xl border border-border">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border">
            {#each fields.filter(f => f.table !== false) as field}
              <th class="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wider font-medium">{field.label}</th>
            {/each}
            <th class="px-4 py-3 text-right text-xs text-slate-500 uppercase tracking-wider font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item (item.id)}
            <tr class="border-b border-border/50 hover:bg-white/2 transition-colors">
              {#each fields.filter(f => f.table !== false) as field}
                <td class="px-4 py-3 text-slate-300 max-w-[200px] truncate">
                  {displayValue(item, field)}
                </td>
              {/each}
              <td class="px-4 py-3">
                <div class="flex items-center justify-end gap-2">
                  <button
                    on:click={() => openEdit(item)}
                    class="px-3 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary hover:text-dark transition-all duration-200"
                  >Edit</button>
                  {#if deleteConfirm === item.id}
                    <button on:click={() => remove(item)} class="px-3 py-1 rounded-lg text-xs font-medium bg-red-500 text-white">Confirm</button>
                    <button on:click={() => deleteConfirm = null} class="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-slate-400">Cancel</button>
                  {:else}
                    <button
                      on:click={() => deleteConfirm = item.id}
                      class="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
                    >Delete</button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<!-- Slide-over form -->
{#if showForm}
  <!-- Backdrop -->
  <div class="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" on:click={() => showForm = false} role="presentation"></div>

  <!-- Panel -->
  <div class="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-surface border-l border-border z-50 overflow-y-auto p-8 shadow-2xl">
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-xl font-bold text-white">{editing ? 'Edit' : 'Create'} {title}</h3>
      <button on:click={() => showForm = false} class="text-slate-400 hover:text-white text-2xl leading-none">×</button>
    </div>

    <form on:submit|preventDefault={save} class="space-y-5">
      {#each fields as field}
        <div>
          <label class="block text-sm text-slate-400 mb-1.5" for="f-{field.key}">
            {field.label}
            {#if field.required}<span class="text-red-400">*</span>{/if}
          </label>

          {#if field.type === 'textarea'}
            <textarea
              id="f-{field.key}"
              bind:value={form[field.key]}
              rows="4"
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder-slate-600 focus:outline-none focus:border-primary resize-none transition-colors"
              placeholder={field.placeholder ?? ''}
            ></textarea>

          {:else if field.type === 'boolean'}
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" bind:checked={form[field.key]} class="w-5 h-5 rounded accent-primary" />
              <span class="text-slate-300 text-sm">{field.label}</span>
            </label>

          {:else if field.type === 'number'}
            <input
              id="f-{field.key}"
              type="number"
              bind:value={form[field.key]}
              min={field.min}
              max={field.max}
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white focus:outline-none focus:border-primary transition-colors"
            />

          {:else if field.type === 'tags'}
            <input
              id="f-{field.key}"
              type="text"
              value={Array.isArray(form[field.key]) ? form[field.key].join(', ') : (form[field.key] ?? '')}
              on:input={e => form[field.key] = e.target.value}
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors"
              placeholder="Python, FastAPI, React (comma-separated)"
            />

          {:else}
            <input
              id="f-{field.key}"
              type={field.type === 'url' ? 'url' : 'text'}
              bind:value={form[field.key]}
              required={field.required}
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors"
              placeholder={field.placeholder ?? ''}
            />
          {/if}
        </div>
      {/each}

      <div class="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saving}
          class="flex-1 py-3 rounded-xl font-semibold bg-primary text-dark hover:bg-white transition-all duration-200 disabled:opacity-50"
        >{saving ? 'Saving…' : (editing ? 'Update' : 'Create')}</button>
        <button
          type="button"
          on:click={() => showForm = false}
          class="px-6 py-3 rounded-xl font-medium glass border border-border text-slate-400 hover:text-white transition-all duration-200"
        >Cancel</button>
      </div>
    </form>
  </div>
{/if}
