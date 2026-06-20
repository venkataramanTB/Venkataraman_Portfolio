<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import CrudTable from '$lib/components/CrudTable.svelte';

  let items = [];
  onMount(async () => { items = await api.list('social-links'); });

  const fields = [
    { key: 'platform',     label: 'Platform',     type: 'text',   required: true, placeholder: 'LinkedIn, GitHub…' },
    { key: 'url',          label: 'URL',          type: 'url',    required: true },
    { key: 'icon',         label: 'Icon key',     type: 'text',   placeholder: 'linkedin' },
    { key: 'display_order',label: 'Order',        type: 'number', default: 0 },
  ];
</script>

<svelte:head><title>Social Links — VTB Admin</title></svelte:head>

<CrudTable resource="social-links" {fields} bind:items title="Social Links" />
