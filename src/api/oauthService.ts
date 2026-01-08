// OAuth API (Lichess)

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * OAuth 시작 - authorize URL 획득
 * POST /api/oauth/oauth-url
 */
export const getOAuthUrl = async () => {
  const res = await fetch(`${API_BASE_URL}/oauth/oauth-url`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Failed to get OAuth URL');
  return res.json();
};



/**
 * 로그아웃
 * POST /api/oauth/logout
 */
export const logout = async () => {
  const res = await fetch(`${API_BASE_URL}/oauth/logout`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) throw new Error('Logout failed');
  return res.json();
};
