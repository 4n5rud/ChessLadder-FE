// OAuth API (Lichess)
// 명세서 Step 2: OAuth URL 요청

/**
 * OAuth URL 요청
 * GET /api/oauth/oauth-url
 * 응답: { code: 200, message: "OauthUrl 제공", data: { oauthUrl: "https://lichess.org/oauth?..." } }
 */
export const getOAuthUrl = async () => {
  try {
    const API_BASE_URL = import.meta.env.DEV 
      ? 'http://localhost:8080/api' 
      : (import.meta.env.VITE_API_BASE_URL || '/api');

    const response = await fetch(`${API_BASE_URL}/oauth/oauth-url`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // 명세서 형식: { code: 200, message: "...", data: { oauth_url: "..." } }
    // 백엔드가 snake_case로 보냄: oauth_url
    const oauth_url = data?.data?.oauth_url || data?.oauth_url;

    if (!oauth_url) {
      throw new Error('OAuth URL not found in response');
    }

    return { 
      success: true, 
      oauth_url,
      data: data.data,
    };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message,
      oauthUrl: null,
    };
  }
};



export const getChesscomOAuthUrl = async () => {
  try {
    const API_BASE_URL = import.meta.env.DEV
      ? 'http://localhost:8080/api'
      : (import.meta.env.VITE_API_BASE_URL || '/api');

    const response = await fetch(`${API_BASE_URL}/oauth/chesscom/oauth-url`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const oauth_url = data?.data?.oauth_url || data?.oauth_url;

    if (!oauth_url) {
      throw new Error('OAuth URL not found in response');
    }

    return {
      success: true,
      oauth_url,
      data: data.data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      oauthUrl: null,
    };
  }
};


/**
 * 로그아웃
 * POST /api/oauth/logout
 */
export const logout = async () => {
  try {
    const API_BASE_URL = import.meta.env.DEV 
      ? 'http://localhost:8080/api' 
      : (import.meta.env.VITE_API_BASE_URL || '/api');

    const response = await fetch(`${API_BASE_URL}/oauth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    return false;
  }
};
