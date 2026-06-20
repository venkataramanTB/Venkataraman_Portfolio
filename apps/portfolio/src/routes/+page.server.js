import { fetchPortfolio } from '$lib/api.js';

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
  // Temporary: avoid performing SSR fetch to external API to prevent
  // server-side 500s when the backend is down. The client will fetch
  // data after hydration. Returning EMPTY ensures pages render.
  return EMPTY;
}
