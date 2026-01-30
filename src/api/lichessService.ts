/**
 * Lichess API 통합 서비스
 * Lichess 공개 API와 통신하여 사용자 정보 및 통계를 조회합니다.
 */

/**
 * 레이팅 히스토리 항목
 */
export interface RatingHistoryEntry {
  year: number;
  month: number;
  day: number;
  rating: number;
}

/**
 * GET https://lichess.org/api/user/{username}/rating-history
 * 사용자의 레이팅 히스토리 조회
 * @param username Lichess 사용자명
 * @param gameType 게임 타입 (RAPID, BLITZ, CLASSICAL, BULLET)
 * @returns Promise<RatingHistoryEntry[]>
 */
export const getRatingHistory = async (username: string, gameType: string = 'RAPID'): Promise<RatingHistoryEntry[]> => {
  try {
    const response = await fetch(`https://lichess.org/api/user/${username}/rating-history`);

    if (!response.ok) {
      throw new Error(`Failed to fetch rating history: ${response.statusText}`);
    }

    // JSON 배열 형식의 응답 처리
    const data = await response.json();
    const ratingHistory: RatingHistoryEntry[] = [];

    // 게임 타입 매핑 (대문자 형식 → Lichess API 형식)
    const gameTypeMap: { [key: string]: string } = {
      'RAPID': 'Rapid',
      'BLITZ': 'Blitz',
      'CLASSICAL': 'Classical',
      'BULLET': 'Bullet'
    };

    const lichessGameType = gameTypeMap[gameType] || 'Rapid';

    // 해당 게임 타입의 데이터 찾기
    const gameTypeData = data.find((item: any) => item.name === lichessGameType);

    if (gameTypeData && Array.isArray(gameTypeData.points)) {
      for (const [year, month, day, rating] of gameTypeData.points) {
        ratingHistory.push({
          year,
          month: month + 1, // 0-indexed 월을 1-indexed로 변환
          day,
          rating
        });
      }
    }

    return ratingHistory;
  } catch (error) {
    console.error('Error fetching rating history:', error);
    throw error;
  }
};

/**
 * GET https://lichess.org/api/user/{username}
 * 사용자의 기본 정보 조회
 * @param username Lichess 사용자명
 * @returns Promise<any>
 */
export const getUserInfo = async (username: string): Promise<any> => {
  try {
    const response = await fetch(`https://lichess.org/api/user/${username}`, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
};
