<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import CrudTable from '$lib/components/CrudTable.svelte';

  let items = [];
  onMount(async () => { items = await api.list('skills'); });

  const fields = [
    { key: 'name',         label: 'Name',        type: 'text',    required: true },
    { key: 'category',     label: 'Category',    type: 'text',    required: true, placeholder: 'AI / ML, Full Stack, iOS…' },
    { key: 'proficiency',  label: 'Proficiency', type: 'number',  default: 80, min: 0, max: 100 },
    { key: 'color',        label: 'Color (hex)', type: 'text',    placeholder: '#a78bfa' },
    { key: 'icon_url',     label: 'Icon URL',    type: 'url',     table: false },
    { key: 'display_order',label: 'Order',       type: 'number',  default: 0 },
    { key: 'is_featured',  label: 'Featured',    type: 'boolean', default: false },
  ];
</script>

<svelte:head><title>Skills — VTB Admin</title></svelte:head>

<CrudTable resource="skills" {fields} bind:items title="Skills" />
