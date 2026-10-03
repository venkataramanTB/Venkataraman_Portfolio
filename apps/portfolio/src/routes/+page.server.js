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
    // Railway free-tier services sleep when idle, so the first request after a
    // quiet period pays a cold start. 2s aborted every time and the page fell
    // back to placeholder content; 9s covers a wake plus the query.
    const timer = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(`${BASE}/portfolio`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return EMPTY;
    return await res.json();
  } catch {
    return EMPTY;
  }
}
