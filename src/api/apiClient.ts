// API Client 
// 명세서: 방법 A (credentials: 'include' 자동 포함)

import { useAuthStore } from '../store/authStore';

// 개발 환경에서는 localhost:8080, 프로덕션에서는 Vercel 환경변수 사용
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8080/api' 
  : (import.meta.env.VITE_API_BASE_URL || '/api');

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
 * 기본 API 호출 함수
 * 명세서 Step 6-2 "방법 A: 자동 포함 (권장)"
 * 
 * 특징:
 * - credentials: 'include' 자동 포함 (모든 요청에 쿠키 자동 포함)
 * - Zustand store의 access_token을 Authorization 헤더에 자동 추가
 * - 응답에서 access 쿠키를 받으면 store에 저장 후 삭제 (XSS/CSRF 공격 대비)
 * - 401 Unauthorized 시 자동으로 토큰 갱신 시도
 * - body가 있으면 Content-Type: application/json 자동 설정
 */
export const api = async (endpoint: string, options: RequestInit = {}) => {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  
  // body가 있으면 Content-Type 헤더 설정
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Zustand store의 access_token을 Authorization 헤더에 추가
  const accessToken = useAuthStore.getState().access_token;
  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  // 타임아웃 설정 (10초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
      signal: controller.signal,
      credentials: 'include', // ⭐ 쿠키 자동 포함 (필수)
    });
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    if (fetchError.name === 'AbortError') {
      throw new Error('서버 응답 시간이 초과되었습니다.');
    }
    throw fetchError;
  } finally {
    clearTimeout(timeoutId);
  }

  // 401 Unauthorized - 토큰 만료 → 토큰 갱신 시도
  // 명세서 Step 7-2 "Access Token 만료 처리"
  if (response.status === 401 && !endpoint.includes('/oauth/oauth-url')) {
    try {
      // 토큰 갱신 요청 (Authorization 헤더 제외, 쿠키만 사용)
      const refreshHeaders = new Headers();
      refreshHeaders.set('Content-Type', 'application/json');
      
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'GET', // ⭐ 명세서 Step 7-3
        headers: refreshHeaders,
        credentials: 'include', // ⭐ Refresh Token 쿠키 필수
      });

      if (refreshResponse.ok) {
        // 응답 후 쿠키에서 새 access 토큰 읽기 및 저장
        const newAccessToken = getCookie('access');
        if (newAccessToken) {
          // Zustand store에 저장
          useAuthStore.getState().setAccessToken(newAccessToken);
          // 쿠키 삭제 (CSRF/XSS 공격 대비)
          deleteCookie('access');
        }
        
        // 원래 요청 재시도
        const newHeaders = new Headers(options.headers || {});
        if (options.body && !newHeaders.has('Content-Type')) {
          newHeaders.set('Content-Type', 'application/json');
        }
        
        // 새 토큰으로 Authorization 헤더 업데이트
        const freshAccessToken = useAuthStore.getState().access_token;
        if (freshAccessToken && !newHeaders.has('Authorization')) {
          newHeaders.set('Authorization', `Bearer ${freshAccessToken}`);
        }
        
        response = await fetch(fullUrl, {
          ...options,
          headers: newHeaders,
          credentials: 'include',
        });
      } else {
        // 토큰 갱신 실패 - 로그인 페이지로 리다이렉트
        window.location.href = '/';
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      window.location.href = '/';
      throw error;
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
};
