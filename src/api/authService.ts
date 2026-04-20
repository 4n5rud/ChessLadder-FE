/**
 * 인증 서비스
 * OAuth, 토큰 관리, 사용자 정보 조회 등
 */

import { useAuthStore } from '../store/authStore';
import { api } from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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
  document.cookie = `${name}=; Domain=.chessladder.org; Path=/; Max-Age=0;`;
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
    const refreshToken = getCookie('ChessLadder-refresh');
    if (!refreshToken) {
      return null;
    }

    // POST /api/auth/refresh?provider=... (쿠키만 사용)
    const provider = useAuthStore.getState().user?.platform ?? 'LICHESS';
    const response = await fetch(`${API_BASE_URL}/auth/refresh?provider=${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      deleteCookie('ChessLadder-Access');
      
      // 바로 사용자 정보 조회 (/api/auth/me)
      const userData = await getCurrentUser();
      if (userData) {
        useAuthStore.getState().setUser(userData);
        return userData;
      }
    } else {
      // 응답 본문에 없으면 쿠키에서 시도
      const cookieAccessToken = getCookie('ChessLadder-Access');
      if (cookieAccessToken) {
        useAuthStore.getState().setAccessToken(cookieAccessToken);
        deleteCookie('ChessLadder-Access');
        
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
 * 
 * 프로세스:
 * 1. 백엔드에서 이미 토큰 쿠키 설정 완료 (api.chessladder.org 도메인)
 * 2. credentials: 'include'로 /api/auth/refresh 호출 → 응답 본문에서 access token 취득
 * 3. 응답 받은 access 쿠키도 직접 읽기 (도메인 설정시)
 * 4. Zustand store에 저장
 * 5. /api/auth/me로 사용자 정보 조회
 */
export async function handleOAuthSuccess() {
  try {
    // 방법 1: 쿠키에서 access 토큰 읽기 시도 (도메인이 .chessladder.org로 설정된 경우)
    let accessToken = getCookie('ChessLadder-Access');
    
    // 방법 2: 쿠키를 못 읽으면 /api/auth/refresh로 토큰 취득 (credentials 자동 포함)
    if (!accessToken) {
      const provider = useAuthStore.getState().user?.platform ?? 'LICHESS';
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh?provider=${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        // 백엔드에서 응답 본문에 access token 포함하도록 수정되었다면 사용
        accessToken = refreshData.access_token || refreshData.data?.access_token;
      }
    }

    if (accessToken) {
      useAuthStore.getState().setAccessToken(accessToken);
      deleteCookie('ChessLadder-Access'); // 쿠키 삭제 (CSRF/XSS 공격 대비)
    }

    // /api/auth/me 호출 (Authorization 헤더로 accessToken 사용)
    const data = await api('/auth/me', {
      method: 'GET',
    });

    const user = data.data || data;
    useAuthStore.getState().setUser(user);

    return { success: true, user };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Step 7-3: 토큰 갱신
 * POST /api/auth/refresh?provider=LICHESS|CHESSCOM
 * refreshToken 쿠키가 자동으로 포함됨 (credentials: 'include')
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const provider = useAuthStore.getState().user?.platform ?? 'LICHESS';
    await api(`/auth/refresh?provider=${provider}`, {
      method: 'POST',
    });
    return true;
  } catch {
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
