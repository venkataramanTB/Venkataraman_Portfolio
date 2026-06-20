<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import CrudTable from '$lib/components/CrudTable.svelte';

  let items = [];
  onMount(async () => { items = await api.list('education'); });

  const fields = [
    { key: 'institution',  label: 'Institution',      type: 'text',   required: true },
    { key: 'degree',       label: 'Degree',           type: 'text',   required: true },
    { key: 'field',        label: 'Field of Study',   type: 'text' },
    { key: 'start_date',   label: 'Start Date',       type: 'text',   placeholder: '2018-07' },
    { key: 'end_date',     label: 'End Date',         type: 'text',   placeholder: '2022-05' },
    { key: 'gpa',          label: 'GPA',              type: 'number' },
    { key: 'description',  label: 'Description',      type: 'textarea', table: false },
    { key: 'logo_url',     label: 'Logo URL',         type: 'url',    table: false },
    { key: 'display_order',label: 'Order',            type: 'number', default: 0 },
  ];
</script>

<svelte:head><title>Education — VTB Admin</title></svelte:head>

<CrudTable resource="education" {fields} bind:items title="Education" />
