<script>
  import { toasts } from '$lib/stores/toast.js';
</script>

<div class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
  {#each $toasts as t (t.id)}
    <div
      class="flex items-center gap-3 px-5 py-3 rounded-xl glass border text-sm font-medium shadow-2xl transition-all duration-300"
      class:border-green-500={t.type === 'success'}
      class:text-green-400={t.type === 'success'}
      class:border-red-500={t.type === 'error'}
      class:text-red-400={t.type === 'error'}
      class:border-primary={t.type === 'info'}
      class:text-primary={t.type === 'info'}
    >
      {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'} {t.message}
    </div>
  {/each}
</div>
