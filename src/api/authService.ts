// Auth API

import { api } from './apiClient';

/**
 * 사용자 정보 인터페이스
 * /api/auth/me에서 반환되는 사용자 데이터
 */
export interface UserPrincipal {
  id: string;
  username: string;
  email?: string;
  profileImage?: string;
  [key: string]: any; // 추가 필드 호환성
}

/**
 * API 응답 형식
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  [key: string]: any;
}

/**
 * 현재 사용자 정보 조회
 * GET /api/auth/me
 * 쿠키 기반 인증 (credentials: include)
 */
export const getCurrentUser = async (): Promise<UserPrincipal | null> => {
  try {
    const data = await api('/auth/me');
    // 백엔드 응답 형식에 따라 처리
    // { data: UserPrincipal } 또는 { success: true, data: UserPrincipal } 형식 지원
    console.log('[AuthService] getCurrentUser response:', data);
    return data.data || data;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * 로그인 여부 확인
 */
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    return user !== null && user.id !== undefined;
  } catch {
    return false;
  }
};

/**
 * 로그아웃
 * POST /api/auth/logout
 * 백엔드에서 쿠키 만료 처리
 */
export const logout = async () => {
  return await api('/auth/logout', { method: 'POST' });
};

/**
 * 토큰 새로고침
 * POST /api/auth/refresh
 * 백엔드에서 새로운 쿠키 발급
 */
export const refreshToken = async () => {
  return await api('/auth/refresh', { method: 'POST' });
};
