import { fetchPortfolio } from '$lib/api.js';
import { error } from '@sveltejs/kit';

export async function load() {
  try {
    const data = await fetchPortfolio();
    return data;
  } catch (e) {
    // Return empty structure so page still renders with placeholder UI
    return {
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
  }
}
