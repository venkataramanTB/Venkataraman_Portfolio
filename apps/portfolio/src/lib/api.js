import { PUBLIC_API_URL } from '$env/static/public';

const BASE = PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchPortfolio() {
  const res = await fetch(`${BASE}/portfolio`);
  if (!res.ok) throw new Error('Failed to fetch portfolio data');
  return res.json();
}
