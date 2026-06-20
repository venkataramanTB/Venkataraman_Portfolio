<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import CrudTable from '$lib/components/CrudTable.svelte';

  let items = [];
  onMount(async () => { items = await api.list('experiences'); });

  const fields = [
    { key: 'company',          label: 'Company',       type: 'text',    required: true },
    { key: 'role',             label: 'Role / Title',  type: 'text',    required: true },
    { key: 'description',      label: 'Description',   type: 'textarea', table: false },
    { key: 'start_date',       label: 'Start Date',    type: 'text',    placeholder: '2023-01' },
    { key: 'end_date',         label: 'End Date',      type: 'text',    placeholder: '2024-06 or leave blank' },
    { key: 'is_current',       label: 'Currently Here',type: 'boolean', default: false },
    { key: 'location',         label: 'Location',      type: 'text' },
    { key: 'technologies',     label: 'Technologies',  type: 'tags',    placeholder: 'Python, FastAPI…' },
    { key: 'company_logo_url', label: 'Logo URL',      type: 'url',     table: false },
    { key: 'display_order',    label: 'Order',         type: 'number',  default: 0 },
  ];
</script>

<svelte:head><title>Experience — VTB Admin</title></svelte:head>

<CrudTable resource="experiences" {fields} bind:items title="Experience" />
