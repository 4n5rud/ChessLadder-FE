// OAuth URL API
// GET /login/oauth2/lichess/url  → data.oauthUrl
// GET /login/oauth2/chesscom/url → data.oauthUrl

const fetchOAuthUrl = async (path: string) => {
  try {
    const response = await fetch(path, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    const oauth_url = data?.data?.oauthUrl ?? data?.data?.oauth_url ?? data?.oauthUrl ?? data?.oauth_url;

    if (!oauth_url) throw new Error('OAuth URL not found in response');

    return { success: true, oauth_url };
  } catch (error: any) {
    return { success: false, error: error.message, oauth_url: null };
  }
};

/** GET /login/oauth2/lichess/url */
export const getOAuthUrl = () => fetchOAuthUrl('/login/oauth2/lichess/url');

/** GET /login/oauth2/chesscom/url */
export const getChesscomOAuthUrl = () => fetchOAuthUrl('/login/oauth2/chesscom/url');

/** POST /api/auth/logout */
export const logout = async () => {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    return response.ok;
  } catch {
    return false;
  }
};
