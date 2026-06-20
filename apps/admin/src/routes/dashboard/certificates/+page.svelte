<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import CrudTable from '$lib/components/CrudTable.svelte';

  let items = [];
  onMount(async () => { items = await api.list('certificates'); });

  const fields = [
    { key: 'title',          label: 'Certificate Title', type: 'text',  required: true },
    { key: 'issuer',         label: 'Issuer',            type: 'text',  required: true },
    { key: 'issued_date',    label: 'Issued Date',       type: 'text',  placeholder: '2024-03' },
    { key: 'expiry_date',    label: 'Expiry Date',       type: 'text',  placeholder: '2027-03 or leave blank' },
    { key: 'category',       label: 'Category',          type: 'text',  placeholder: 'Cloud, AI, DevOps…' },
    { key: 'credential_id',  label: 'Credential ID',     type: 'text',  table: false },
    { key: 'credential_url', label: 'Credential URL',    type: 'url' },
    { key: 'image_url',      label: 'Badge Image URL',   type: 'url',   table: false },
    { key: 'display_order',  label: 'Order',             type: 'number', default: 0 },
  ];
</script>

<svelte:head><title>Certificates — VTB Admin</title></svelte:head>

<CrudTable resource="certificates" {fields} bind:items title="Certificates" />
