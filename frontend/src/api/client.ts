const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://localhost:4000';

type FetchOpts = RequestInit & { auth?: string | null };

async function request<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  };
  if (opts.auth) headers.Authorization = `Bearer ${opts.auth}`;

  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: string }).error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>(path, { auth: token ?? undefined }),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body), auth: token ?? undefined }),
  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body), auth: token ?? undefined }),
  del: <T>(path: string, token?: string | null) => request<T>(path, { method: 'DELETE', auth: token ?? undefined }),
};

export { API_URL };
