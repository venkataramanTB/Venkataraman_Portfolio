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
  import Icon from './Icon.svelte';

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
  let errors = {};

  $: cols = fields.filter((f) => f.table !== false);

  function openCreate() {
    editing = null;
    errors = {};
    form = Object.fromEntries(fields.map((f) => [f.key, f.default ?? '']));
    showForm = true;
  }

  function openEdit(item) {
    editing = item;
    errors = {};
    form = { ...item };
    showForm = true;
  }

  function closeForm() {
    showForm = false;
    deleteConfirm = null;
  }

  // Client-side validation so required fields fail here, not at the API.
  function validate() {
    const next = {};
    for (const field of fields) {
      const v = form[field.key];
      if (field.required && (v === '' || v === null || v === undefined)) {
        next[field.key] = `${field.label} is required.`;
        continue;
      }
      if (field.type === 'url' && v) {
        try { new URL(v); } catch { next[field.key] = 'Enter a full URL including https://'; }
      }
      if (field.type === 'number' && v !== '' && v !== null && v !== undefined) {
        const n = Number(v);
        if (Number.isNaN(n)) next[field.key] = 'Enter a number.';
        else if (field.min !== undefined && n < field.min) next[field.key] = `Minimum is ${field.min}.`;
        else if (field.max !== undefined && n > field.max) next[field.key] = `Maximum is ${field.max}.`;
      }
    }
    errors = next;
    return Object.keys(next).length === 0;
  }

  function touch(key) {
    if (errors[key]) {
      const { [key]: _, ...rest } = errors;
      errors = rest;
    }
  }

  async function save() {
    if (!validate()) return;
    saving = true;
    try {
      const payload = buildPayload(form);
      if (editing) {
        const updated = await api.update(resource, editing.id, payload);
        items = items.map((i) => (i.id === editing.id ? updated : i));
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
      items = items.filter((i) => i.id !== item.id);
      deleteConfirm = null;
      toast(`${title} deleted`);
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
      if (field.type === 'tags') {
        v = typeof v === 'string'
          ? v.split(',').map((s) => s.trim()).filter(Boolean)
          : (v ?? []);
      }
      p[field.key] = v;
    }
    return p;
  }

  function displayValue(item, field) {
    const v = item[field.key];
    if (field.type === 'boolean') return v ? 'Yes' : 'No';
    if (field.type === 'tags') return Array.isArray(v) ? v.join(', ') : (v ?? '');
    return v ?? '—';
  }

  function onKey(e) {
    if (e.key === 'Escape' && showForm) closeForm();
  }
</script>

<svelte:window on:keydown={onKey} />

<section class="wrap">
  <!-- Header -->
  <div class="head">
    <div class="head-text">
      <h2 class="t-display head-title">{title}</h2>
      <span class="t-micro head-count">
        {items.length} {items.length === 1 ? 'record' : 'records'}
      </span>
    </div>
    <button on:click={openCreate} class="btn btn-hazard"
            aria-label="Add record" title="Add record">
      <Icon name="plus" size={15} />
    </button>
  </div>

  <div class="hazard-stripes head-stripe" aria-hidden="true"></div>

  <!-- Table -->
  {#if items.length === 0}
    <!-- Composed empty state rather than one grey sentence -->
    <div class="empty">
      <span class="t-micro">&#91; No records &#93;</span>
      <p class="empty-copy">
        Nothing is filed under {title.toLowerCase()} yet. Add the first record and it
        appears on the portfolio immediately.
      </p>
      <button on:click={openCreate} class="btn btn-hazard"
              aria-label="Add the first record" title="Add the first record">
        <Icon name="plus" size={15} />
      </button>
      <div class="empty-skel">
        {#each Array(3) as _}
          <div class="skel skel-row"></div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="tbl-wrap">
      <table class="tbl">
        <thead>
          <tr>
            <th class="col-idx">#</th>
            {#each cols as field}
              <th>{field.label}</th>
            {/each}
            <th class="col-act">Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each items as item, i (item.id)}
            <tr>
              <td class="col-idx cell-idx">{String(i + 1).padStart(2, '0')}</td>
              {#each cols as field}
                <td class="cell" title={String(displayValue(item, field))}>
                  {displayValue(item, field)}
                </td>
              {/each}
              <td class="col-act">
                <div class="acts">
                  <button on:click={() => openEdit(item)} class="mini"
                          aria-label="Edit record" title="Edit">
                    <Icon name="edit" size={14} />
                  </button>
                  {#if deleteConfirm === item.id}
                    <button on:click={() => remove(item)} class="mini mini-danger"
                            aria-label="Confirm delete" title="Confirm delete">
                      <Icon name="check" size={14} />
                    </button>
                    <button on:click={() => (deleteConfirm = null)} class="mini"
                            aria-label="Cancel delete" title="Cancel">
                      <Icon name="close" size={14} />
                    </button>
                  {:else}
                    <button on:click={() => (deleteConfirm = item.id)} class="mini mini-warn"
                            aria-label="Delete record" title="Delete">
                      <Icon name="trash" size={14} />
                    </button>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<!-- Slide-over editor -->
{#if showForm}
  <div
    class="scrim"
    on:click={closeForm}
    on:keydown={null}
    role="presentation"
  ></div>

  <aside class="drawer" role="dialog" aria-modal="true" aria-label="{editing ? 'Edit' : 'Create'} {title}">
    <header class="drawer-head">
      <div>
        <span class="t-micro">&#91; {editing ? 'Editing' : 'New record'} &#93;</span>
        <h3 class="t-head drawer-title">{title}</h3>
      </div>
      <button on:click={closeForm} class="btn btn-ghost drawer-x"
              aria-label="Close editor" title="Close">
        <Icon name="close" size={16} />
      </button>
    </header>

    <form on:submit|preventDefault={save} class="form">
      {#each fields as field}
        <div class="row">
          {#if field.type === 'boolean'}
            <label class="check">
              <input
                type="checkbox"
                bind:checked={form[field.key]}
                class="check-box"
              />
              <span class="check-label">{field.label}</span>
            </label>

          {:else}
            <label class="label" for="f-{field.key}">
              {field.label}{#if field.required}<span class="req">*</span>{/if}
            </label>

            {#if field.type === 'textarea'}
              <textarea
                id="f-{field.key}"
                bind:value={form[field.key]}
                on:input={() => touch(field.key)}
                rows="4"
                class="field area"
                class:field-bad={errors[field.key]}
                placeholder={field.placeholder ?? ''}
                aria-invalid={errors[field.key] ? 'true' : undefined}
                aria-describedby={errors[field.key] ? `e-${field.key}` : undefined}
              ></textarea>

            {:else if field.type === 'number'}
              <input
                id="f-{field.key}"
                type="number"
                bind:value={form[field.key]}
                on:input={() => touch(field.key)}
                min={field.min}
                max={field.max}
                class="field"
                class:field-bad={errors[field.key]}
                aria-invalid={errors[field.key] ? 'true' : undefined}
                aria-describedby={errors[field.key] ? `e-${field.key}` : undefined}
              />

            {:else if field.type === 'tags'}
              <input
                id="f-{field.key}"
                type="text"
                value={Array.isArray(form[field.key]) ? form[field.key].join(', ') : (form[field.key] ?? '')}
                on:input={(e) => { form[field.key] = e.target.value; touch(field.key); }}
                class="field"
                class:field-bad={errors[field.key]}
                placeholder="Python, FastAPI, React"
                aria-describedby="h-{field.key}"
              />
              <p id="h-{field.key}" class="hint">Separate values with commas.</p>

            {:else}
              <input
                id="f-{field.key}"
                type={field.type === 'url' ? 'url' : 'text'}
                bind:value={form[field.key]}
                on:input={() => touch(field.key)}
                class="field"
                class:field-bad={errors[field.key]}
                placeholder={field.placeholder ?? ''}
                aria-invalid={errors[field.key] ? 'true' : undefined}
                aria-describedby={errors[field.key] ? `e-${field.key}` : undefined}
              />
            {/if}

            {#if errors[field.key]}
              <p id="e-{field.key}" class="err" role="alert">{errors[field.key]}</p>
            {/if}
          {/if}
        </div>
      {/each}

      <div class="form-foot">
        <button type="submit" disabled={saving} class="btn btn-hazard grow"
                aria-label={editing ? 'Update record' : 'Create record'}
                title={editing ? 'Update record' : 'Create record'}>
          <Icon name="check" size={15} />
        </button>
        <button type="button" on:click={closeForm} class="btn btn-ghost"
                aria-label="Cancel" title="Cancel">
          <Icon name="close" size={15} />
        </button>
      </div>
    </form>
  </aside>
{/if}

<style>
  .wrap { display: flex; flex-direction: column; gap: 0; }

  /* ─── Header ───────────────────────────────────────────────────────────── */
  .head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding-bottom: 0.875rem;
  }
  .head-text { display: flex; flex-direction: column; gap: 0.3rem; }
  .head-title { margin: 0; }
  .head-count { color: var(--ink-4); }
  .head-stripe { height: 8px; opacity: 0.16; margin-bottom: 1.25rem; }

  /* ─── Table ────────────────────────────────────────────────────────────── */
  .tbl-wrap {
    overflow-x: auto;
    border: 1px solid var(--rule-strong);
  }

  .col-idx { width: 3rem; }
  .cell-idx { color: var(--ink-4); font-weight: 600; }

  .col-act { width: 1%; white-space: nowrap; text-align: right; }

  .cell {
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .acts { display: flex; gap: 0.3rem; justify-content: flex-end; }

  .mini {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem;
    background: transparent;
    border: 1px solid var(--rule);
    color: var(--ink-3);
    font-family: var(--font-mono);
    font-size: 0.625rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background-color 180ms var(--ease-out), color 180ms var(--ease-out),
      border-color 180ms var(--ease-out);
  }
  .mini:hover { background: var(--ink); color: var(--paper); border-color: var(--ink); }

  .mini-warn { color: var(--hazard-ink); border-color: rgba(230, 25, 25, 0.4); }
  .mini-warn:hover { background: var(--hazard); color: var(--paper); border-color: var(--hazard); }

  .mini-danger {
    background: var(--hazard);
    color: var(--paper);
    border-color: var(--hazard);
  }
  .mini-danger:hover { background: var(--ink); border-color: var(--ink); }

  /* ─── Empty state ──────────────────────────────────────────────────────── */
  .empty {
    border: 1px solid var(--rule-strong);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.875rem;
  }
  .empty-copy {
    margin: 0;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.65;
    color: var(--ink-2);
    max-width: 58ch;
  }
  .empty-skel {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 1px;
    margin-top: 0.5rem;
  }
  .skel-row { height: 2rem; }
  .skel-row:nth-child(2) { width: 86%; }
  .skel-row:nth-child(3) { width: 68%; }

  /* ─── Drawer ───────────────────────────────────────────────────────────── */
  .scrim {
    position: fixed;
    inset: 0;
    z-index: var(--z-overlay);
    background: var(--scrim);
  }

  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: var(--z-modal);
    width: 100%;
    max-width: 30rem;
    background: var(--paper);
    border-left: 3px solid var(--ink);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .drawer-head {
    position: sticky;
    top: 0;
    background: var(--paper);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1rem 1.25rem;
    border-bottom: 1px solid var(--rule-strong);
  }
  .drawer-title { margin: 0.25rem 0 0; }
  .drawer-x { padding: 0.3rem 0.55rem; }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.25rem;
  }

  .row { display: flex; flex-direction: column; }
  .req { color: var(--hazard); margin-left: 0.15rem; }
  .area { resize: vertical; min-height: 6rem; }

  .hint {
    margin: 0.3rem 0 0;
    font-family: var(--font-mono);
    font-size: 0.625rem;
    letter-spacing: 0.04em;
    color: var(--ink-4);
  }

  .err {
    margin: 0.3rem 0 0;
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--hazard-ink);
  }

  .check {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    padding: 0.3rem 0;
  }
  .check-box {
    width: 1rem;
    height: 1rem;
    accent-color: var(--hazard);
    flex-shrink: 0;
  }
  .check-label {
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink);
  }

  .form-foot {
    display: flex;
    gap: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--rule);
    margin-top: 0.5rem;
  }
  .grow { flex: 1; }
</style>
