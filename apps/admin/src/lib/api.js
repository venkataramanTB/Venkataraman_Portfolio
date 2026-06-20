import { env } from '$env/dynamic/public';
import { token } from '$lib/stores/auth.js';
import { get } from 'svelte/store';

const BASE = (env.PUBLIC_API_URL ?? '').replace(/\/$/, '') || 'http://localhost:8000';

function authHeaders() {
  const t = get(token);
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail?.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  login: (email, password) => req('POST', '/auth/login', { email, password }),

  // Portfolio overview
  getPortfolio: () => req('GET', '/portfolio'),

  // Profile
  getProfile:    () => req('GET', '/admin/profile'),
  createProfile: (b) => req('POST', '/admin/profile', b),
  updateProfile: (id, b) => req('PUT', `/admin/profile/${id}`, b),

  // Generic CRUD factory
  list:   (resource) => req('GET',    `/admin/${resource}`),
  create: (resource, b) => req('POST',   `/admin/${resource}`, b),
  update: (resource, id, b) => req('PUT', `/admin/${resource}/${id}`, b),
  remove: (resource, id) => req('DELETE', `/admin/${resource}/${id}`),
};
