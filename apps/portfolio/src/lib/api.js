import { env } from '$env/dynamic/public';

export const BASE = (env.PUBLIC_API_URL ?? '').replace(/\/$/, '') || 'http://localhost:8000';

export async function fetchPortfolio() {
  const res = await fetch(`${BASE}/portfolio`).catch(() => null);
  if (!res || !res.ok) return null;
  return res.json();
}

export async function* streamChat(messages) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`Chat error: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop() ?? '';
    for (const part of parts) {
      if (!part.startsWith('data: ')) continue;
      const payload = part.slice(6).trim();
      if (payload === '[DONE]') return;
      try {
        const parsed = JSON.parse(payload);
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.text) yield parsed.text;
      } catch {}
    }
  }
}
