export class ApiError extends Error {
  status: number;
  kind: 'http' | 'network' | 'timeout' | 'response';
  constructor(message: string, status = 0, kind: ApiError['kind'] = 'http') {
    super(message); this.status = status; this.kind = kind;
  }
}
export const READ_TIMEOUT_MS = 12000;
export const WRITE_TIMEOUT_MS = 30000;
export const requestKey = () => `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export async function api<T>(path: string, token = '', method = 'GET', body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = method === 'GET' ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = process.env.EXPO_PUBLIC_API_URL;
    if (!url) throw new ApiError('Configure EXPO_PUBLIC_API_URL and restart Expo.');
    const response = await fetch(`${url}/api/member3${path}`, {
      method, signal: controller.signal,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (response.status === 204) return undefined as T;
    let payload;
    try { payload = await response.json(); }
    catch (error) {
      if (controller.signal.aborted) throw error;
      throw new ApiError(`The API returned an unreadable response (HTTP ${response.status}). Check the backend address and retry.`, response.ok ? 0 : response.status, 'response');
    }
    if (!response.ok) throw new ApiError(typeof payload?.error === 'string' ? payload.error : `Request failed (HTTP ${response.status}).`, response.status);
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError(`The backend did not finish within ${timeoutMs / 1000} seconds. Retry the same request to check its result.`, 0, 'timeout');
    throw new ApiError('Cannot reach the API. Check that the backend is running and that this browser address is allowed by CORS_ORIGINS.', 0, 'network');
  } finally { clearTimeout(timeout); }
}
