// 사용자 프로필 API - Swagger 명세 준수
import { api } from './apiClient';

/**
 * 프로필 응답
 */
export interface ProfileResponse {
  username: string;
  description: string;
  createdAt?: string; // ChessMate 가입일 (ISO 8601 형식)
  lichessCreatedAt?: string; // Lichess 가입일 (ISO 8601 형식)
  lichessId?: string; // Lichess 사용자명
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
 * 티어 결과 정보
 */
export interface TierResult {
  mainTier: string; // "PAWN", "KNIGHT", "BISHOP", "ROOK", "QUEEN", "KING"
  subTier?: string; // "1", "2", "3", "4", "5"
  rating: number; // 현재 레이팅
}

/**
 * 사용자 티어 Dto
 */
export interface UserTierDto {
  gameType: string;
  rating: number;
  tierResult: TierResult;
}

/**
 * GET /api/stat/tier?gameType=RAPID
 * 사용자 티어 정보 조회
 * @param gameType 게임 타입 (RAPID, BLITZ, CLASSICAL, BULLET)
 * @returns Promise<UserTierDto>
 */
export const getUserTier = async (gameType: string = 'RAPID'): Promise<UserTierDto> => {
  const res = await api(`/stat/tier?gameType=${gameType}`, { method: 'GET' });
  return res.data;
};