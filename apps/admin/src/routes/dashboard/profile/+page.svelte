<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import { toast } from '$lib/components/Toast.svelte';

  let profile = null;
  let loading = true;
  let saving = false;
  let form = {};

  onMount(async () => {
    try {
      profile = await api.getProfile();
      form = { ...profile };
    } catch {
      form = { name: 'Venkataraman TB', tagline: '', bio: '', email: 'venkataraman.tb@mythics.com', location: '', open_to_work: true };
    } finally {
      loading = false;
    }
  });

  async function save() {
    saving = true;
    try {
      if (profile?.id) {
        profile = await api.updateProfile(profile.id, form);
      } else {
        profile = await api.createProfile(form);
      }
      form = { ...profile };
      toast('Profile saved!');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head><title>Profile — VTB Admin</title></svelte:head>

<div class="space-y-6 max-w-2xl">
  <h1 class="text-3xl font-black text-white">Profile</h1>

  {#if loading}
    <div class="glass rounded-2xl border border-border p-8 animate-pulse space-y-4">
      {#each Array(6) as _}<div class="h-10 bg-white/5 rounded-xl"></div>{/each}
    </div>
  {:else}
    <form on:submit|preventDefault={save} class="glass rounded-2xl border border-border p-8 space-y-5">
      {#each [
        { key:'name',       label:'Full Name',          type:'text',     required:true },
        { key:'tagline',    label:'Tagline / Title',    type:'text'  },
        { key:'bio',        label:'Bio',                type:'textarea'  },
        { key:'email',      label:'Email',              type:'text'  },
        { key:'phone',      label:'Phone',              type:'text'  },
        { key:'location',   label:'Location',           type:'text'  },
        { key:'avatar_url', label:'Avatar URL',         type:'text'  },
        { key:'resume_url', label:'Resume URL',         type:'text'  },
      ] as field}
        <div>
          <label class="block text-sm text-slate-400 mb-1.5" for="p-{field.key}">
            {field.label}{#if field.required}<span class="text-red-400">*</span>{/if}
          </label>
          {#if field.type === 'textarea'}
            <textarea
              id="p-{field.key}"
              bind:value={form[field.key]}
              rows="5"
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder-slate-600 focus:outline-none focus:border-primary resize-none transition-colors"
            ></textarea>
          {:else}
            <input
              id="p-{field.key}"
              type="text"
              bind:value={form[field.key]}
              required={field.required}
              class="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors"
            />
          {/if}
        </div>
      {/each}

      <!-- Toggle -->
      <label class="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" bind:checked={form.open_to_work} class="w-5 h-5 rounded accent-primary" />
        <span class="text-slate-300 text-sm">Open to new opportunities</span>
      </label>

      <button
        type="submit" disabled={saving}
        class="w-full py-3.5 rounded-xl font-semibold bg-primary text-dark hover:bg-white transition-all duration-300 disabled:opacity-50"
      >{saving ? 'Saving…' : 'Save Profile'}</button>
    </form>
  {/if}
</div>
