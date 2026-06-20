<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api.js';
  import CrudTable from '$lib/components/CrudTable.svelte';

  let items = [];
  onMount(async () => { items = await api.list('projects'); });

  const fields = [
    { key: 'title',            label: 'Title',            type: 'text',    required: true },
    { key: 'description',      label: 'Short Description',type: 'textarea', table: false },
    { key: 'long_description', label: 'Full Description', type: 'textarea', table: false },
    { key: 'category',         label: 'Category',         type: 'text',    placeholder: 'AI / ML, Full Stack, iOS…' },
    { key: 'technologies',     label: 'Technologies',     type: 'tags' },
    { key: 'thumbnail_url',    label: 'Thumbnail URL',    type: 'url',     table: false },
    { key: 'demo_url',         label: 'Demo URL',         type: 'url' },
    { key: 'github_url',       label: 'GitHub URL',       type: 'url' },
    { key: 'appstore_url',     label: 'App Store URL',    type: 'url',     table: false },
    { key: 'is_featured',      label: 'Featured',         type: 'boolean', default: false },
    { key: 'display_order',    label: 'Order',            type: 'number',  default: 0 },
  ];
</script>

<svelte:head><title>Projects — VTB Admin</title></svelte:head>

<CrudTable resource="projects" {fields} bind:items title="Projects" />
