import { getApiBase, getWsBase } from './backend';

export function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('fortressai_token') || '';
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fortressai_token', token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('fortressai_token');
}

export async function guardianFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export function getAlertWsUrl(): string {
  const token = getAuthToken();
  return `${getWsBase()}/ws/alerts?token=${encodeURIComponent(token)}`;
}
