<script>
  import '../app.css';
  import CustomCursor from '$lib/components/CustomCursor.svelte';
  import ChatWidget from '$lib/components/ChatWidget.svelte';
</script>

<CustomCursor />
<ChatWidget />
<div class="noise">
  <slot />
</div>
