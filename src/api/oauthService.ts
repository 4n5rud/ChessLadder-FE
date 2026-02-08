// OAuth API (Lichess)

import { api } from './apiClient';

/**
 * OAuth 시작 - authorize URL 획득
 * POST /api/oauth/oauth-url
 */
export const getOAuthUrl = async () => {
  return await api('/oauth/oauth-url', { method: 'GET' });
};



/**
 * 로그아웃
 * POST /api/oauth/logout
 */
export const logout = async () => {
  return await api('/oauth/logout', { method: 'POST' });
};
