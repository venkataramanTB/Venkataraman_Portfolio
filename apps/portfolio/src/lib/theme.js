import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const KEY = 'vtb-theme';

/** 'auto' follows the OS; 'light' and 'dark' pin the substrate. */
export const MODES = ['auto', 'light', 'dark'];

function initial() {
  if (!browser) return 'auto';
  try {
    const saved = localStorage.getItem(KEY);
    if (MODES.includes(saved)) return saved;
  } catch {
    /* private mode / blocked storage — fall through to auto */
  }
  return 'auto';
}

export const theme = writable(initial());

/** The substrate actually in effect right now: 'light' | 'dark'. */
export const resolved = writable('light');

function systemDark() {
  return browser && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function apply(mode) {
  if (!browser) return;

  const root = document.documentElement;

  // 'auto' removes the attribute so the prefers-color-scheme media query
  // in app.css takes over. The two pinned modes set it explicitly.
  if (mode === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);

  const isDark = mode === 'dark' || (mode === 'auto' && systemDark());
  resolved.set(isDark ? 'dark' : 'light');

  // Keep the browser chrome in step with the substrate.
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? '#0a0a0a' : '#f4f4f0');
}

export function setTheme(mode) {
  if (!MODES.includes(mode)) return;
  theme.set(mode);
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* non-fatal: the theme still applies for this session */
  }
  apply(mode);
}

/** Call once from the root layout's onMount. */
export function initTheme() {
  if (!browser) return () => {};

  let current = 'auto';
  const unsub = theme.subscribe((v) => (current = v));

  apply(current);

  // Track OS changes, but only while following it.
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (current === 'auto') apply('auto');
  };
  mq.addEventListener('change', onChange);

  // Another tab changed the preference — stay in sync.
  const onStorage = (e) => {
    if (e.key !== KEY) return;
    const next = MODES.includes(e.newValue) ? e.newValue : 'auto';
    theme.set(next);
    apply(next);
  };
  window.addEventListener('storage', onStorage);

  return () => {
    mq.removeEventListener('change', onChange);
    window.removeEventListener('storage', onStorage);
    unsub();
  };
}
