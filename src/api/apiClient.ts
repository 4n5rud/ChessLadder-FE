// API Client

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * 기본 API 호출
 * credentials: 'include' 자동 포함 (쿠키 기반 인증)
 * 401 에러 시 자동으로 토큰 갱신 시도
 */
export const api = async (endpoint: string, options: RequestInit = {}) => {
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // 쿠키 포함 (필수)
  });

  // 401 Unauthorized - 토큰 만료 → 토큰 갱신 시도
  if (response.status === 401) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // refresh token 쿠키 포함
      });

      if (refreshResponse.ok) {
        // 토큰 갱신 성공 - 원래 요청 재시도
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          credentials: 'include',
        });
      } else {
        // 토큰 갱신 실패 - 로그인 페이지로 이동
        window.location.href = '/login';
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      window.location.href = '/login';
      throw error;
    }
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
};
