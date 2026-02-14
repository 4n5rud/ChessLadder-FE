// Auth API

import { api } from './apiClient';

/**
 * 사용자 정보 인터페이스
 * /api/auth/me에서 반환되는 사용자 데이터
 */
export interface UserPrincipal {
  id: string;
  username: string; // "1" (Spring Security Principal ID)
  user?: { // 상세 사용자 정보
    id: number;
    lichess_id: string;
    username: string; // 실제 표시될 사용자 이름 (예: "mg0922")
    description: string | null;
    banner_image: string | null;
    profile_image: string | null;
    title: string | null;
    created_at: string;
    lichess_created_at: string;
    last_login_at: string;
    all_games: number;
    rated_games: number;
    wins: number;
    losses: number;
    draws: number;
    total_seconds: number;
  };
  [key: string]: any;
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
    return data.data || data;
  } catch (error) {
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
