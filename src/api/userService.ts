// 사용자 프로필 API - 깔끔한 구현
import { api } from './apiClient';

/** 프로필 응답 (필요 시 확장) */
export interface ProfileResponse {
  id: number;
  username: string;
  lichessId?: string;
  title?: string;
  description?: string | null;
  profile_image?: string | null;
  banner_image?: string | null;
  lichessCreatedAt?: string | null;
  createdAt?: string | null;
  allGames: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
}

/** 랭킹 사용자 정보 (프론트엔드에서 사용하는 형태) */
export interface RankingUserResponse {
  id: number;
  username: string;
  lichess_id?: string | null;
  description?: string | null;
  profile_image?: string | null;
  banner_image?: string | null;
  rating: number;
  rank: number;
  rated_games: number;
}

/** 랭킹 API 응답 형태 */
export interface RankingApiResponse {
  users: RankingUserResponse[];
  total_count: number;
  current_page: number;
  page_size?: number;
  total_pages: number;
  is_logged_in_user: boolean;
  is_unrated: boolean;
  my_rank: number | null;
  my_rating: number | null;
  my_user_id: number | null;
  my_username?: string | null;
  my_banner?: string | null;
  my_profile?: string | null;
}

/**
 * 서버에서 랭킹을 가져옵니다.
 * - 가능한 여러 응답 구조를 방어적으로 처리하여 프론트엔드 타입으로 정규화합니다.
 */
export const getRanking = async (
  _gameType: string,
  _page = 0
): Promise<RankingApiResponse> => {
  try {
    const res = await api(`/rank/ranking?gameType=${encodeURIComponent(_gameType)}&page=${_page}`);
    const data: any = res && typeof res === 'object' ? res.data || res : res;

    // 다양한 필드 이름에 대응: ranking | users | ranking_users
    const rankingArray: any[] = data.ranking || data.users || data.ranking_users || data.rankingList || [];

    const users: RankingUserResponse[] = (rankingArray || []).map((u: any) => ({
      id: u.userId ?? u.id ?? u.user_id ?? 0,
      username: u.username ?? u.name ?? '',
      lichess_id: u.lichess_id ?? u.lichessId ?? null,
      description: u.description ?? null,
      profile_image: u.profileImage ?? u.profile ?? u.profile_image ?? null,
      banner_image: u.bannerImage ?? u.banner ?? u.banner_image ?? null,
      rating: Number(u.rating ?? u.rate ?? 0) || 0,
      rank: Number(u.rank ?? u.position ?? 0) || 0,
      rated_games: Number(u.rated_games ?? u.ratedGames ?? 0) || 0,
    }));

    const response: RankingApiResponse = {
      users,
      total_count: Number(data.total_count ?? data.total ?? 0) || 0,
      current_page: Number(data.current_page ?? data.page ?? 0) || 0,
      page_size: data.page_size ? Number(data.page_size) : data.pageSize ? Number(data.pageSize) : undefined,
      total_pages: Number(data.total_pages ?? data.totalPages ?? 0) || 0,
      is_logged_in_user: Boolean(data.my_rank_info?.logged_in_user ?? data.is_logged_in_user ?? data.isLoggedIn ?? false),
      is_unrated: Boolean(data.my_rank_info?.unrated ?? data.is_unrated ?? data.isUnrated ?? false),
      my_rank: data.my_rank_info?.rank ?? data.my_rank ?? data.myRank ?? null,
      my_rating: data.my_rank_info?.rating ?? data.my_rating ?? data.myRating ?? null,
      my_user_id: data.my_rank_info?.user_id ?? data.my_user_id ?? data.myUserId ?? null,
      my_username: data.my_rank_info?.username ?? data.my_username ?? data.myUsername ?? null,
      my_banner: data.my_rank_info?.banner ?? data.my_banner ?? data.myBanner ?? null,
      my_profile: data.my_rank_info?.profile ?? data.my_profile ?? data.myProfile ?? null,
    };

    return response;
  } catch (error) {
    return {
      users: [],
      total_count: 0,
      current_page: 0,
      total_pages: 0,
      is_logged_in_user: false,
      is_unrated: false,
      my_rank: null,
      my_rating: null,
      my_user_id: null,
    };
  }
};

/** 일일 연속 게임 정보 */
export interface DailyStreakDto {
  date: string;
  games?: number;
  game?: number;
  total: number;
  win: number;
  loss?: number;
  lose: number;
  losses?: number;
  draw: number;
  draws?: number;
  lastRating?: number;
  last_rating?: number;
  rating?: number;
}

/** 사용자 게임 타입별 성능 정보 */
export interface UserPerfResponse {
  id?: number;
  name?: string;
  username?: string;
  rating: number;
  ratedGames?: number;
  rated_games?: number;
  rated?: number;
  provisional?: boolean;
  prov?: boolean;
  games?: number;
  all?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  tour?: number;
  berserk?: number;
  opAvg: number;
  seconds: number;
  disconnects?: number;
  highestRating?: number;
  lowestRating?: number;
  maxStreak?: number;
  maxLossStreak?: number;
  uncertain?: boolean;
  gamesPlayed?: number;
}

/**
 * 사용자 프로필을 가져옵니다.
 */
export const getUserProfile = async (): Promise<ProfileResponse> => {
  try {
    const res = await api('/user/profile');
    const data = res.data || res;
    return {
      id: data.id ?? 0,
      username: data.username ?? '',
      lichessId: data.lichessId ?? data.lichess_id ?? '',
      title: data.title ?? undefined,
      description: data.description ?? null,
      profile_image: data.profile_image ?? data.profileImage ?? null,
      banner_image: data.banner_image ?? data.bannerImage ?? null,
      lichessCreatedAt: data.lichessCreatedAt ?? data.lichess_created_at ?? null,
      createdAt: data.createdAt ?? data.created_at ?? null,
      allGames: Number(data.allGames ?? data.all_games ?? 0) || 0,
      ratedGames: Number(data.ratedGames ?? data.rated_games ?? 0) || 0,
      wins: Number(data.wins ?? 0) || 0,
      losses: Number(data.losses ?? data.loss ?? 0) || 0,
      draws: Number(data.draws ?? data.draw ?? 0) || 0,
    };
  } catch (error) {
    console.error('[UserService] getUserProfile error:', error);
    throw error;
  }
};

/**
 * 사용자 설명을 업데이트합니다.
 * 요청: { "description": "..." } (snake_case)
 */
export const updateUserDescription = async (description: string): Promise<ProfileResponse> => {
  try {
    // JSON 형식으로 snake_case 필드명 사용
    const res = await api('/user/description', { 
      method: 'PUT', 
      body: JSON.stringify({ description })
    });
    const data = res.data || res;
    return {
      id: data.id ?? 0,
      username: data.username ?? '',
      lichessId: data.lichessId ?? data.lichess_id ?? '',
      title: data.title ?? undefined,
      description: data.description ?? null,
      profile_image: data.profile_image ?? data.profileImage ?? null,
      banner_image: data.banner_image ?? data.bannerImage ?? null,
      lichessCreatedAt: data.lichessCreatedAt ?? data.lichess_created_at ?? null,
      createdAt: data.createdAt ?? data.created_at ?? null,
      allGames: Number(data.allGames ?? data.all_games ?? 0) || 0,
      ratedGames: Number(data.ratedGames ?? data.rated_games ?? 0) || 0,
      wins: Number(data.wins ?? 0) || 0,
      losses: Number(data.losses ?? data.loss ?? 0) || 0,
      draws: Number(data.draws ?? data.draw ?? 0) || 0,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * 사용자 게임 타입별 성능 정보를 가져옵니다.
 */
export const getUserPerf = async (gameType: string = 'RAPID'): Promise<UserPerfResponse> => {
  try {
    const res = await api(`/stat/perf?gameType=${encodeURIComponent(gameType)}`);
    const data = res.data || res;
    return {
      id: data.id,
      name: data.name,
      username: data.username,
      rating: Number(data.rating ?? 0) || 0,
      ratedGames: Number(data.ratedGames ?? data.rated_games ?? data.rated ?? 0) || 0,
      rated_games: Number(data.ratedGames ?? data.rated_games ?? data.rated ?? 0) || 0,
      rated: Number(data.rated ?? data.ratedGames ?? data.rated_games ?? 0) || 0,
      provisional: Boolean(data.provisional ?? data.prov),
      prov: Boolean(data.provisional ?? data.prov),
      games: Number(data.games ?? data.all ?? 0) || 0,
      all: Number(data.all ?? data.games ?? 0) || 0,
      wins: Number(data.wins ?? 0) || 0,
      losses: Number(data.losses ?? 0) || 0,
      draws: Number(data.draws ?? 0) || 0,
      tour: Number(data.tour ?? 0) || 0,
      berserk: Number(data.berserk ?? 0) || 0,
      opAvg: Number(data.opAvg ?? 0) || 0,
      seconds: Number(data.seconds ?? 0) || 0,
      disconnects: Number(data.disconnects ?? 0) || 0,
      highestRating: Number(data.highestRating ?? data.highest ?? 0) || 0,
      lowestRating: Number(data.lowestRating ?? data.lowest ?? 0) || 0,
      maxStreak: Number(data.maxStreak ?? 0) || 0,
      maxLossStreak: Number(data.maxLossStreak ?? 0) || 0,
      uncertain: Boolean(data.uncertain),
      gamesPlayed: Number(data.gamesPlayed ?? data.all ?? data.games ?? 0) || 0,
    };
  } catch (error) {
    console.error('[UserService] getUserPerf error:', error);
    throw error;
  }
};

/**
 * 사용자의 일일 연속 게임 정보를 가져옵니다.
 */
export const getUserStreak = async (year?: number): Promise<any> => {
  try {
    const targetYear = year || new Date().getFullYear();
    const url = `/stat/streak?year=${targetYear}`;
    const res = await api(url);
    const data = res.data || res;
    return data;
  } catch (error) {
    return { daily_streak_dto: [] };
  }
};

export const forceRefreshStats = async (): Promise<any> => {
  const res = await api('/stat/force-refresh', { method: 'PUT' });
  return res.data || res;
};
