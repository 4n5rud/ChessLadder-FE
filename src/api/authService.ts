/**
 * 인증 서비스
 * OAuth, 토큰 관리, 사용자 정보 조회 등
 */

import { useAuthStore } from '../store/authStore';
import { api } from './apiClient';

const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8080/api' 
  : (import.meta.env.VITE_API_BASE_URL || '/api');

export interface User {
  id?: string | number;
  username?: string;
  lichess_id?: string;
  title?: string;
  description?: string | null;
  profile_image?: string | null;
  banner_image?: string | null;
  [key: string]: any;
}

/**
 * Step 2: OAuth URL 요청
 * GET /api/oauth/oauth-url
 * 응답: { code: 200, data: { oauth_url: "https://lichess.org/oauth?..." } }
 */
export async function getOauthUrl() {
  try {
    const data = await api('/oauth/oauth-url', {
      method: 'GET',
    });

    // 백엔드가 snake_case로 보냄: oauth_url
    const oauth_url = data.data?.oauth_url || data.oauth_url;

    if (!oauth_url) {
      throw new Error('OAuth URL not found in response');
    }

    return { success: true, oauth_url };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Step 3: Lichess로 리다이렉트
 */
export function redirectToLichess(oauth_url: string) {
  window.location.href = oauth_url;
}

/**
 * 쿠키에서 값 읽기
 */
function getCookie(name: string): string | null {
  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
}

/**
 * 쿠키 삭제
 */
function deleteCookie(name: string) {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
}

/**
 * Refresh 토큰 확인 및 자동 갱신
 * 새로고침 시 refresh 쿠키가 있으면:
 * 1. access 토큰 갱신 (응답 본문에서 받음)
 * 2. authStore에 토큰 저장
 * 3. /api/auth/me 호출해서 사용자 정보 조회
 * 4. 사용자 정보 반환
 */
export async function initializeAuthFromRefresh(): Promise<User | null> {
  try {
    // refresh 쿠키 확인
    const refreshToken = getCookie('refresh');
    if (!refreshToken) {
      return null;
    }

    // GET /api/auth/refresh (Authorization 헤더 없음, 쿠키만 사용)
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // 응답 본문에서 access 토큰 읽기
    const accessToken = data.access_token || data.data?.access_token;
    if (accessToken) {
      useAuthStore.getState().setAccessToken(accessToken);
      // 쿠키도 있으면 삭제 (XSS 공격 대비)
      deleteCookie('access');
      
      // 바로 사용자 정보 조회 (/api/auth/me)
      const userData = await getCurrentUser();
      if (userData) {
        useAuthStore.getState().setUser(userData);
        return userData;
      }
    } else {
      // 응답 본문에 없으면 쿠키에서 시도
      const cookieAccessToken = getCookie('access');
      if (cookieAccessToken) {
        useAuthStore.getState().setAccessToken(cookieAccessToken);
        deleteCookie('access');
        
        const userData = await getCurrentUser();
        if (userData) {
          useAuthStore.getState().setUser(userData);
          return userData;
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Step 5: OAuth 성공 처리
 * /oauth/success 페이지에서 호출
 * 1. 쿠키에서 access token 읽어서 store에 저장
 * 2. GET /api/auth/me로 현재 사용자 정보 확인
 * 3. 사용자 정보 store에 저장
 */
export async function handleOAuthSuccess() {
  try {
    // 먼저 쿠키에서 access 토큰 읽기 및 저장
    const accessToken = getCookie('access');
    if (accessToken) {
      // Zustand store에 저장 (다음 api 호출 때 Authorization 헤더에 사용)
      useAuthStore.getState().setAccessToken(accessToken);
      // 쿠키 삭제 (CSRF/XSS 공격 대비)
      deleteCookie('access');
    }

    // 이제 Authorization 헤더와 함께 /api/auth/me 호출
    const data = await api('/auth/me', {
      method: 'GET',
    });

    const user = data.data || data;

    // 상태 관리에 저장
    useAuthStore.getState().setUser(user);

    return { success: true, user };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Step 7-3: 토큰 갱신
 * GET /api/auth/refresh
 * refreshToken 쿠키가 자동으로 포함됨 (credentials: 'include')
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    // api() 함수는 이미 credentials: 'include' 처리 및 Authorization 헤더 추가 처리함
    await api('/auth/refresh', {
      method: 'GET',
    });

    // 새 Access Token이 Set-Cookie로 자동 저장됨
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 현재 로그인한 사용자 정보 조회
 * GET /api/auth/me
 * 401 시 자동으로 토큰 갱신 후 재시도 (apiClient의 401 handling)
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const data = await api('/auth/me', {
      method: 'GET',
    });
    return data.data || data;
  } catch (error) {
    return null;
  }
}

/**
 * 앱 초기화-로그인 상태 확인
 * 1. access token이 없으면 /api/auth/me 호출 시 401
 * 2. apiClient에서 자동으로 refresh token으로 갱신 (401 handling)
 * 3. 갱신 후 /api/auth/me 재시도 → 사용자 정보 반환
 */
export async function initializeAuth(): Promise<User | null> {
  try {
    // /api/auth/me 호출 (401이면 apiClient에서 자동으로 refresh)
    const user = await getCurrentUser();
    
    if (user) {
      // /api/auth/me 성공 (로그인 상태)
      return user;
    } else {
      // /api/auth/me 실패 (비로그인 상태)
      return null;
    }
  } catch (error) {
    return null;
  }
}

/**
 * Step 8: 로그아웃
 * POST /api/auth/logout
 * 401 시 자동으로 토큰 갱신 후 재시도 (apiClient의 401 handling)
 */
export async function logout(): Promise<boolean> {
  try {
    await api('/auth/logout', {
      method: 'POST',
    });

    // Zustand 상태 정리
    useAuthStore.getState().clearUser();

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 로그인 상태 확인
 * Zustand store의 access_token 존재 여부로 판단
 */
export function isLoggedIn(): boolean {
  const accessToken = useAuthStore.getState().access_token;
  return !!accessToken;
}
