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
  const data = await fetchPortfolio().catch(() => null);
  return data ?? EMPTY;
}
