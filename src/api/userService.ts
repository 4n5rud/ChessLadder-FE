/**
 * 유저/통계 서비스
 *
 * API 명세 기반:
 *  GET  /api/user/profile
 *  PUT  /api/user/description
 *  GET  /api/stat/streak?platform=&year=
 *  GET  /api/stat/color?platform=&timeClass=
 *  GET  /api/stat/first-move?platform=&timeClass=
 *  GET  /api/stat/perf?platform=&timeClass=
 *  GET  /api/rank/ranking?gameType=&page=
 *  PUT  /api/stat/force-refresh
 *  DELETE /api/user/withdraw
 */
import { api } from './apiClient';
import { useAuthStore } from '../store/authStore';

// ── 인터페이스 ───────────────────────────────────────────────────────────

/** GET /api/user/profile 응답 */
export interface ProfileResponse {
  id: number;
  username: string;
  platform?: 'LICHESS' | 'CHESSCOM';
  description?: string | null;
  // 이미지 (camelCase 명세 + 하위 호환 snake_case alias)
  profileImageUrl?: string | null;
  bannerImageUrl?: string | null;
  profile_image?: string | null;   // alias
  banner_image?: string | null;    // alias
  createdAt?: string | null;
  platformJoinedAt?: string | null;  // 플랫폼 계정 가입일 (스트릭 연도 범위에 사용)
  // lichess 전용 (summary 병합 후 채워짐)
  lichessId?: string;
  title?: string;
  lichessCreatedAt?: string | null;
  lastLoginAt?: string | null;
  totalSeconds?: number;
  // 통계 (summary 병합 후 채워짐)
  allGames: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
}

/** 플랫폼 요약 통계 (perf 전체 집계) */
export interface PlatformSummary {
  allGames: number;
  ratedGames: number;
  wins: number;
  losses: number;
  draws: number;
}

// 하위 호환 타입 alias
export type LichessSummary = PlatformSummary;
export type ChesscomSummary = PlatformSummary;

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

export interface RankingApiResponse {
  users: RankingUserResponse[];
  total_count: number;
  current_page: number;
  page_size?: number;
  total_pages: number;
  is_logged_in_user: boolean;
  platform_mismatch: boolean;
  is_unrated: boolean;
  my_rank: number | null;
  my_rating: number | null;
  my_user_id: number | null;
  my_username?: string | null;
  my_banner?: string | null;
  my_profile?: string | null;
}

export interface DailyStreakDto {
  date: string;
  total: number;
  win: number;
  wins?: number;
  lose: number;
  losses?: number;
  draw: number;
  draws?: number;
  lastRating?: number;
  last_rating?: number;
  rating?: number;
}

export interface UserPerfResponse {
  rating: number;
  gamesPlayed: number;  // API: `games` → 변환
  wins: number;
  losses: number;
  draws: number;
  prov?: boolean;
  all?: number;
  rated?: number;
  tour?: number;
  berserk?: number;
  opAvg?: number;
  seconds?: number;
  disconnects?: number;
  highestRating?: number;
  lowestRating?: number;
  maxStreak?: number;
  maxLossStreak?: number;
  uncertain?: boolean;
}

export interface ColorStatsResponse {
  game_type: string;
  white_wins: number;
  white_draws: number;
  white_losses: number;
  black_wins: number;
  black_draws: number;
  black_losses: number;
}

export interface FirstMoveResponse {
  game_type: string;
  white_moves: { [key: string]: number };
  black_moves: { [key: string]: number };
}

/** 월별 레이팅 데이터 */
export interface MonthlyRatingEntry {
  yearMonth: string;  // "2025-05" 형식
  timeClass: string;  // "blitz", "bullet", "rapid", "classical"
  rating: number;
}

/** GET /api/stat/rating-history 응답 */
export interface RatingHistoryResponse {
  from: string;  // "2025-05"
  to: string;    // "2026-04"
  data: MonthlyRatingEntry[];
}

/** GET /api/user/card 응답 */
export interface UserCardResponse {
  username: string;
  platform: 'LICHESS' | 'CHESSCOM';
  profileImageUrl?: string | null;
  bannerImageUrl?: string | null;
}

// ── 헬퍼 ────────────────────────────────────────────────────────────────

const getPlatform = (): string =>
  useAuthStore.getState().user?.platform ?? 'LICHESS';

// ── 프로필 API ───────────────────────────────────────────────────────────

/**
 * GET /api/user/profile
 * 응답: { id, username, platform, description, profileImageUrl, bannerImageUrl, createdAt }
 */
export const getUserProfile = async (): Promise<ProfileResponse> => {
  const res = await api('/user/profile');
  const d = res.data ?? res;
  // API returns snake_case: profile_image_url, banner_image_url
  const imgUrl = d.profile_image_url ?? d.profileImageUrl ?? d.profile_image ?? d.profileImage ?? null;
  const banUrl = d.banner_image_url ?? d.bannerImageUrl ?? d.banner_image ?? d.bannerImage ?? null;
  return {
    id: d.id ?? d.userId ?? 0,
    username: d.username ?? '',
    platform: d.platform ?? undefined,
    description: d.description ?? null,
    profileImageUrl: imgUrl,
    bannerImageUrl: banUrl,
    profile_image: imgUrl,   // alias for ProfileCard compat
    banner_image: banUrl,    // alias for ProfileCard compat
    createdAt: d.created_at ?? d.createdAt ?? null,
    platformJoinedAt: d.platform_joined_at ?? d.platformJoinedAt ?? null,
    lichessId: d.lichessId ?? d.lichess_id ?? undefined,
    title: d.title ?? undefined,
    // stats — will be merged from summary after this call
    allGames: 0, ratedGames: 0, wins: 0, losses: 0, draws: 0,
  };
};

/**
 * PUT /api/user/description
 * 요청: { description }  응답: { message, data: null }
 */
export const updateUserDescription = async (description: string): Promise<void> => {
  await api('/user/description', {
    method: 'PUT',
    body: JSON.stringify({ description }),
  });
};

// ── 통계 요약 API ────────────────────────────────────────────────────────

/**
 * GET /api/stat/perf?platform=&timeClass= (timeClass 생략 → 전체)
 * 전체 타입을 합산해 플랫폼 요약 통계 반환
 */
export const getPlatformSummary = async (platform?: string): Promise<PlatformSummary> => {
  const plt = platform ?? getPlatform();
  const res = await api(`/stat/perf?platform=${plt}`);
  const items: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  // API returns { time_class, rating, games, wins, losses, draws }
  return items.reduce(
    (acc, i) => ({
      allGames:   acc.allGames   + (Number(i.games)   || 0),
      ratedGames: acc.ratedGames + (Number(i.games)   || 0),
      wins:       acc.wins       + (Number(i.wins)    || 0),
      losses:     acc.losses     + (Number(i.losses)  || 0),
      draws:      acc.draws      + (Number(i.draws)   || 0),
    }),
    { allGames: 0, ratedGames: 0, wins: 0, losses: 0, draws: 0 }
  );
};

// 하위 호환 alias (Profile.tsx 기존 import 유지)
export const getLichessSummary  = getPlatformSummary;
export const getChesscomSummary = getPlatformSummary;

// ── 랭킹 API ─────────────────────────────────────────────────────────────

export const getRanking = async (
  _gameType: string,
  _page = 0,
  _platform: 'LICHESS' | 'CHESSCOM' = 'LICHESS'
): Promise<RankingApiResponse> => {
  const res = await api(`/rank/ranking?gameType=${encodeURIComponent(_gameType)}&page=${_page}&platform=${_platform}`);
  const data: any = res && typeof res === 'object' ? res.data ?? res : res;

  const rankingArray: any[] = data.entries ?? data.ranking ?? data.users ?? data.ranking_users ?? data.rankingList ?? [];

  // 명세서: data.ranking 배열, 각 항목 user_id/banner_image/profile_image
  const rankingList = data.ranking ?? rankingArray ?? [];
  const users: RankingUserResponse[] = rankingList.map((u: any) => ({
    id: u.userId ?? u.id ?? u.user_id ?? 0,
    username: u.username ?? '',
    lichess_id: u.lichess_id ?? u.lichessId ?? null,
    description: u.description ?? null,
    profile_image: u.profileImage ?? u.profileImageUrl ?? u.profile_image ?? null,
    banner_image: u.bannerImage ?? u.bannerImageUrl ?? u.banner_image ?? null,
    rating: Number(u.rating ?? 0) || 0,
    rank: Number(u.rank ?? 0) || 0,
    rated_games: Number(u.rated_games ?? u.ratedGames ?? 0) || 0,
  }));

  // 명세서: my_rank_info.logged_in_user / .rank / .rating / .platform_mismatch
  const myInfo = data.myRankInfo ?? data.my_rank_info ?? null;
  const platformMismatch = Boolean(myInfo?.platformMismatch ?? myInfo?.platform_mismatch ?? false);
  return {
    users,
    total_count: Number(data.totalCount ?? data.total_count ?? 0) || 0,
    current_page: Number(data.currentPage ?? data.current_page ?? 0) || 0,
    page_size: Number(data.pageSize ?? data.page_size ?? 20) || 20,
    total_pages: Number(data.totalPages ?? data.total_pages ?? 0) || 0,
    is_logged_in_user: Boolean(myInfo?.loggedInUser ?? myInfo?.logged_in_user ?? false),
    platform_mismatch: platformMismatch,
    is_unrated: Boolean(data.isUnrated ?? data.is_unrated ?? myInfo?.isUnrated ?? myInfo?.is_unrated ?? false),
    my_rank: myInfo?.rank ?? null,
    my_rating: myInfo?.rating ?? null,
    my_user_id: myInfo?.userId ?? myInfo?.user_id ?? null,
    my_username: myInfo?.username ?? null,
    my_banner: myInfo?.banner ?? null,
    my_profile: myInfo?.profile ?? null,
  };
};

/** GET /api/stat/streak 응답 구조 */
export interface YearlyGameStatResponse {
  year: number;
  days: DailyStreakDto[];
}

export interface StreakResponse {
  currentStreak: number;
  years: YearlyGameStatResponse[];
}

// ── 날짜별 통계 ───────────────────────────────────────────────────────────

/**
 * GET /api/stat/streak?platform=&year=
 * 응답: { current_streak, years: [{ year, days: [{ date, total, wins, draws, losses }] }] }
 * year 생략 시 전체 연도 반환
 */
export const getUserStreak = async (year?: number, platform?: string): Promise<StreakResponse> => {
  try {
    const plt = platform ?? getPlatform();
    const url = year
      ? `/stat/streak?platform=${plt}&year=${year}`
      : `/stat/streak?platform=${plt}`;
    const res = await api(url);
    const data: any = res.data ?? res;

    // 새 응답 포맷: { current_streak: number, years: [{ year, days }] }
    if (data && typeof data === 'object' && 'current_streak' in data && 'years' in data) {
      const years = Array.isArray(data.years) ? data.years : [];

      // year 파라미터가 있으면 해당 연도만 필터링
      const filteredYears = year
        ? years.filter((g: any) => g.year === year)
        : years;

      return {
        currentStreak: Number(data.current_streak ?? 0) || 0,
        years: filteredYears.map((g: any) => ({
          year: g.year,
          days: (Array.isArray(g.days) ? g.days : []).map((d: any) => ({
            date: d.date,
            total: d.total ?? 0,
            win: d.wins ?? d.win ?? 0,
            wins: d.wins ?? d.win ?? 0,
            lose: d.losses ?? d.lose ?? d.loss ?? 0,
            losses: d.losses ?? d.lose ?? d.loss ?? 0,
            draw: d.draws ?? d.draw ?? 0,
            draws: d.draws ?? d.draw ?? 0,
            lastRating: d.last_rating ?? d.lastRating ?? undefined,
            last_rating: d.last_rating ?? d.lastRating ?? undefined,
            rating: d.rating ?? undefined,
          })),
        })),
      };
    }

    // 폴백: 구 배열 포맷 처리
    const raw: any[] = Array.isArray(data) ? data : [];
    const years_fallback: YearlyGameStatResponse[] = [];

    if (raw.length > 0 && raw[0]?.year !== undefined && Array.isArray(raw[0]?.days)) {
      // year별 그룹 포맷
      raw.forEach((g: any) => {
        if (year && g.year !== year) return;
        years_fallback.push({
          year: g.year,
          days: (g.days ?? []).map((d: any) => ({
            date: d.date,
            total: d.total ?? 0,
            win: d.wins ?? d.win ?? 0,
            wins: d.wins ?? d.win ?? 0,
            lose: d.losses ?? d.lose ?? d.loss ?? 0,
            losses: d.losses ?? d.lose ?? d.loss ?? 0,
            draw: d.draws ?? d.draw ?? 0,
            draws: d.draws ?? d.draw ?? 0,
          })),
        });
      });
    }

    return {
      currentStreak: 0,
      years: years_fallback,
    };
  } catch {
    return {
      currentStreak: 0,
      years: [],
    };
  }
};

// ── 퍼포먼스 API ──────────────────────────────────────────────────────────

/**
 * GET /api/stat/perf?platform=&timeClass=
 * 응답: { message, data: [{ time_class, rating, games, wins, losses, draws }] }
 * 특정 타임클래스의 단일 항목을 UserPerfResponse 형태로 반환
 */
export const getUserPerf = async (gameType: string = 'RAPID', signal?: AbortSignal): Promise<UserPerfResponse | null> => {
  const platform = getPlatform();
  const tc = gameType.toLowerCase();
  const res = await api(`/stat/perf?platform=${platform}&timeClass=${tc}`, { signal });
  const items: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];

  // data: [] (빈 배열) → null 반환
  if (items.length === 0) {
    return null;
  }

  // timeClass 매칭 항목 — API는 time_class(snake) 반환
  const item = items.find(i => (i.time_class ?? i.timeClass ?? '').toLowerCase() === tc) ?? items[0] ?? null;

  if (!item) {
    return null;
  }

  return {
    rating: Number(item.rating ?? 0) || 0,
    gamesPlayed: Number(item.games ?? 0) || 0,
    wins: Number(item.wins ?? 0) || 0,
    losses: Number(item.losses ?? 0) || 0,
    draws: Number(item.draws ?? 0) || 0,
    prov: item.prov ?? false,
    uncertain: false,
  };
};

// ── 색깔별 통계 ───────────────────────────────────────────────────────────

/**
 * GET /api/stat/color?platform=&timeClass=
 * 응답: { message, data: [{ time_class, color("WHITE"|"BLACK"), wins, draws, losses }] }
 * timeClass 서버에서 필터링
 */
export const getColorStats = async (gameType: string = 'RAPID', signal?: AbortSignal): Promise<ColorStatsResponse | null> => {
  const platform = getPlatform();
  const tc = gameType.toLowerCase();
  const res = await api(`/stat/color?platform=${platform}&timeClass=${tc}`, { signal });
  const items: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];

  // data: [] (빈 배열) → null 반환
  if (items.length === 0) {
    return null;
  }

  // color 필드는 WHITE / BLACK (대문자)
  const agg = (color: string) =>
    items
      .filter(i => (i.color ?? '').toUpperCase() === color)
      .reduce(
        (acc, i) => ({
          wins: acc.wins + (Number(i.wins) || 0),
          draws: acc.draws + (Number(i.draws) || 0),
          losses: acc.losses + (Number(i.losses) || 0),
        }),
        { wins: 0, draws: 0, losses: 0 }
      );

  const w = agg('WHITE');
  const b = agg('BLACK');

  return {
    game_type: gameType,
    white_wins: w.wins,
    white_draws: w.draws,
    white_losses: w.losses,
    black_wins: b.wins,
    black_draws: b.draws,
    black_losses: b.losses,
  };
};

// ── 첫 수 통계 ────────────────────────────────────────────────────────────

/**
 * GET /api/stat/first-move?platform=&timeClass=
 * 응답: [{ timeClass, color("WHITE"|"BLACK"), move, count }]
 * timeClass 서버에서 필터링
 */
export const getFirstMoveStats = async (gameType: string = 'RAPID', signal?: AbortSignal): Promise<FirstMoveResponse | null> => {
  const platform = getPlatform();
  const tc = gameType.toLowerCase();
  const res = await api(`/stat/first-move?platform=${platform}&timeClass=${tc}`, { signal });
  const items: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];

  // data: [] (빈 배열) → null 반환
  if (items.length === 0) {
    return null;
  }

  // color 필드는 WHITE / BLACK (대문자)
  const toMap = (color: string): { [key: string]: number } =>
    items
      .filter(i => (i.color ?? '').toUpperCase() === color && i.move)
      .reduce((acc, i) => {
        acc[i.move] = (acc[i.move] ?? 0) + (Number(i.count) || 0);
        return acc;
      }, {} as { [key: string]: number });

  return {
    game_type: gameType,
    white_moves: toMap('WHITE'),
    black_moves: toMap('BLACK'),
  };
};

// ── 레이팅 히스토리 ──────────────────────────────────────────────────────────

/**
 * GET /api/stat/rating-history?platform=&timeClass=
 * 응답: { from, to, data: [{ yearMonth, timeClass, rating }] }
 * timeClass 생략 시 전체 타임클래스 반환
 */
export const getRatingHistory = async (timeClass?: string, signal?: AbortSignal): Promise<RatingHistoryResponse> => {
  const platform = getPlatform();
  const url = timeClass
    ? `/stat/rating-history?platform=${platform}&timeClass=${timeClass.toLowerCase()}`
    : `/stat/rating-history?platform=${platform}`;

  try {
    const res = await api(url, { signal });
    const data = res.data ?? res;

    // 응답 구조: { from, to, data: [...] }
    if (data && typeof data === 'object' && 'from' in data && 'to' in data && 'data' in data) {
      return {
        from: data.from,
        to: data.to,
        data: Array.isArray(data.data) ? data.data.map((e: any) => ({
          yearMonth: e.yearMonth ?? e.year_month ?? '',
          timeClass: e.timeClass ?? e.time_class ?? '',
          rating: e.rating ?? 0,
        })) : [],
      };
    }

    return { from: '', to: '', data: [] };
  } catch {
    return { from: '', to: '', data: [] };
  }
};

// ── 기타 ──────────────────────────────────────────────────────────────────

/**
 * GET /api/user/card
 * 응답: { username, platform, profileImageUrl, bannerImageUrl }
 * 프로필 카드 표시용 최소 필드만 반환
 */
export const getUserCard = async (): Promise<UserCardResponse | null> => {
  try {
    const res = await api('/user/card');
    const data = res.data ?? res;

    if (data && typeof data === 'object' && 'username' in data && 'platform' in data) {
      return {
        username: data.username,
        platform: data.platform,
        profileImageUrl: data.profileImageUrl ?? data.profile_image_url ?? null,
        bannerImageUrl: data.bannerImageUrl ?? data.banner_image_url ?? null,
      };
    }

    return null;
  } catch {
    return null;
  }
};

// ── 내 통계 API 명세 alias (getMyXxx) ──────────────────────────────────────
// 명세서: GET /api/stat/perf?platform=&timeClass=

/**
 * GET /api/stat/perf?platform=&timeClass=
 * 명세 alias: getMyPerf
 */
export const getMyPerf = async (
  platform: string,
  timeClass?: string,
): Promise<UserPerfResponse | null> => {
  const tc = timeClass ? timeClass.toLowerCase() : undefined;
  const url = tc
    ? `/stat/perf?platform=${platform}&timeClass=${tc}`
    : `/stat/perf?platform=${platform}`;
  const res = await api(url);
  const items: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  if (items.length === 0) return null;
  const item = tc
    ? (items.find(i => (i.time_class ?? i.timeClass ?? '').toLowerCase() === tc) ?? items[0])
    : items[0];
  if (!item) return null;
  return {
    rating: Number(item.rating ?? 0) || 0,
    gamesPlayed: Number(item.games ?? 0) || 0,
    wins: Number(item.wins ?? 0) || 0,
    losses: Number(item.losses ?? 0) || 0,
    draws: Number(item.draws ?? 0) || 0,
    prov: item.prov ?? false,
    uncertain: false,
  };
};

/**
 * GET /api/stat/streak?platform=&year=
 * 명세 alias: getMyStreak
 */
export const getMyStreak = async (
  platform: string,
  year?: number,
): Promise<StreakResponse> => getUserStreak(year, platform);

/**
 * GET /api/stat/color?platform=&timeClass=
 * 명세 alias: getMyColorStats
 */
export const getMyColorStats = async (
  platform: string,
  timeClass?: string,
): Promise<ColorStatsResponse | null> => {
  const tc = timeClass ? timeClass.toLowerCase() : 'rapid';
  const res = await api(`/stat/color?platform=${platform}&timeClass=${tc}`);
  const items: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  if (items.length === 0) return null;
  const agg = (color: string) =>
    items
      .filter(i => (i.color ?? '').toUpperCase() === color)
      .reduce(
        (acc, i) => ({
          wins: acc.wins + (Number(i.wins) || 0),
          draws: acc.draws + (Number(i.draws) || 0),
          losses: acc.losses + (Number(i.losses) || 0),
        }),
        { wins: 0, draws: 0, losses: 0 },
      );
  const w = agg('WHITE');
  const b = agg('BLACK');
  return {
    game_type: timeClass ?? tc,
    white_wins: w.wins, white_draws: w.draws, white_losses: w.losses,
    black_wins: b.wins, black_draws: b.draws, black_losses: b.losses,
  };
};

/**
 * GET /api/stat/first-move?platform=&timeClass=
 * 명세 alias: getMyFirstMoveStats
 */
export const getMyFirstMoveStats = async (
  platform: string,
  timeClass?: string,
): Promise<FirstMoveResponse | null> => {
  const tc = timeClass ? timeClass.toLowerCase() : 'rapid';
  const res = await api(`/stat/first-move?platform=${platform}&timeClass=${tc}`);
  const items: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  if (items.length === 0) return null;
  const toMap = (color: string): { [key: string]: number } =>
    items
      .filter(i => (i.color ?? '').toUpperCase() === color && i.move)
      .reduce((acc, i) => {
        acc[i.move] = (acc[i.move] ?? 0) + (Number(i.count) || 0);
        return acc;
      }, {} as { [key: string]: number });
  return {
    game_type: timeClass ?? tc,
    white_moves: toMap('WHITE'),
    black_moves: toMap('BLACK'),
  };
};

/**
 * GET /api/stat/rating-history?platform=&timeClass=
 * 명세 alias: getMyRatingHistory
 */
export const getMyRatingHistory = async (
  platform: string,
  timeClass?: string,
): Promise<RatingHistoryResponse> => {
  const url = timeClass
    ? `/stat/rating-history?platform=${platform}&timeClass=${timeClass.toLowerCase()}`
    : `/stat/rating-history?platform=${platform}`;
  try {
    const res = await api(url);
    const data = res.data ?? res;
    if (data && typeof data === 'object' && 'from' in data && 'to' in data && 'data' in data) {
      return { from: data.from, to: data.to, data: Array.isArray(data.data) ? data.data : [] };
    }
    return { from: '', to: '', data: [] };
  } catch {
    return { from: '', to: '', data: [] };
  }
};

// ── 기타 ──────────────────────────────────────────────────────────────────

export const forceRefreshStats = async (): Promise<any> => {
  const res = await api('/stat/force-refresh', { method: 'PUT' });
  return res.data ?? res;
};

export const deleteAccount = async (): Promise<any> => {
  const res = await api('/user', { method: 'DELETE' });
  return res.data ?? res;
};

/** GET /api/user/platform-stats — 플랫폼별 사용자 수 */
export interface PlatformStatsResponse {
  lichessCount: number;
  chesscomCount: number;
  totalCount: number;
}

export const getPlatformStats = async (): Promise<PlatformStatsResponse> => {
  try {
    const res = await api('/user/platform-stats');
    const raw = res.data ?? res;
    const d = raw?.data ?? raw;
    const lichessCount = Number(d.lichessCount ?? d.lichess_count ?? 0);
    const chesscomCount = Number(d.chesscomCount ?? d.chesscom_count ?? 0);
    return {
      lichessCount,
      chesscomCount,
      totalCount: Number(d.totalCount ?? d.total_count ?? (lichessCount + chesscomCount)),
    };
  } catch {
    return { lichessCount: 0, chesscomCount: 0, totalCount: 0 };
  }
};

// ── 타인 프로필 관련 타입 및 API ──────────────────────────────────────────────

/** GET /api/users/{username}/profile?platform= 응답 */
export interface PublicProfileData {
  id: number;
  username: string;
  platform: 'LICHESS' | 'CHESSCOM';
  description?: string | null;
  profileImageUrl?: string | null;
  bannerImageUrl?: string | null;
  createdAt?: string | null;
  platformJoinedAt?: string | null;
  title?: string;
}

/**
 * GET /api/users/{username}/profile?platform=LICHESS
 */
export const getPublicUserProfile = async (
  username: string,
  platform: 'LICHESS' | 'CHESSCOM' = 'LICHESS',
): Promise<PublicProfileData> => {
  const res = await api(`/users/${encodeURIComponent(username)}/profile?platform=${platform}`);
  const d = res.data ?? res;
  const imgUrl = d.profileImageUrl ?? d.profile_image_url ?? d.profile_image ?? null;
  const banUrl = d.bannerImageUrl ?? d.banner_image_url ?? d.banner_image ?? null;
  return {
    id: d.id ?? d.userId ?? 0,
    username: d.username ?? username,
    platform: d.platform ?? platform,
    description: d.description ?? null,
    profileImageUrl: imgUrl,
    bannerImageUrl: banUrl,
    createdAt: d.createdAt ?? d.created_at ?? null,
    platformJoinedAt: d.platformJoinedAt ?? d.platform_joined_at ?? null,
    title: d.title ?? undefined,
  };
};

/**
 * GET /api/users/{username}/stats/perf?platform=&timeClass=
 * 특정 게임 타입의 성능 통계를 반환
 */
export const getPublicUserPerf = async (
  username: string,
  platform: 'LICHESS' | 'CHESSCOM',
  gameType: string = 'RAPID',
  signal?: AbortSignal,
): Promise<UserPerfResponse | null> => {
  const tc = gameType.toLowerCase();
  const res = await api(
    `/users/${encodeURIComponent(username)}/stats/perf?platform=${platform}&timeClass=${tc}`,
    { signal },
  );
  const items: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
  if (items.length === 0) return null;
  const item = items.find(i => (i.time_class ?? i.timeClass ?? '').toLowerCase() === tc) ?? items[0] ?? null;
  if (!item) return null;
  return {
    rating: Number(item.rating ?? 0) || 0,
    gamesPlayed: Number(item.games ?? 0) || 0,
    wins: Number(item.wins ?? 0) || 0,
    losses: Number(item.losses ?? 0) || 0,
    draws: Number(item.draws ?? 0) || 0,
    prov: item.prov ?? false,
    uncertain: false,
  };
};

/**
 * 타인의 전체 게임 타입 성능 통계 (합산용)
 * GET /api/users/{username}/stats/perf?platform=
 */
export const getPublicUserPerfAll = async (
  username: string,
  platform: 'LICHESS' | 'CHESSCOM',
): Promise<Array<{ games: number; wins: number; losses: number; draws: number }>> => {
  try {
    const res = await api(
      `/users/${encodeURIComponent(username)}/stats/perf?platform=${platform}`,
    );
    const items: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    return items.map(i => ({
      games: Number(i.games ?? 0) || 0,
      wins: Number(i.wins ?? 0) || 0,
      losses: Number(i.losses ?? 0) || 0,
      draws: Number(i.draws ?? 0) || 0,
    }));
  } catch {
    return [];
  }
};

/**
 * GET /api/users/{username}/stats/streak?platform=
 */
export const getPublicUserStreak = async (
  username: string,
  platform: 'LICHESS' | 'CHESSCOM',
  year?: number,
): Promise<StreakResponse> => {
  try {
    const url = year
      ? `/users/${encodeURIComponent(username)}/stats/streak?platform=${platform}&year=${year}`
      : `/users/${encodeURIComponent(username)}/stats/streak?platform=${platform}`;
    const res = await api(url);
    const data: any = res.data ?? res;

    if (data && typeof data === 'object' && 'current_streak' in data && 'years' in data) {
      const years = Array.isArray(data.years) ? data.years : [];
      const filteredYears = year ? years.filter((g: any) => g.year === year) : years;
      return {
        currentStreak: Number(data.current_streak ?? 0) || 0,
        years: filteredYears.map((g: any) => ({
          year: g.year,
          days: (Array.isArray(g.days) ? g.days : []).map((d: any) => ({
            date: d.date,
            total: d.total ?? 0,
            win: d.wins ?? d.win ?? 0,
            wins: d.wins ?? d.win ?? 0,
            lose: d.losses ?? d.lose ?? d.loss ?? 0,
            losses: d.losses ?? d.lose ?? d.loss ?? 0,
            draw: d.draws ?? d.draw ?? 0,
            draws: d.draws ?? d.draw ?? 0,
            lastRating: d.last_rating ?? d.lastRating ?? undefined,
            last_rating: d.last_rating ?? d.lastRating ?? undefined,
            rating: d.rating ?? undefined,
          })),
        })),
      };
    }
    return { currentStreak: 0, years: [] };
  } catch {
    return { currentStreak: 0, years: [] };
  }
};

/**
 * GET /api/users/{username}/stats/color?platform=&timeClass=
 */
export const getPublicUserColorStats = async (
  username: string,
  platform: 'LICHESS' | 'CHESSCOM',
  gameType: string = 'RAPID',
  signal?: AbortSignal,
): Promise<ColorStatsResponse | null> => {
  try {
    const tc = gameType.toLowerCase();
    const res = await api(
      `/users/${encodeURIComponent(username)}/stats/color?platform=${platform}&timeClass=${tc}`,
      { signal },
    );
    const items: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    if (items.length === 0) return null;
    const agg = (color: string) =>
      items
        .filter(i => (i.color ?? '').toUpperCase() === color)
        .reduce(
          (acc, i) => ({
            wins: acc.wins + (Number(i.wins) || 0),
            draws: acc.draws + (Number(i.draws) || 0),
            losses: acc.losses + (Number(i.losses) || 0),
          }),
          { wins: 0, draws: 0, losses: 0 },
        );
    const w = agg('WHITE');
    const b = agg('BLACK');
    return {
      game_type: gameType,
      white_wins: w.wins, white_draws: w.draws, white_losses: w.losses,
      black_wins: b.wins, black_draws: b.draws, black_losses: b.losses,
    };
  } catch {
    return null;
  }
};

/**
 * GET /api/users/{username}/stats/first-move?platform=&timeClass=
 */
export const getPublicUserFirstMoveStats = async (
  username: string,
  platform: 'LICHESS' | 'CHESSCOM',
  gameType: string = 'RAPID',
  signal?: AbortSignal,
): Promise<FirstMoveResponse | null> => {
  try {
    const tc = gameType.toLowerCase();
    const res = await api(
      `/users/${encodeURIComponent(username)}/stats/first-move?platform=${platform}&timeClass=${tc}`,
      { signal },
    );
    const items: any[] = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    if (items.length === 0) return null;
    const toMap = (color: string): { [key: string]: number } =>
      items
        .filter(i => (i.color ?? '').toUpperCase() === color && i.move)
        .reduce((acc, i) => {
          acc[i.move] = (acc[i.move] ?? 0) + (Number(i.count) || 0);
          return acc;
        }, {} as { [key: string]: number });
    return {
      game_type: gameType,
      white_moves: toMap('WHITE'),
      black_moves: toMap('BLACK'),
    };
  } catch {
    return null;
  }
};

/**
 * GET /api/users/{username}/stats/rating-history?platform=&timeClass=
 */
export const getPublicUserRatingHistory = async (
  username: string,
  platform: 'LICHESS' | 'CHESSCOM',
  timeClass?: string,
  signal?: AbortSignal,
): Promise<RatingHistoryResponse> => {
  try {
    const url = timeClass
      ? `/users/${encodeURIComponent(username)}/stats/rating-history?platform=${platform}&timeClass=${timeClass.toLowerCase()}`
      : `/users/${encodeURIComponent(username)}/stats/rating-history?platform=${platform}`;
    const res = await api(url, { signal });
    const data = res.data ?? res;
    if (data && typeof data === 'object' && 'from' in data && 'to' in data && 'data' in data) {
      return {
        from: data.from,
        to: data.to,
        data: Array.isArray(data.data) ? data.data.map((e: any) => ({
          yearMonth: e.yearMonth ?? e.year_month ?? '',
          timeClass: e.timeClass ?? e.time_class ?? '',
          rating: e.rating ?? 0,
        })) : [],
      };
    }
    return { from: '', to: '', data: [] };
  } catch {
    return { from: '', to: '', data: [] };
  }
};

// ── 유저 검색 API ──────────────────────────────────────────────────────────────

/** GET /api/users/{username}?platform= 응답 */
export interface UserSearchResult {
  id: number;
  username: string;
  platform: 'LICHESS' | 'CHESSCOM';
  rating: number;
  rank?: number | null;
  description?: string | null;
  profileImageUrl?: string | null;
  bannerImageUrl?: string | null;
}

/**
 * GET /api/users/{username}?platform=LICHESS
 * 타인 검색 → data.users[]
 */
export const searchUsers = async (
  query: string,
  platform: 'LICHESS' | 'CHESSCOM' = 'LICHESS',
): Promise<UserSearchResult[]> => {
  try {
    const res = await api(
      `/users/${encodeURIComponent(query)}?platform=${platform}`,
    );
    const payload = res.data ?? res;
    const users: any[] = Array.isArray(payload.users)
      ? payload.users
      : Array.isArray(payload.data?.users)
        ? payload.data.users
        : Array.isArray(payload)
          ? payload
          : [];
    return users.map(u => ({
      id: u.userId ?? u.id ?? u.user_id ?? 0,
      username: u.username ?? '',
      platform: u.platform ?? platform,
      rating: Number(u.rating ?? 0) || 0,
      rank: u.rank ?? null,
      description: u.description ?? null,
      profileImageUrl: u.profileImageUrl ?? u.profile_image_url ?? u.profileImage ?? u.profile_image ?? null,
      bannerImageUrl: u.bannerImageUrl ?? u.banner_image_url ?? u.bannerImage ?? u.banner_image ?? null,
    }));
  } catch {
    return [];
  }
};

// ── 동기화 상태 API ────────────────────────────────────────────────────────────

export type SyncStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'TOKEN_EXPIRED';

export interface SyncStatusResponse {
  jobId: string | null;
  status: SyncStatus;
  totalFetched: number;
  syncCursor: string | null;
  errorMsg: string | null;
}

/**
 * GET /api/sync/status?platform=LICHESS
 */
export const getSyncStatus = async (
  platform: 'LICHESS' | 'CHESSCOM',
): Promise<SyncStatusResponse> => {
  const res = await api(`/sync/status?platform=${platform}`);
  const d = res.data ?? res;
  return {
    jobId: d.jobId ?? d.job_id ?? null,
    status: d.status ?? 'FAILED',
    totalFetched: Number(d.totalFetched ?? d.total_fetched ?? 0) || 0,
    syncCursor: d.syncCursor ?? d.sync_cursor ?? null,
    errorMsg: d.errorMsg ?? d.error_msg ?? null,
  };
};
