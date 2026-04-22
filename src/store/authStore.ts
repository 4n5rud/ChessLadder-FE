import { create } from 'zustand';

export interface User {
  id?: string | number;
  username?: string;
  lichess_id?: string;
  title?: string;
  description?: string | null;
  profile_image?: string | null;
  banner_image?: string | null;
  platform?: string;
  [key: string]: any;
}

const PLATFORM_STORAGE_KEY = 'chessladder_platform';

export interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  getStoredPlatform: () => 'LICHESS' | 'CHESSCOM';
}

export const useAuthStore = create<AuthStore>(() => ({
  user: null,

  setUser: (user: User | null) => {
    if (user?.platform) {
      localStorage.setItem(PLATFORM_STORAGE_KEY, user.platform);
    }
    useAuthStore.setState({ user });
  },

  clearUser: () => {
    useAuthStore.setState({ user: null });
  },

  getStoredPlatform: (): 'LICHESS' | 'CHESSCOM' => {
    const stored = localStorage.getItem(PLATFORM_STORAGE_KEY)
      ?? sessionStorage.getItem('oauth_platform');
    return stored === 'CHESSCOM' ? 'CHESSCOM' : 'LICHESS';
  },
}));
