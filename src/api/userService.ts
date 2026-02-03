// 사용자 프로필 API - Swagger 명세 준수
import { api } from './apiClient';

/**
 * 프로필 응답
 */
export interface ProfileResponse {
  // 기본 정보
  id: number;
  username: string;
  lichessId?: string; // Lichess 사용자명
  title?: string; // 사용자 칭호
  description: string;

  // 프로필 이미지
  profileImage?: string;
  bannerImage?: string;

  // 날짜
  createdAt?: string; // ChessMate 가입일 (ISO 8601 형식)
  lichessCreatedAt?: string; // Lichess 가입일 (ISO 8601 형식)

  // 게임 통계 (전체)
  allGames: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
  totalSeconds: number;
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
  lastRating: number; // 해당 날짜의 마지막 레이팅
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
 * 게임 타입별 상세 퍼포먼스 정보
 */
export interface UserPerfResponse {
  // 기본 레이팅 정보
  rating: number;
  gamesPlayed: number;
  prov: boolean;

  // 게임 통계
  all: number;              // 전체 게임 수
  rated: number;            // 레이티드 게임 수
  wins: number;             // 승리 횟수
  losses: number;           // 패배 횟수
  draws: number;            // 무승부 횟수
  tour: number;             // 토너먼트 게임 수
  berserk: number;          // 광폭 모드 사용 수
  opAvg: number;            // 상대방 평균 레이팅
  seconds: number;          // 총 게임 시간 (초)
  disconnects: number;      // 연결 끊김 수

  // 레이팅 관련
  highestRating: number;    // 최고 레이팅
  lowestRating: number;     // 최저 레이팅
  maxStreak: number;        // 최대 연승
  maxLossStreak: number;    // 최대 연패
  uncertain: boolean;       // 티어 불확실성 (rated < 50이면 true)
}

/**
 * GET /api/stat/perf?gameType=RAPID
 * 사용자 게임 타입별 상세 퍼포먼스 정보 조회
 * @param gameType 게임 타입 (RAPID, BLITZ, CLASSICAL, BULLET)
 * @returns Promise<UserPerfResponse>
 */
export const getUserPerf = async (gameType: string = 'RAPID'): Promise<UserPerfResponse> => {
  const res = await api(`/stat/perf?gameType=${gameType}`, { method: 'GET' });
  
  // 백엔드에서 data가 null인 경우 (uncertain 상태) 기본값 반환
  if (res.success && res.data === null) {
    console.warn('⚠️ UserPerf 데이터 없음 - uncertain 상태:', res.message);
    return {
      rating: 0,
      gamesPlayed: 0,
      prov: true,
      all: 0,
      rated: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      tour: 0,
      berserk: 0,
      opAvg: 0,
      seconds: 0,
      disconnects: 0,
      highestRating: 0,
      lowestRating: 0,
      maxStreak: 0,
      maxLossStreak: 0,
      uncertain: true
    };
  }
  
  return res.data;
};

/**
 * 사용자 정보 강제 갱신
 * Lichess 데이터를 다시 동기화하고 티어 정보를 업데이트
 * @returns Promise<any>
 */
export const forceRefreshStats = async (): Promise<any> => {
  const res = await api('/stat/force-refresh', { method: 'PUT' });
  return res.data;
};