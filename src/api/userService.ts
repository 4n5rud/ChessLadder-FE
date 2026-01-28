// 사용자 프로필 API - Swagger 명세 준수
import { api } from './apiClient';

/**
 * 프로필 응답
 */
export interface ProfileResponse {
  username: string;
  description: string;
  joinDate?: string; // 가입일 (첫 가입일)
}

/**
 * 일일 스트릭 정보
 */
export interface DailyStreakDto {
  date: string; // YYYY-MM-DD
  win: number;
  lose: number;
  draw: number;
  total: number;
}

/**
 * 스트릭 응답
 */
export interface StreakResponse {
  year: string;
  dailyStreakDto: DailyStreakDto[];
}

/**
 * GET /api/user/profile
 * 사용자 프로필 정보 조회 (username, description, joinDate)
 * @returns Promise<ProfileResponse>
 */
export const getUserProfile = async (): Promise<ProfileResponse> => {
  const res = await api('/user/profile', { method: 'GET' });
  return res.data;
};

/**
 * PUT /api/user/description
 * 사용자 자기소개 수정
 * @param description 자기소개 텍스트
 * @returns Promise<void>
 */
export const updateUserDescription = async (description: string): Promise<void> => {
  await api('/user/description', {
    method: 'PUT',
    body: JSON.stringify({ description }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

/**
 * GET /api/stat/streak?year=YYYY
 * 사용자 연간 스트릭 조회
 * @param year 조회할 년도 (예: 2026)
 * @returns Promise<StreakResponse>
 */
export const getUserStreak = async (year: number): Promise<StreakResponse> => {
  const res = await api(`/stat/streak?year=${year}`, { method: 'GET' });
  return res.data;
};
/**
 * 색상별 승률 통계
 */
export interface ColorStats {
  color: string; // "BLACK" 또는 "WHITE"
  winRate: number; // 승률 (퍼센트)
  totalGames: number;
  wins: number;
}

/**
 * 색상별 승률 통계 응답
 */
export interface ColorStatsResponse {
  gameType: string;
  colorStats: ColorStats[];
}

/**
 * GET /api/stat/color?gameType=RAPID
 * 색상별(흑/백) 승률 통계 조회
 * @param gameType 게임 타입 (RAPID, BLITZ, CLASSICAL, BULLET)
 * @returns Promise<ColorStatsResponse>
 */
export const getColorStats = async (gameType: string = 'RAPID'): Promise<ColorStatsResponse> => {
  const res = await api(`/stat/color?gameType=${gameType}`, { method: 'GET' });
  return res.data;
};

/**
 * 첫 무브 통계
 */
export interface FirstMoveStats {
  move: string; // "e4", "d4" 등
  frequency: number; // 빈도 (퍼센트)
  totalGames: number;
  count: number;
}

/**
 * 첫 무브 통계 응답
 */
export interface FirstMoveResponse {
  gameType: string;
  firstMoveStats: FirstMoveStats[];
}

/**
 * GET /api/stat/first-move?gameType=RAPID
 * 첫 무브 통계 조회
 * @param gameType 게임 타입 (RAPID, BLITZ, CLASSICAL, BULLET)
 * @returns Promise<FirstMoveResponse>
 */
export const getFirstMoveStats = async (gameType: string = 'RAPID'): Promise<FirstMoveResponse> => {
  const res = await api(`/stat/first-move?gameType=${gameType}`, { method: 'GET' });
  return res.data;
};

/**
 * 티어 정보
 */
export interface TierInfo {
  tier: string; // "Bronze", "Silver", "Gold" 등
  rating: number; // 현재 레이팅
  nextTierRating: number; // 다음 티어까지의 레이팅
}

/**
 * 티어 통계 응답
 */
export interface TierResponse {
  gameType: string;
  tierInfo: TierInfo;
}

/**
 * GET /api/stat/tier?gameType=RAPID
 * 티어 통계 조회
 * @param gameType 게임 타입 (RAPID, BLITZ, CLASSICAL, BULLET)
 * @returns Promise<TierResponse>
 */
export const getTierStats = async (gameType: string = 'RAPID'): Promise<TierResponse> => {
  const res = await api(`/stat/tier?gameType=${gameType}`, { method: 'GET' });
  return res.data;
};