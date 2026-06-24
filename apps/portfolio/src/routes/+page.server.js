import { BASE } from '$lib/api.js';

const EMPTY = {
  profile: null,
  social_links: [],
  skills: [],
  experiences: [],
  projects: [],
  certificates: [],
  achievements: [],
  education: [],
  stats: [],
};

export async function load() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${BASE}/portfolio`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return EMPTY;
    return await res.json();
  } catch {
    return EMPTY;
  }
}
