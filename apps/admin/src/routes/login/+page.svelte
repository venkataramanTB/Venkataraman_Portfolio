<script>
  import { goto } from '$app/navigation';
  import { token } from '$lib/stores/auth.js';
  import { api } from '$lib/api.js';
  import { toast } from '$lib/components/Toast.svelte';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';

  let email = '', password = '', loading = false;

  onMount(() => { if (get(token)) goto('/dashboard'); });

  async function login() {
    loading = true;
    try {
      const res = await api.login(email, password);
      token.set(res.access_token);
      toast('Welcome back!');
      goto('/dashboard');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head><title>Admin Login — VTB Portfolio</title></svelte:head>

<div class="min-h-screen flex items-center justify-center p-6 bg-dark">
  <!-- Background grid -->
  <div class="fixed inset-0 opacity-[0.03]"
    style="background-image: linear-gradient(rgba(167,139,250,1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,1) 1px, transparent 1px); background-size: 60px 60px;">
  </div>

  <div class="relative z-10 w-full max-w-md">
    <!-- Card -->
    <div class="glass rounded-3xl p-10 border border-border shadow-2xl">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-black gradient-text mb-1">VTB Admin</h1>
        <p class="text-slate-500 text-sm">Portfolio control panel</p>
      </div>

      <form on:submit|preventDefault={login} class="space-y-5">
        <div>
          <label class="block text-sm text-slate-400 mb-1.5" for="email">Email</label>
          <input
            id="email" type="email" bind:value={email} required
            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors"
            placeholder="venkataraman.tb@mythics.com"
          />
        </div>
        <div>
          <label class="block text-sm text-slate-400 mb-1.5" for="pw">Password</label>
          <input
            id="pw" type="password" bind:value={password} required
            class="w-full px-4 py-3 rounded-xl bg-white/5 border border-border text-white placeholder-slate-600 focus:outline-none focus:border-primary transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit" disabled={loading}
          class="w-full py-3.5 rounded-xl font-semibold bg-primary text-dark hover:bg-white transition-all duration-300 disabled:opacity-50 mt-2"
        >{loading ? 'Signing in…' : 'Sign In →'}</button>
      </form>
    </div>

    <p class="text-center text-slate-700 text-xs mt-6">
      Admin access only. <a href="/" class="text-slate-500 hover:text-white transition-colors">← Back to portfolio</a>
    </p>
  </div>
</div>
