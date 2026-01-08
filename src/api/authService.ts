// Auth API

const API_BASE_URL = 'http://localhost:8080/api';

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
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    const data = await response.json();
    
    // 백엔드 응답 형식에 따라 처리
    // { data: UserPrincipal } 또는 { success: true, data: UserPrincipal } 형식 지원
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
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  return response.json();
};

/**
 * 토큰 새로고침
 * POST /api/auth/refresh
 * 백엔드에서 새로운 쿠키 발급
 */
export const refreshToken = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json();
};
