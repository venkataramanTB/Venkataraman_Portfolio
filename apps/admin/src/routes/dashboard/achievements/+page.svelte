<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import CrudTable from '$lib/components/CrudTable.svelte';

  let items = [];
  onMount(async () => { items = await api.list('achievements'); });

  const fields = [
    { key: 'title',        label: 'Title',       type: 'text',    required: true },
    { key: 'description',  label: 'Description', type: 'textarea', table: false },
    { key: 'date',         label: 'Date',        type: 'text',    placeholder: '2024-06' },
    { key: 'category',     label: 'Category',    type: 'text' },
    { key: 'icon',         label: 'Emoji Icon',  type: 'text',    placeholder: '🏆' },
    { key: 'display_order',label: 'Order',       type: 'number',  default: 0 },
  ];
</script>

<svelte:head><title>Achievements — VTB Admin</title></svelte:head>

<CrudTable resource="achievements" {fields} bind:items title="Achievements" />
