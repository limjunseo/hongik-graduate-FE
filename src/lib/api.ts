import type { TokenResponse } from './types';

const ACCESS = 'stori.access';
const REFRESH = 'stori.refresh';
export function getToken() { return sessionStorage.getItem(ACCESS); }
export function saveTokens(tokens: TokenResponse) {
  sessionStorage.setItem(ACCESS, tokens.accessToken);
  sessionStorage.setItem(REFRESH, tokens.refreshToken);
}
export function clearTokens() {
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(REFRESH);
}
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}
async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);
  if (!response.ok || (payload && payload.success === false)) {
    throw new ApiError(payload?.message || payload?.error || (
      response.status === 401 ? '로그인이 만료되었어요. 다시 로그인해 주세요.' :
      response.status === 404 ? '아직 등록된 정보가 없습니다.' :
      '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'), response.status);
  }
  return (payload?.data ?? payload) as T;
}
async function renew(): Promise<boolean> {
  const refreshToken = sessionStorage.getItem(REFRESH);
  if (!refreshToken) return false;
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    const updated = await parseResponse<TokenResponse>(response);
    saveTokens(updated);
    return true;
  } catch {
    clearTokens();
    window.dispatchEvent(new Event('stori:session-expired'));
    return false;
  }
}
let refreshPromise: Promise<boolean> | null = null;
export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const doFetch = async () => {
    const token = getToken();
    return fetch(path, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });
  };
  let response: Response;
  try {
    response = await doFetch();
    if (response.status === 401 && !path.startsWith('/api/auth/') && getToken()) {
      refreshPromise ??= renew().finally(() => { refreshPromise = null; });
      if (await refreshPromise) response = await doFetch();
    }
    return await parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('백엔드 서버에 연결할 수 없어요. 실행 스크립트와 포트 8080을 확인해 주세요.', 0);
  }
}
