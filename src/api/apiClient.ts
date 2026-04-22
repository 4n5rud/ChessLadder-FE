import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

function flushQueue() {
  refreshQueue.forEach(fn => fn());
  refreshQueue = [];
}

export const api = async (endpoint: string, options: RequestInit = {}) => {
  const fullUrl = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
      credentials: 'include',
    });
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    if (fetchError.name === 'AbortError') throw new Error('서버 응답 시간이 초과되었습니다.');
    throw fetchError;
  } finally {
    clearTimeout(timeoutId);
  }

  // 401 → refresh 후 원래 요청 재시도
  if (response.status === 401 && !endpoint.includes('/auth/refresh')) {
    // 동시 요청이 여러 개면 refresh는 한 번만
    if (isRefreshing) {
      await new Promise<void>(resolve => refreshQueue.push(resolve));
    } else {
      isRefreshing = true;
      try {
        const provider = useAuthStore.getState().getStoredPlatform();
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh?provider=${provider}`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!refreshRes.ok) {
          useAuthStore.getState().clearUser();
          throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
        }

        flushQueue();
      } finally {
        isRefreshing = false;
      }
    }

    // 새 쿠키로 원래 요청 재시도
    response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include',
    });
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
