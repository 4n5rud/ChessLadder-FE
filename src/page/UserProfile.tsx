import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../global/Header';
import Footer from '../global/Footer';
import { useLanguage } from '../context/LanguageContext';
import { TierSection } from '../components/TierSection';
import { GameTypeButtons } from '../components/GameTypeButtons';
import MonthlyRatingHistoryChart from '../components/MonthlyRatingHistoryChart';
import ColorStatsChart from '../components/ColorStatsChart';
import FirstMoveStatsChart from '../components/FirstMoveStatsChart';
import GameStatsDisplay from '../components/GameStatsDisplay';
import {
  getPublicUserProfile,
  getPublicUserPerfAll,
  getPublicUserPerf,
  getPublicUserStreak,
  getPublicUserColorStats,
  getPublicUserFirstMoveStats,
  getPublicUserRatingHistory,
} from '../api/userService';
import type {
  ProfileResponse,
  UserPerfResponse,
  ColorStatsResponse,
  FirstMoveResponse,
  RatingHistoryResponse,
  DailyStreakDto,
  PublicProfileData,
} from '../api/userService';
import lichessLogoImg from '../assets/images/logo/lichess-logo.png';
import chesscomLogoImg from '../assets/images/logo/chesscom-logo.png';
import pawnImg   from '../assets/images/tier/pawn.png';
import knightImg from '../assets/images/tier/knight.png';
import bishopImg from '../assets/images/tier/vishop.png';
import rookImg   from '../assets/images/tier/rook.png';
import queenImg  from '../assets/images/tier/queen.png';
import kingImg   from '../assets/images/tier/king.png';
import './Profile.css';

// ── 공유 상수 ─────────────────────────────────────────────────────────────────

const TIER_COLOR_SCHEME: Record<string, {
  mainColor: string; lightBg: string; darkBg: string;
  borderColor: string; lightText: string; darkText: string;
}> = {
  PAWN:   { mainColor: 'rgba(34,197,94,1)',   lightBg: 'rgba(34,197,94,0.06)',   darkBg: 'rgba(34,197,94,0.10)',   borderColor: 'rgba(34,197,94,0.20)',   lightText: 'rgba(80,220,140,0.65)',  darkText: 'rgba(120,255,170,1)'   },
  KNIGHT: { mainColor: 'rgba(59,130,246,1)',   lightBg: 'rgba(59,130,246,0.06)',  darkBg: 'rgba(59,130,246,0.10)',  borderColor: 'rgba(59,130,246,0.20)',  lightText: 'rgba(100,160,255,0.65)', darkText: 'rgba(150,190,255,1)'   },
  BISHOP: { mainColor: 'rgba(168,85,247,1)',   lightBg: 'rgba(168,85,247,0.06)',  darkBg: 'rgba(168,85,247,0.10)',  borderColor: 'rgba(168,85,247,0.20)',  lightText: 'rgba(190,130,255,0.65)', darkText: 'rgba(220,170,255,1)'   },
  ROOK:   { mainColor: 'rgba(239,68,68,1)',    lightBg: 'rgba(239,68,68,0.06)',   darkBg: 'rgba(239,68,68,0.10)',   borderColor: 'rgba(239,68,68,0.20)',   lightText: 'rgba(255,120,120,0.65)', darkText: 'rgba(255,170,170,1)'   },
  QUEEN:  { mainColor: 'rgba(255,140,0,1)',    lightBg: 'rgba(255,140,0,0.06)',   darkBg: 'rgba(255,140,0,0.10)',   borderColor: 'rgba(255,140,0,0.20)',   lightText: 'rgba(255,170,80,0.65)',  darkText: 'rgba(255,190,120,1)'  },
  KING:   { mainColor: 'rgba(255,215,0,1)',    lightBg: 'rgba(255,215,0,0.06)',   darkBg: 'rgba(255,215,0,0.10)',   borderColor: 'rgba(255,215,0,0.20)',   lightText: 'rgba(255,230,100,0.65)', darkText: 'rgba(255,245,150,1)'  },
};

const PROMOTION_THRESHOLDS: { [key: string]: number } = {
  PAWN: 400, KNIGHT: 901, BISHOP: 1201, ROOK: 1501, QUEEN: 1801, KING: 2101,
};

const convertSubTierToRoman = (subTier: string): string =>
  ({ '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V' }[subTier] ?? subTier);

const getTierFromRating = (rating: number): string => {
  const tiers = Object.entries(PROMOTION_THRESHOLDS).sort(([, a], [, b]) => b - a);
  for (const [tier, min] of tiers) {
    if (rating >= min) return tier;
  }
  return 'PAWN';
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const platform = (searchParams.get('platform') ?? 'LICHESS').toUpperCase() as 'LICHESS' | 'CHESSCOM';
  const navigate = useNavigate();

  const { t, language } = useLanguage();
  const isKR = language === 'KR';

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileResponse | null>(null);
  const [summaryLoaded, setSummaryLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [userPerf, setUserPerf] = useState<UserPerfResponse | null>(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  const [colorStats, setColorStats] = useState<ColorStatsResponse | null>(null);
  const [loadingColorStats, setLoadingColorStats] = useState(false);

  const [firstMoveStats, setFirstMoveStats] = useState<FirstMoveResponse | null>(null);
  const [loadingFirstMoveStats, setLoadingFirstMoveStats] = useState(false);

  const [ratingHistoryResponse, setRatingHistoryResponse] = useState<RatingHistoryResponse | null>(null);
  const [loadingRatingHistory, setLoadingRatingHistory] = useState(false);

  const [streakMap, setStreakMap] = useState<Map<string, DailyStreakDto>>(new Map());
  const [streakLoaded, setStreakLoaded] = useState(false);
  const [currentStreakDays, setCurrentStreakDays] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const [selectedGameType, setSelectedGameType] = useState('RAPID');
  const gameTypes = ['BULLET', 'BLITZ', 'RAPID', 'CLASSICAL'];
  const gameTypeDisplayNames: { [key: string]: string } = {
    BULLET: 'Bullet', BLITZ: 'Blitz', RAPID: 'Rapid', CLASSICAL: 'Classical',
  };

  // ── 프로필 + 요약 통계 로드 ────────────────────────────────────────────────
  useEffect(() => {
    if (!username) return;
    setLoadingProfile(true);
    setNotFound(false);

    const load = async () => {
      try {
        const [data, allPerfItems] = await Promise.all([
          getPublicUserProfile(username, platform),
          getPublicUserPerfAll(username, platform),
        ]);

        setProfile(data);

        const agg = allPerfItems.reduce(
          (acc, i) => ({
            allGames:   acc.allGames   + (Number(i.games)   || 0),
            ratedGames: acc.ratedGames + (Number(i.games)   || 0),
            wins:       acc.wins       + (Number(i.wins)    || 0),
            losses:     acc.losses     + (Number(i.losses)  || 0),
            draws:      acc.draws      + (Number(i.draws)   || 0),
          }),
          { allGames: 0, ratedGames: 0, wins: 0, losses: 0, draws: 0 },
        );

        setProfileStats({
          id: data.id,
          username: data.username,
          platform: data.platform,
          description: data.description,
          profileImageUrl: data.profileImageUrl,
          bannerImageUrl: data.bannerImageUrl,
          profile_image: data.profileImageUrl,
          banner_image: data.bannerImageUrl,
          createdAt: data.createdAt,
          platformJoinedAt: data.platformJoinedAt,
          ...agg,
        });
        setSummaryLoaded(true);

        const currentYear = new Date().getFullYear();
        const startYear = data.platformJoinedAt
          ? new Date(data.platformJoinedAt).getFullYear()
          : currentYear - 2;
        const years: number[] = [];
        for (let y = startYear; y <= currentYear; y++) years.push(y);
        setAvailableYears(years);
      } catch (err: any) {
        if (err?.message?.includes('404') || err?.message?.includes('404')) {
          setNotFound(true);
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    load();
  }, [username, platform]);

  // ── 게임 타입별 데이터 로드 ───────────────────────────────────────────────
  useEffect(() => {
    if (!profile || !username) return;

    const load = async () => {
      setLoadingPerf(true);
      setLoadingColorStats(true);
      setLoadingFirstMoveStats(true);
      setLoadingRatingHistory(true);
      try {
        const [perf, color, firstMove, ratingHist] = await Promise.all([
          getPublicUserPerf(username, platform, selectedGameType),
          getPublicUserColorStats(username, platform, selectedGameType),
          getPublicUserFirstMoveStats(username, platform, selectedGameType),
          getPublicUserRatingHistory(username, platform, selectedGameType),
        ]);
        setUserPerf(perf);
        setColorStats(color);
        setFirstMoveStats(firstMove);
        setRatingHistoryResponse(
          ratingHist && ratingHist.data.length > 0 ? ratingHist : null,
        );
      } catch {
        setUserPerf(null);
        setColorStats(null);
        setFirstMoveStats(null);
        setRatingHistoryResponse(null);
      } finally {
        setLoadingPerf(false);
        setLoadingColorStats(false);
        setLoadingFirstMoveStats(false);
        setLoadingRatingHistory(false);
      }
    };

    load();
  }, [selectedGameType, profile, username, platform]);

  // ── 스트릭 데이터 로드 ────────────────────────────────────────────────────
  useEffect(() => {
    if (!profile || !username) return;
    setStreakLoaded(false);

    const load = async () => {
      try {
        const streakData = await getPublicUserStreak(username, platform, selectedYear);
        const selectedYearData = streakData.years?.find(y => y.year === selectedYear);
        const days = selectedYearData?.days ?? [];
        const map = new Map<string, DailyStreakDto>();
        if (Array.isArray(days)) {
          days.forEach((daily: DailyStreakDto) => map.set(daily.date, daily));
        }
        setStreakMap(map);
        setCurrentStreakDays(streakData.currentStreak ?? 0);
      } catch {
        setStreakMap(new Map());
      } finally {
        setStreakLoaded(true);
      }
    };

    load();
  }, [selectedYear, profile, username, platform]);

  // ── 404 표시 ──────────────────────────────────────────────────────────────
  if (notFound) {
    const TIER_LADDER = [
      { img: pawnImg,   color: 'rgba(34,197,94,1)',   glow: 'rgba(34,197,94,0.5)',   name: 'Pawn'   },
      { img: knightImg, color: 'rgba(59,130,246,1)',   glow: 'rgba(59,130,246,0.5)',  name: 'Knight' },
      { img: bishopImg, color: 'rgba(168,85,247,1)',   glow: 'rgba(168,85,247,0.5)',  name: 'Bishop' },
      { img: rookImg,   color: 'rgba(239,68,68,1)',    glow: 'rgba(239,68,68,0.5)',   name: 'Rook'   },
      { img: queenImg,  color: 'rgba(255,140,0,1)',    glow: 'rgba(255,140,0,0.5)',   name: 'Queen'  },
      { img: kingImg,   color: 'rgba(255,215,0,1)',    glow: 'rgba(255,215,0,0.5)',   name: 'King'   },
    ];
    const platformLogo = platform === 'CHESSCOM' ? chesscomLogoImg : lichessLogoImg;
    const platformName = platform === 'CHESSCOM' ? 'Chess.com' : 'Lichess';

    return (
      <div className="min-h-screen bg-[#070d1a] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-lg text-center">

            {/* Tier pieces row */}
            <div className="flex items-end justify-center gap-3 mb-10">
              {TIER_LADDER.map((tier, i) => {
                const size = 28 + i * 8; // pawn→28px, king→68px
                const offset = [0, -4, -8, -12, -18, -24][i];
                return (
                  <div
                    key={tier.name}
                    className="flex flex-col items-center gap-1.5 transition-transform duration-300 hover:-translate-y-2"
                    style={{ marginBottom: offset }}
                  >
                    <div
                      className="rounded-xl flex items-center justify-center"
                      style={{
                        width: size + 16,
                        height: size + 16,
                        background: `${tier.color}10`,
                        border: `1px solid ${tier.color}25`,
                        boxShadow: `0 0 20px ${tier.glow}18`,
                      }}
                    >
                      <img
                        src={tier.img}
                        alt={tier.name}
                        style={{
                          width: size,
                          height: size,
                          objectFit: 'contain',
                          filter: `drop-shadow(0 0 8px ${tier.glow})`,
                          opacity: i === TIER_LADDER.length - 1 ? 1 : 0.55 + i * 0.08,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 404 */}
            <div className="relative mb-6">
              <p
                className="text-[120px] leading-none font-black tabular-nums select-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.04em',
                }}
              >
                404
              </p>
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em]"
                  style={{
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.30)',
                    color: 'rgba(255,170,170,1)',
                  }}
                >
                  {isKR ? '유저 없음' : 'Not Found'}
                </div>
              </div>
            </div>

            {/* Message */}
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">
              {isKR ? '해당 유저를 찾을 수 없어요' : 'This player doesn\'t exist'}
            </h2>

            {/* Username + platform chip */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: platform === 'CHESSCOM' ? '#81B64C' : '#ffffff' }}
                >
                  <img src={platformLogo} alt={platformName} className="w-3 h-3 object-contain" />
                </div>
                <span className="text-white/60 text-sm font-bold">{username}</span>
                <span className="text-white/25 text-xs">·</span>
                <span className="text-white/30 text-xs font-medium">{platformName}</span>
              </div>
            </div>

            <p className="text-white/30 text-sm mb-10 leading-relaxed">
              {isKR
                ? 'ChessLadder에 아직 등록되지 않은 유저이거나\n플랫폼이 다를 수 있어요.'
                : 'This user hasn\'t registered on ChessLadder yet,\nor you might have the wrong platform.'}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white/60 hover:text-white transition"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                {isKR ? '← 뒤로' : '← Go Back'}
              </button>
              <button
                onClick={() => navigate('/ranking')}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white transition"
                style={{
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.20), rgba(59,130,246,0.10))',
                  border: '1px solid rgba(59,130,246,0.30)',
                }}
              >
                {isKR ? '랭킹 보기' : 'View Rankings'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const tierKey = userPerf && !userPerf.uncertain
    ? getTierFromRating(userPerf.rating)
    : 'PAWN';
  const stc = TIER_COLOR_SCHEME[tierKey];

  const bannerBg = profile?.bannerImageUrl
    ? { backgroundImage: `url(${profile.bannerImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : userPerf && !userPerf.uncertain
      ? { backgroundImage: `linear-gradient(135deg, ${stc.darkBg}, rgba(7,13,26,0.95))` }
      : { backgroundColor: '#1a1a24' };

  const bannerHeight = { height: typeof window !== 'undefined' && window.innerWidth < 768 ? '300px' : '500px' };

  const platformUrl = platform === 'CHESSCOM'
    ? `https://www.chess.com/member/${username}`
    : `https://lichess.org/@/${username}`;

  return (
    <div className="min-h-screen bg-[#070d1a]">
      <Header />

      {/* 배너 */}
      <div
        className="w-full relative banner-section z-0"
        style={{ ...bannerBg, ...bannerHeight }}
      />

      {/* 프로필 섹션 */}
      <div className="max-w-6xl mx-auto px-3 md:px-6 -mt-14 md:-mt-20 relative z-10 mb-8">
        <div className="bg-[#070d1a]/95 border border-white/20 rounded-2xl p-4 md:p-8 card-section backdrop-blur-md">
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start">

            {/* 프로필 이미지 */}
            <div className="flex flex-col items-center flex-shrink-0 w-full md:w-auto">
              {loadingProfile ? (
                <div
                  className="w-24 h-24 md:w-36 md:h-36 rounded-2xl border-4 bg-white/5 animate-pulse"
                  style={{ borderColor: stc.mainColor }}
                />
              ) : (
                <img
                  src={profile?.profileImageUrl || 'https://via.placeholder.com/140'}
                  alt={username}
                  className="w-24 h-24 md:w-36 md:h-36 rounded-2xl border-4 object-cover shadow-lg profile-image"
                  style={{ borderColor: stc.mainColor }}
                />
              )}
            </div>

            {/* 프로필 정보 */}
            <div className="flex-1 w-full">
              {loadingProfile ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-8 bg-white/10 rounded w-48" />
                  <div className="h-4 bg-white/6 rounded w-72" />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl md:text-4xl font-black text-white mb-2">
                    {profile?.username ?? username}
                  </h1>
                  <div className="text-[10px] md:text-xs font-normal uppercase tracking-wider mb-5 flex flex-col md:flex-row gap-2 md:gap-4">
                    <p className="text-white/40 whitespace-nowrap">
                      {isKR ? 'ChessMate 가입' : 'ChessMate joined'}:{' '}
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                    </p>
                    <p className="text-white/40 whitespace-nowrap">
                      {platform === 'CHESSCOM' ? 'Chess.com' : 'Lichess'}{' '}
                      {isKR ? '가입' : 'joined'}:{' '}
                      {profile?.platformJoinedAt
                        ? new Date(profile.platformJoinedAt).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>

                  {/* 플랫폼 링크 버튼 */}
                  <div className="mb-5">
                    <a
                      href={platformUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-10 h-10 bg-white/10 border border-white/20 rounded-lg hover:shadow-lg transition hover:scale-105"
                    >
                      <img
                        src={platform === 'CHESSCOM' ? chesscomLogoImg : lichessLogoImg}
                        alt={platform === 'CHESSCOM' ? 'Chess.com' : 'Lichess'}
                        className="w-6 h-6 object-contain"
                      />
                    </a>
                  </div>

                  {/* 자기소개 (읽기 전용) */}
                  <div>
                    <p className="text-white/70 text-sm leading-relaxed p-4 rounded-lg border bg-white/5 border-white/10">
                      {profile?.description || t('profile.noDescription')}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 전체 게임 통계 */}
          <GameStatsDisplay
            profile={profileStats}
            userPerf={userPerf}
            summaryLoaded={summaryLoaded}
          />
        </div>
      </div>

      {/* 플레이 활동 섹션 */}
      <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-5">
            <h2 className="text-2xl font-bold text-white text-animate">
              {t('profile.gameActivityRecord')}
            </h2>
            {/* 현재 연속 플레이 배지 */}
            <div
              className="flex items-center gap-2.5 px-4 py-2 rounded-full border"
              style={{
                backgroundColor: currentStreakDays > 0 ? stc.darkBg : 'rgba(255,255,255,0.04)',
                borderColor: currentStreakDays > 0 ? stc.borderColor : 'rgba(255,255,255,0.10)',
              }}
            >
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="currentColor"
                style={{ color: currentStreakDays > 0 ? stc.darkText : 'rgba(255,255,255,0.20)', flexShrink: 0 }}
              >
                <path d="M7.5 1C7.5 1 10 4.5 10 7.5C10 9.5 9 10.8 8 11.5C8 11.5 8.5 9.5 7 8.5C6 8 5 8.5 5 8.5C5 6.5 6 4.5 7.5 1Z"/>
                <path d="M7.5 9.5C7.5 9.5 8.5 10.5 8.5 11.5C8.5 12.8 7.5 13.5 7 13.5C6.5 13.5 5.5 12.5 6 11.5C6.5 10.5 7.5 9.5 7.5 9.5Z"/>
              </svg>
              <span
                className="text-xl font-black tabular-nums leading-none"
                style={{ color: currentStreakDays > 0 ? stc.darkText : 'rgba(255,255,255,0.25)' }}
              >
                {streakLoaded ? currentStreakDays : '?'}
              </span>
              <span className="text-white/35 text-xs font-medium">
                {t('profile.streakDays')}
              </span>
            </div>
          </div>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 bg-white/5 border border-white/15 rounded-lg text-white text-sm font-medium focus:outline-none transition"
          >
            {availableYears.map(year => (
              <option key={year} value={year} className="bg-white text-black">
                {year}{t('profile.yearSuffix')}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg p-4 md:p-8 card-section overflow-x-auto bg-white/4 border border-white/8">
          <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-6 text-animate">
            {selectedYear}{t('profile.yearSuffix')} {t('profile.activityStatus')}
          </p>
          <div className="pb-6 min-w-full">
            <div className="flex gap-0 mb-3 text-xs text-white/60 font-bold uppercase w-full px-1">
              {['profile.monthJan','profile.monthFeb','profile.monthMar','profile.monthApr',
                'profile.monthMay','profile.monthJun','profile.monthJul','profile.monthAug',
                'profile.monthSep','profile.monthOct','profile.monthNov','profile.monthDec',
              ].map(k => (
                <div key={k} className="flex-1 text-center">{t(k)}</div>
              ))}
            </div>
            <div className="flex w-full" style={{ gap: '1px' }}>
              {(() => {
                const weeks: ReactElement[] = [];
                const firstDay = new Date(selectedYear, 0, 1);
                const lastDay  = new Date(selectedYear, 11, 31);
                let cur = new Date(firstDay);
                let wk  = 0;
                const _tc = userPerf && !userPerf.uncertain
                  ? TIER_COLOR_SCHEME[getTierFromRating(userPerf.rating)].mainColor
                  : TIER_COLOR_SCHEME['PAWN'].mainColor;
                const _bc = _tc.replace(/,\s*1\)$/, '');
                const colorStyles = [
                  'rgba(255,255,255,0.06)',
                  `${_bc},0.30)`, `${_bc},0.52)`,
                  `${_bc},0.74)`, `${_bc},0.95)`,
                ];
                const borderStyles = [
                  'rgba(255,255,255,0.08)',
                  `${_bc},0.40)`, `${_bc},0.65)`,
                  `${_bc},0.88)`, `${_bc},0.95)`,
                ];
                while (cur <= lastDay) {
                  weeks.push(
                    <div key={wk} className="flex flex-col flex-1" style={{ gap: '1px' }}>
                      {Array.from({ length: 7 }).map((_, day) => {
                        const d = new Date(cur);
                        d.setDate(d.getDate() + day);
                        const ds = d.toISOString().split('T')[0];
                        if (d < firstDay || d > lastDay) {
                          return <div key={ds} className="w-4 h-4" />;
                        }
                        const daily = streakMap.get(ds);
                        let activity = 0;
                        if (daily) {
                          const tot = daily.total ?? 0;
                          activity = tot === 0 ? 0 : tot <= 2 ? 1 : tot <= 5 ? 2 : tot <= 8 ? 3 : 4;
                        }
                        return (
                          <div
                            key={ds}
                            style={{ backgroundColor: colorStyles[activity], borderColor: borderStyles[activity] }}
                            className="w-4 h-4 rounded-sm border cursor-help transition hover:brightness-125"
                            title={
                              daily
                                ? `${ds} · ${daily.total}${isKR ? '게임' : ' games'}: ${daily.win}W ${daily.lose}L ${daily.draw}D`
                                : isKR ? '데이터 없음' : 'No data'
                            }
                          />
                        );
                      })}
                    </div>,
                  );
                  cur.setDate(cur.getDate() + 7);
                  wk++;
                }
                return weeks;
              })()}
            </div>
          </div>
        </div>

        {/* 연도별 요약 통계 */}
        <div className="mt-4">
          {(() => {
            let totalGames = 0, totalWins = 0, totalLoses = 0, totalDraws = 0, activeDays = 0;
            streakMap.forEach(d => {
              totalGames += d.total ?? 0;
              totalWins  += d.win  ?? 0;
              totalLoses += d.lose ?? 0;
              totalDraws += d.draw ?? 0;
              if ((d.total ?? 0) > 0) activeDays++;
            });

            let maxStreak = 0, tempStreak = 0;
            const fd = new Date(selectedYear, 0, 1);
            const ld = new Date(selectedYear, 11, 31);
            let td = new Date(fd);
            while (td <= ld) {
              const ds = td.toISOString().split('T')[0];
              const d  = streakMap.get(ds);
              if (d && d.total > 0) { tempStreak++; maxStreak = Math.max(maxStreak, tempStreak); }
              else { tempStreak = 0; }
              td.setDate(td.getDate() + 1);
            }

            const winRate = totalGames > 0
              ? ((totalWins / totalGames) * 100).toFixed(1)
              : null;

            const items = [
              {
                label: t('profile.bestStreakYear').replace('{year}', String(selectedYear)),
                value: streakLoaded ? `${maxStreak}` : '?',
                unit: t('profile.unitDay'),
                highlight: true,
              },
              {
                label: t('profile.activeDays'),
                value: streakLoaded ? `${activeDays}` : '?',
                unit: t('profile.unitDay'),
              },
              {
                label: t('profile.totalPlayGames'),
                value: streakLoaded ? `${totalGames}` : '?',
                unit: t('profile.unitGame'),
              },
              {
                label: t('profile.winRate'),
                value: streakLoaded ? (winRate ?? '0.0') : '?',
                unit: '%',
                sub: streakLoaded ? `${totalWins}W ${totalLoses}L` : '',
              },
            ];

            return (
              <div className="flex flex-wrap gap-2">
                {items.map(item => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg border flex-1 min-w-[140px]"
                    style={{
                      backgroundColor: item.highlight ? stc.darkBg : 'rgba(255,255,255,0.03)',
                      borderColor: item.highlight ? stc.borderColor : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <div>
                      <p className="text-white/40 text-[10px] uppercase tracking-wider leading-none mb-1">
                        {item.label}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-2xl font-black tabular-nums leading-none"
                          style={{ color: item.highlight ? stc.darkText : 'rgba(255,255,255,0.85)' }}
                        >
                          {item.value}
                        </span>
                        <span className="text-white/30 text-xs">{item.unit}</span>
                      </div>
                      {item.sub && (
                        <p className="text-white/25 text-[10px] mt-0.5">{item.sub}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 게임 타입 선택 */}
      <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8">
        <GameTypeButtons
          gameTypes={gameTypes}
          selectedGameType={selectedGameType}
          gameTypeDisplayNames={gameTypeDisplayNames}
          onGameTypeChange={setSelectedGameType}
        />
      </div>

      {/* 티어 섹션 */}
      <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
        <TierSection
          userPerf={userPerf}
          loadingPerf={loadingPerf}
          tierColorScheme={TIER_COLOR_SCHEME}
          promotionThresholds={PROMOTION_THRESHOLDS}
          convertSubTierToRoman={convertSubTierToRoman}
          platform={platform}
        />
      </div>

      {/* 레이팅 히스토리 */}
      <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
        <div className="flex flex-col gap-1 mb-6">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-animate">
              {t('profile.ratingTrend')}
            </h2>
            <span className="text-xs font-semibold uppercase tracking-widest text-white/30 pb-0.5">
              {isKR ? '최근 1년' : 'Last 12 months'}
            </span>
          </div>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-transparent rounded-full" />
        </div>
        <div className="bg-white/4 border border-white/8 rounded-lg p-8 card-section">
          {loadingRatingHistory ? (
            <div className="flex items-center justify-center h-80">
              <p className="text-white/40 text-sm">{t('profile.dataLoading')}</p>
            </div>
          ) : ratingHistoryResponse && ratingHistoryResponse.data.length > 0 ? (
            <div className="h-[450px]">
              <MonthlyRatingHistoryChart
                ratingHistory={ratingHistoryResponse}
                tierThresholds={PROMOTION_THRESHOLDS}
                isLoading={loadingRatingHistory}
                platform={platform}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 gap-3">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="opacity-20">
                <path d="M4 28 L10 18 L16 22 L22 10 L28 16 L34 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="34" cy="6" r="2.5" fill="white"/>
              </svg>
              <p className="text-white/35 text-sm font-semibold">
                {isKR
                  ? `${gameTypeDisplayNames[selectedGameType]} 최근 1년 데이터가 존재하지 않습니다`
                  : `No ${gameTypeDisplayNames[selectedGameType]} data in the last 12 months`}
              </p>
              <p className="text-white/20 text-xs">
                {isKR ? '게임을 플레이하면 여기에 레이팅 추세가 표시됩니다' : 'Play some games and your rating trend will appear here'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 색깔별 통계 */}
      <div className="max-w-6xl mx-auto px-6 mb-12 section-spacing">
        <div className="flex flex-col gap-1 mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-animate">
            {t('profile.colorStats')}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-transparent rounded-full" />
        </div>
        {colorStats ? (
          <ColorStatsChart data={colorStats} isLoading={loadingColorStats} />
        ) : (
          <div className="bg-gradient-to-br from-[#0d1626]/80 to-[#070d1a]/50 border border-white/10 rounded-2xl p-8">
            <p className="text-white/40 text-center h-96 flex items-center justify-center">
              {t('profile.noData')}
            </p>
          </div>
        )}
      </div>

      {/* 첫 수 통계 */}
      <div className="max-w-6xl mx-auto px-6 mb-12 section-spacing">
        <div className="flex flex-col gap-1 mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-animate">
            {t('profile.firstMoveStats')}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-transparent rounded-full" />
        </div>
        {firstMoveStats ? (
          <FirstMoveStatsChart data={firstMoveStats} isLoading={loadingFirstMoveStats} />
        ) : (
          <div className="bg-gradient-to-br from-[#0d1626]/80 to-[#070d1a]/50 border border-white/10 rounded-2xl p-8">
            <p className="text-white/40 text-center h-96 flex items-center justify-center">
              {t('profile.noData')}
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default UserProfile;
