import { env } from '$env/dynamic/public';

const BASE = (env.PUBLIC_API_URL ?? '').replace(/\/$/, '') || 'http://localhost:8000';

export async function fetchPortfolio() {
  const res = await fetch(`${BASE}/portfolio`).catch(() => null);
  if (!res || !res.ok) return null;
  return res.json();
}
