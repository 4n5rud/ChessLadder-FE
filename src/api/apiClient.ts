// API Client

// 개발 환경에서는 localhost:8080, 프로덕션에서는 Vercel 환경변수 사용
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8080/api' 
  : (import.meta.env.VITE_API_BASE_URL || '/api');

// 초기화 로그 - 모든 환경변수 출력
console.log('='.repeat(60));
console.log('[API Init] Environment Variables:');
console.log('  Mode:', import.meta.env.MODE);
console.log('  DEV:', import.meta.env.DEV);
console.log('  PROD:', import.meta.env.PROD);
console.log('  VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
console.log('  Final API_BASE_URL:', API_BASE_URL);
console.log('='.repeat(60));

/**
 * 기본 API 호출
 * credentials: 'include' 자동 포함 (쿠키 기반 인증)
 * 401 에러 시 자동으로 토큰 갱신 시도
 */
export const api = async (endpoint: string, options: RequestInit = {}) => {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`[API Request] ${options.method || 'GET'} ${fullUrl}`, {
    method: options.method || 'GET',
    url: fullUrl,
    body: options.body,
    timestamp: new Date().toISOString(),
  });

  let response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      credentials: 'include', // 쿠키 포함 (필수)
    });
  } catch (fetchError) {
    console.error(`[API Fetch Error] ${fullUrl}`, {
      errorType: fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError,
      errorMessage: fetchError instanceof Error ? fetchError.message : String(fetchError),
      timestamp: new Date().toISOString(),
    });
    throw fetchError;
  }

  console.log(`[API Response] ${fullUrl}`, {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    timestamp: new Date().toISOString(),
  });

  // 401 Unauthorized - 토큰 만료 → 토큰 갱신 시도
  if (response.status === 401) {
    console.warn(`[API] Token expired (401) - attempting refresh for ${endpoint}`);
    try {
      const refreshUrl = `${API_BASE_URL}/auth/refresh`;
      console.log(`[API Request] POST ${refreshUrl} (token refresh)`);
      
      const refreshResponse = await fetch(refreshUrl, {
        method: 'POST',
        credentials: 'include', // refresh token 쿠키 포함
      });

      console.log(`[API Response] ${refreshUrl} - status: ${refreshResponse.status}`);

      if (refreshResponse.ok) {
        // 토큰 갱신 성공 - 원래 요청 재시도
        console.log(`[API] Token refreshed - retrying original request: ${fullUrl}`);
        response = await fetch(fullUrl, {
          ...options,
          credentials: 'include',
        });
        console.log(`[API Response] ${fullUrl} (retry)`, {
          status: response.status,
          statusText: response.statusText,
        });
      } else {
        // 토큰 갱신 실패 - 로그인 페이지로 이동
        console.error(`[API] Token refresh failed - redirecting to login`);
        window.location.href = '/login';
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error(`[API] Error during token refresh:`, error);
      window.location.href = '/login';
      throw error;
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API Error] ${fullUrl}`, {
      status: response.status,
      statusText: response.statusText,
      responseBody: errorText,
    });
    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`[API Data] ${fullUrl}`, data);
  return data;
};
