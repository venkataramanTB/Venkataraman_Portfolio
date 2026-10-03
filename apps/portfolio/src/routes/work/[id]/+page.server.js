import { error } from '@sveltejs/kit';
import { BASE } from '$lib/api.js';

export async function load({ params, fetch }) {
  let payload;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${BASE}/portfolio`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw error(503, 'Project data is unavailable right now.');
    payload = await res.json();
  } catch (e) {
    // Re-throw SvelteKit errors untouched; wrap genuine network failures.
    if (e?.status) throw e;
    throw error(503, 'Project data is unavailable right now.');
  }

  const projects = payload?.projects ?? [];
  const project = projects.find((p) => String(p.id) === String(params.id));

  if (!project) throw error(404, 'No case file exists for that project.');

  // Previous/next within the same featured-first ordering the index uses,
  // so the arrows match what the visitor just clicked from.
  const ordered = [
    ...projects.filter((p) => p.is_featured),
    ...projects.filter((p) => !p.is_featured),
  ];
  const idx = ordered.findIndex((p) => String(p.id) === String(project.id));

  return {
    project,
    index: idx + 1,
    total: ordered.length,
    prev: idx > 0 ? ordered[idx - 1] : null,
    next: idx > -1 && idx < ordered.length - 1 ? ordered[idx + 1] : null,
    profile: payload?.profile ?? null,
    socialLinks: payload?.social_links ?? [],
  };
}
