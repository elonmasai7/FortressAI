import { clearAuthToken, getAuthToken, getSocketIoAuth, getSocketIoBase, guardianFetch, setAuthToken } from '@/lib/guardian';

describe('guardian client helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.resetAllMocks();
  });

  it('persists auth token and exposes socket auth payload', () => {
    setAuthToken('token-123');
    expect(getAuthToken()).toBe('token-123');
    expect(getSocketIoAuth()).toEqual({ token: 'token-123' });

    clearAuthToken();
    expect(getAuthToken()).toBe('');
  });

  it('sends bearer token for guardianFetch', async () => {
    setAuthToken('token-abc');
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);
    (global as typeof globalThis & { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    const result = await guardianFetch<{ ok: boolean }>('/guardian/alerts');

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      `${getSocketIoBase()}/guardian/alerts`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer token-abc' }),
      }),
    );
  });
});
