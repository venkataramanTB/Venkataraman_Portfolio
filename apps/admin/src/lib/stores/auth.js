import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const stored = browser ? localStorage.getItem('admin_token') : null;
export const token = writable(stored ?? '');

token.subscribe(v => {
  if (browser) {
    if (v) localStorage.setItem('admin_token', v);
    else localStorage.removeItem('admin_token');
  }
});

export function logout() {
  token.set('');
}
