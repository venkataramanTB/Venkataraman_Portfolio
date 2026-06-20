<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import CrudTable from '$lib/components/CrudTable.svelte';

  let items = [];
  onMount(async () => { items = await api.list('stats'); });

  const fields = [
    { key: 'label',        label: 'Label',   type: 'text',   required: true, placeholder: 'Projects Shipped' },
    { key: 'value',        label: 'Value',   type: 'text',   required: true, placeholder: '30' },
    { key: 'suffix',       label: 'Suffix',  type: 'text',   placeholder: '+' },
    { key: 'icon',         label: 'Icon',    type: 'text',   placeholder: 'rocket' },
    { key: 'display_order',label: 'Order',   type: 'number', default: 0 },
  ];
</script>

<svelte:head><title>Stats — VTB Admin</title></svelte:head>

<CrudTable resource="stats" {fields} bind:items title="Stats" />
