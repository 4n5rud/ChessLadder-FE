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
