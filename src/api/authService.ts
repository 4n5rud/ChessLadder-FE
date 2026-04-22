import { useAuthStore } from '../store/authStore';
import { api } from './apiClient';

export interface User {
  id?: string | number;
  username?: string;
  lichess_id?: string;
  title?: string;
  description?: string | null;
  profile_image?: string | null;
  banner_image?: string | null;
  platform?: string;
  [key: string]: any;
}

/**
 * 현재 로그인한 사용자 정보 조회
 * GET /api/auth/me
 * 401 시 apiClient가 자동으로 refresh 후 재시도
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const data = await api('/auth/me', { method: 'GET' });
    return data.data ?? data;
  } catch {
    return null;
  }
}

/**
 * 앱 초기화 — 로그인 상태 복구
 * 새로고침 시 refresh 쿠키가 유효하면 access 쿠키 재발급 후 사용자 정보 반환
 * (401 처리는 apiClient에서 자동으로 수행)
 */
export async function initializeAuth(): Promise<User | null> {
  const user = await getCurrentUser();
  if (user) {
    useAuthStore.getState().setUser(user);
  }
  return user;
}

/** App.tsx 하위 호환 alias */
export const initializeAuthFromRefresh = initializeAuth;

/**
 * OAuth 성공 페이지 처리
 * 백엔드가 이미 access/refresh 쿠키를 Set-Cookie로 발급한 상태이므로
 * /api/auth/me 만 호출하면 됨
 */
export async function handleOAuthSuccess(): Promise<{ success: boolean; user?: User; error?: unknown }> {
  try {
    const data = await api('/auth/me', { method: 'GET' });
    const user = data.data ?? data;
    useAuthStore.getState().setUser(user);
    return { success: true, user };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Access Token 수동 갱신
 * POST /api/auth/refresh?provider=LICHESS|CHESSCOM
 * refresh 쿠키는 credentials: 'include'로 자동 전송됨
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const provider = useAuthStore.getState().getStoredPlatform();
    await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/refresh?provider=${provider}`, {
      method: 'POST',
      credentials: 'include',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * 로그아웃
 * POST /api/auth/logout
 */
export async function logout(): Promise<boolean> {
  try {
    await api('/auth/logout', { method: 'POST' });
    useAuthStore.getState().clearUser();
    return true;
  } catch {
    useAuthStore.getState().clearUser();
    return false;
  }
}
