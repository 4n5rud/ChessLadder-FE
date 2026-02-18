import { create } from 'zustand';

/**
 * 인증(Auth) 상태 관리 스토어
 * 사용자 정보와 토큰을 메모리에서 관리
 */

export interface User {
  id?: string | number;
  username?: string;
  lichess_id?: string;
  title?: string;
  description?: string | null;
  profile_image?: string | null;
  banner_image?: string | null;
  [key: string]: any;
}

export interface AuthStore {
  user: User | null;
  access_token: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  clearUser: () => void;
}

/**
 * 전역 인증 스토어
 */
export const useAuthStore = create<AuthStore>((set: any) => ({
  user: null,
  access_token: null,

  setUser: (user: User | null) => {
    set({ user });
  },

  setAccessToken: (token: string | null) => {
    set({ access_token: token });
  },

  clearUser: () => {
    set({ user: null, access_token: null });
  },
}));
