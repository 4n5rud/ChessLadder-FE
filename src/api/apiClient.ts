// API Client

// 개발 환경에서는 localhost:8080, 프로덕션에서는 Vercel 환경변수 사용
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8080/api' 
  : (import.meta.env.VITE_API_BASE_URL || '/api');

/**
 * 기본 API 호출
 * credentials: 'include' 자동 포함 (쿠키 기반 인증)
 * 401 에러 시 자동으로 토큰 갱신 시도
 * body가 있으면 자동으로 Content-Type: application/json 설정
 */
export const api = async (endpoint: string, options: RequestInit = {}) => {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  
  // 로깅
  console.log(`[API] ${options.method || 'GET'} ${fullUrl}`);
  
  // body가 있으면 Content-Type 헤더 설정
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
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
      credentials: 'include',
    });
    console.log(`[API] 응답: ${options.method || 'GET'} ${fullUrl} - Status: ${response.status}`);
  } catch (fetchError: any) {
    clearTimeout(timeoutId);
    console.error(`[API] 오류: ${options.method || 'GET'} ${fullUrl}`, fetchError);
    if (fetchError.name === 'AbortError') {
      throw new Error('서버 응답 시간이 초과되었습니다. 서버 상태를 확인해주세요.');
    }
    throw fetchError;
  } finally {
    clearTimeout(timeoutId);
  }

  // 401 Unauthorized - 토큰 만료 → 토큰 갱신 시도
  // 단, 로그인 관련 API(/oauth/oauth-url, /auth/me 등)는 무한 루프 방지를 위해 생략 가능
  if (response.status === 401 && !endpoint.includes('/oauth/oauth-url')) {
    try {
      const refreshUrl = `${API_BASE_URL}/auth/refresh`;
      console.log('[API] 토큰 갱신 시도:', refreshUrl);
      
      const refreshResponse = await fetch(refreshUrl, {
        method: 'POST',
        credentials: 'include', // refresh token 쿠키 포함
      });

      if (refreshResponse.ok) {
        // 토큰 갱신 성공 - 원래 요청 재시도
        console.log('[API] 토큰 갱신 성공, 원래 요청 재시도');
        response = await fetch(fullUrl, {
          ...options,
          headers,
          credentials: 'include',
        });
      } else {
        // 토큰 갱신 실패 - 로그인 페이지로 이동
        console.error('[API] 토큰 갱신 실패');
        window.location.href = '/login';
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('[API] 토큰 갱신 예외', error);
      window.location.href = '/login';
      throw error;
    }
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[API] ❌ 오류 응답: ${response.status} ${response.statusText}`, {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl,
      errorBody: errorText
    });
    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    console.error(`[API] JSON 파싱 실패:`, {
      url: fullUrl,
      method: options.method || 'GET',
      error: parseError
    });
    throw new Error(`Failed to parse JSON response from ${fullUrl}`);
  }
  
  console.log(`[API] ✅ 응답 데이터: ${options.method || 'GET'} ${fullUrl}`, data);
  return data;
};
