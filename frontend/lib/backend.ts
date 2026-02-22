const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

export function getApiBase(): string {
  return API_BASE.replace(/\/+$/, '');
}

export function getWsBase(): string {
  return getApiBase().replace(/^http/, 'ws');
}

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const fallback = `Backend request failed: ${response.status}`;
    try {
      const text = await response.text();
      if (!text) throw new Error(fallback);
      try {
        const body = JSON.parse(text) as { error?: { message?: string } };
        throw new Error(body.error?.message || text || fallback);
      } catch {
        throw new Error(text || fallback);
      }
    } catch {
      throw new Error(fallback);
    }
  }

  return (await response.json()) as T;
}
