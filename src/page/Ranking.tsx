import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../global/Header';
import Footer from '../global/Footer';
import { useLanguage } from '../context/LanguageContext';
import { getRanking, type RankingUserResponse } from '../api/userService';
import { getOAuthUrl, getChesscomOAuthUrl } from '../api/oauthService';
import { logout as authLogout } from '../api/authService';
import lichessLogoImg from '../assets/images/logo/lichess-logo.png';
import chesscomLogoImg from '../assets/images/logo/chesscom-logo.png';
import { getTierInfo, TIER_COLOR_SCHEME, type Platform } from '../utils/tierUtils';

// 게임 타입 이미지 import
import rapidImg from '../assets/images/logo/game/rapid.webp';
import blitzImg from '../assets/images/logo/game/blitz.webp';
import classicalImg from '../assets/images/logo/game/classical.webp';
import bulletImg from '../assets/images/logo/game/bullet.webp';

// 티어 이미지 import
import pawnImg from '../assets/images/tier/pawn.png';
import knightImg from '../assets/images/tier/knight.png';
import bishopImg from '../assets/images/tier/vishop.png';
import rookImg from '../assets/images/tier/rook.png';
import queenImg from '../assets/images/tier/queen.png';
import kingImg from '../assets/images/tier/king.png';

const GAME_TYPES = ['RAPID', 'BLITZ', 'CLASSICAL', 'BULLET'] as const;
type GameType = typeof GAME_TYPES[number];

const RANKING_STATE_KEY = 'ranking_view_state_v1';

type RankingViewState = {
  platform: 'LICHESS' | 'CHESSCOM';
  gameType: GameType;
  page: number;
};

interface RankingUser extends RankingUserResponse {}

const tierImages: { [key: string]: string } = {
  'PAWN': pawnImg, 'KNIGHT': knightImg, 'BISHOP': bishopImg,
  'ROOK': rookImg, 'QUEEN': queenImg,   'KING': kingImg
};

const getGameTypeImage = (gameType: GameType): string => {
  const map: Record<GameType, string> = { RAPID: rapidImg, BLITZ: blitzImg, CLASSICAL: classicalImg, BULLET: bulletImg };
  return map[gameType];
};

function UserRow({ user, platform, onClick }: { user: RankingUser; platform: Platform; onClick: () => void }) {
  const tierInfo = getTierInfo(user.rating, platform);
  const tierColor = TIER_COLOR_SCHEME[tierInfo.tier] || TIER_COLOR_SCHEME['PAWN'];
  const tierImage = tierImages[tierInfo.tier] || tierImages['PAWN'];

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border p-4 flex items-center gap-4 hover:bg-white/5 transition-all relative overflow-hidden"
      style={{ borderColor: tierColor.borderColor, backgroundColor: 'rgba(255,255,255,0.03)' }}
    >
      {user.banner_image && (
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center rounded-xl"
          style={{ backgroundImage: `url('${user.banner_image}')` }}
        />
      )}

      <div className="flex-shrink-0 w-10 text-center relative z-10">
        <p className="text-base font-black text-white/50">#{user.rank}</p>
      </div>

      <div className="flex items-center gap-3 flex-grow relative z-10 min-w-0">
        {user.profile_image ? (
          <img src={user.profile_image} alt={user.username}
            className="w-10 h-10 rounded-full object-cover border flex-shrink-0"
            style={{ borderColor: tierColor.mainColor }} />
        ) : (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: tierColor.mainColor }}>
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-white text-sm truncate">{user.username}</p>
          <p className="text-xs text-white/40 truncate">{user.description || '-'}</p>
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-3 relative z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ backgroundColor: tierColor.borderColor }}>
          <img src={tierImage} alt={tierInfo.tier} className="w-6 h-6 object-contain" />
          <span className="text-xs font-black tracking-wide" style={{ color: tierColor.mainColor }}>
            {tierInfo.tier} {tierInfo.subRoman}
          </span>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-white">{user.rating}</p>
          <p className="text-xs text-white/40">Rating</p>
        </div>
      </div>
    </div>
  );
}

export default function Ranking() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const readInitialState = (): RankingViewState => {
    const fromQueryPlatform = (searchParams.get('platform') ?? '').toUpperCase();
    const fromQueryGameType = (searchParams.get('gameType') ?? '').toUpperCase();
    const fromQueryPageRaw = Number(searchParams.get('page') ?? '1');
    const fromQueryPage = Number.isFinite(fromQueryPageRaw) && fromQueryPageRaw > 0
      ? Math.floor(fromQueryPageRaw)
      : 1;

    const queryPlatform = fromQueryPlatform === 'CHESSCOM' ? 'CHESSCOM' : (fromQueryPlatform === 'LICHESS' ? 'LICHESS' : null);
    const queryGameType = (GAME_TYPES as readonly string[]).includes(fromQueryGameType)
      ? (fromQueryGameType as GameType)
      : null;

    if (queryPlatform && queryGameType) {
      return { platform: queryPlatform, gameType: queryGameType, page: fromQueryPage };
    }

    try {
      const raw = sessionStorage.getItem(RANKING_STATE_KEY);
      if (!raw) return { platform: 'LICHESS', gameType: 'RAPID', page: 1 };
      const parsed = JSON.parse(raw) as Partial<RankingViewState>;
      const platform = parsed.platform === 'CHESSCOM' ? 'CHESSCOM' : 'LICHESS';
      const gameType = (GAME_TYPES as readonly string[]).includes(String(parsed.gameType))
        ? (parsed.gameType as GameType)
        : 'RAPID';
      const page = Number(parsed.page);
      return {
        platform,
        gameType,
        page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
      };
    } catch {
      return { platform: 'LICHESS', gameType: 'RAPID', page: 1 };
    }
  };

  const initialState = readInitialState();

  const [selectedPlatform, setSelectedPlatform] = useState<'LICHESS' | 'CHESSCOM'>(initialState.platform);
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [currentPage, setCurrentPage] = useState(initialState.page);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<GameType>(initialState.gameType);

  const [myRank, setMyRank] = useState<number | null>(null);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);
  const [platformMismatch, setPlatformMismatch] = useState(false);
  const [isUnrated, setIsUnrated] = useState(false);

  const [isLichessLoading, setIsLichessLoading] = useState(false);
  const [isChesscomLoading, setIsChesscomLoading] = useState(false);

  useEffect(() => {
    const nextState: RankingViewState = {
      platform: selectedPlatform,
      gameType: selectedGameType,
      page: currentPage,
    };
    sessionStorage.setItem(RANKING_STATE_KEY, JSON.stringify(nextState));

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('platform', selectedPlatform);
    nextParams.set('gameType', selectedGameType);
    nextParams.set('page', String(currentPage));

    const current = searchParams.toString();
    const next = nextParams.toString();
    if (current !== next) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [selectedPlatform, selectedGameType, currentPage, searchParams, setSearchParams]);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getRanking(selectedGameType, currentPage - 1, selectedPlatform);
        setUsers(response.users.filter(u => u.rank > 0));
        setTotalPages(response.total_pages);
        setMyRank(response.my_rank ?? null);
        setMyRating(response.my_rating ?? null);
        setIsLoggedInUser(response.is_logged_in_user);
        setPlatformMismatch(response.platform_mismatch ?? false);
        setIsUnrated(response.is_unrated ?? false);
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [currentPage, selectedGameType, selectedPlatform, t]);

  const handleUserClick = (username: string) => navigate(`/profile/${username}?platform=${selectedPlatform}`);

  const handleLichessLogin = async (switchPlatform = false) => {
    if (isLichessLoading) return;
    try {
      setIsLichessLoading(true);
      if (switchPlatform) await authLogout();
      const res = await getOAuthUrl();
      if (!res.success || !res.oauth_url) throw new Error();
      sessionStorage.setItem('oauth_platform', 'LICHESS');
      window.location.href = res.oauth_url;
    } catch {
      setIsLichessLoading(false);
    }
  };

  const handleChesscomLogin = async (switchPlatform = false) => {
    if (isChesscomLoading) return;
    try {
      setIsChesscomLoading(true);
      if (switchPlatform) await authLogout();
      const res = await getChesscomOAuthUrl();
      if (!res.success || !res.oauth_url) throw new Error();
      sessionStorage.setItem('oauth_platform', 'CHESSCOM');
      window.location.href = res.oauth_url;
    } catch {
      setIsChesscomLoading(false);
    }
  };

  const handleGameTypeChange = (gameType: GameType) => {
    setSelectedGameType(gameType);
    setCurrentPage(1);
  };

  const handlePlatformChange = (platform: 'LICHESS' | 'CHESSCOM') => {
    setSelectedPlatform(platform);
    setCurrentPage(1);
  };

  const myTierInfo = myRating !== null ? getTierInfo(myRating, selectedPlatform) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#070d1a]">
      <Header />

      <main className="flex-1 px-4 py-12">
        <div className="max-w-5xl mx-auto">

          {/* 타이틀 */}
          <div className="mb-10">
            <h1 className="text-4xl font-black text-white tracking-tight mb-1">
              {t('common.ranking') || 'Ranking'}
            </h1>
            <p className="text-white/35 text-sm">
              {t('common.rankingDescription') || 'Browse the top chess players'}
            </p>
          </div>

          {/* Platform 탭 */}
          <div className="flex gap-1 mb-6 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
            {([['LICHESS', lichessLogoImg, 'Lichess'], ['CHESSCOM', chesscomLogoImg, 'Chess.com']] as const).map(([pl, logo, label]) => (
              <button
                key={pl}
                onClick={() => handlePlatformChange(pl)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  selectedPlatform === pl
                    ? 'bg-white/15 text-white'
                    : 'text-white/45 hover:text-white/70'
                }`}
              >
                <img src={logo} alt={label} className="w-4 h-4 object-contain" />
                {label}
              </button>
            ))}
          </div>

          {/* Game Type 탭 */}
          <div className="flex gap-2 mb-8 border-b border-white/10 overflow-x-auto">
            {GAME_TYPES.map((gameType) => (
              <button
                key={gameType}
                onClick={() => handleGameTypeChange(gameType)}
                className={`pb-3 px-1 mr-4 text-sm font-semibold transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  selectedGameType === gameType
                    ? 'text-white border-white'
                    : 'text-white/45 border-transparent hover:text-white/70 hover:border-white/20'
                }`}
              >
                <img src={getGameTypeImage(gameType)} alt={gameType} className="w-4 h-4" />
                {gameType}
              </button>
            ))}
          </div>

          {/* 로딩 */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* 에러 */}
          {error && (
            <div className="text-center py-20 text-white/50">{error}</div>
          )}

          {!loading && !error && (
            <div className="flex flex-col md:flex-row gap-6">

              {/* 왼쪽: 내 랭킹 패널 */}
              <div className="w-full md:w-72 flex-shrink-0">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sticky top-20">
                  <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-5">
                    {t('common.yourRanking') || 'YOUR RANKING'}
                  </h2>

                  {platformMismatch ? (
                    /* 다른 플랫폼 열람 중 */
                    <div className="space-y-3">
                      <p className="text-xs text-white/50 leading-relaxed mb-4">
                        {selectedPlatform === 'LICHESS'
                          ? t('ranking.switchToLichess')
                          : t('ranking.switchToChesscom')}
                      </p>
                      {selectedPlatform === 'LICHESS' ? (
                        <button onClick={() => handleLichessLogin(true)} disabled={isLichessLoading}
                          className="w-full flex items-center gap-2 bg-white text-black font-semibold py-2.5 px-4 rounded-full hover:bg-gray-100 transition text-sm disabled:opacity-50">
                          <img src={lichessLogoImg} alt="Lichess" className="w-5 h-5" />
                          {isLichessLoading ? t('profile.loading') : t('main.loginWithLichess')}
                        </button>
                      ) : (
                        <button onClick={() => handleChesscomLogin(true)} disabled={isChesscomLoading}
                          className="w-full flex items-center gap-2 bg-[#81B64C] text-white font-semibold py-2.5 px-4 rounded-full hover:bg-[#70a33e] transition text-sm disabled:opacity-50">
                          <img src={chesscomLogoImg} alt="Chess.com" className="w-5 h-5" />
                          {isChesscomLoading ? t('profile.loading') : t('main.loginWithChesscom')}
                        </button>
                      )}
                    </div>
                  ) : !isLoggedInUser ? (
                    /* 비로그인 */
                    <div className="space-y-3">
                      <p className="text-xs text-white/50 leading-relaxed mb-4">
                        {t('ranking.loginPrompt')}
                      </p>
                      {selectedPlatform === 'LICHESS' ? (
                        <button onClick={() => handleLichessLogin()} disabled={isLichessLoading}
                          className="w-full flex items-center gap-2 bg-white text-black font-semibold py-2.5 px-4 rounded-full hover:bg-gray-100 transition text-sm disabled:opacity-50">
                          <img src={lichessLogoImg} alt="Lichess" className="w-5 h-5" />
                          {isLichessLoading ? t('profile.loading') : t('main.loginWithLichess')}
                        </button>
                      ) : (
                        <button onClick={() => handleChesscomLogin()} disabled={isChesscomLoading}
                          className="w-full flex items-center gap-2 bg-[#81B64C] text-white font-semibold py-2.5 px-4 rounded-full hover:bg-[#70a33e] transition text-sm disabled:opacity-50">
                          <img src={chesscomLogoImg} alt="Chess.com" className="w-5 h-5" />
                          {isChesscomLoading ? t('profile.loading') : t('main.loginWithChesscom')}
                        </button>
                      )}
                    </div>
                  ) : isUnrated ? (
                    /* 언레이팅 */
                    <div className="text-center space-y-2">
                      <p className="text-sm text-white/60">{t('ranking.notRated')}</p>
                      <p className="text-xs text-white/35">{t('ranking.playMoreGames')}</p>
                    </div>
                  ) : myRank === 0 || myRating === 0 || myRank === null ? (
                    /* 해당 게임 타입 랭킹 없음 */
                    <div className="flex flex-col items-center gap-3 py-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl opacity-40">
                        ?
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/50">
                          {t('ranking.notInRanking')}
                        </p>
                        <p className="text-xs text-white/30 mt-1 leading-relaxed">
                          {t('ranking.notInRankingDesc')}
                        </p>
                      </div>
                    </div>
                  ) : myRating !== null && myTierInfo ? (
                    /* 랭킹 정보 */
                    <div className="space-y-4">
                      {/* Tier 카드 — 메인 포커스 */}
                      <div
                        className="relative rounded-2xl overflow-hidden p-5 flex flex-col items-center gap-3"
                        style={{ background: `linear-gradient(135deg, ${TIER_COLOR_SCHEME[myTierInfo.tier]?.borderColor}, transparent)`, border: `1px solid ${TIER_COLOR_SCHEME[myTierInfo.tier]?.borderColor}` }}
                      >
                        <img
                          src={tierImages[myTierInfo.tier]}
                          alt={myTierInfo.tier}
                          className="w-16 h-16 object-contain drop-shadow-lg"
                        />
                        <div className="text-center">
                          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-0.5"
                            style={{ color: TIER_COLOR_SCHEME[myTierInfo.tier]?.mainColor }}>
                            {myTierInfo.tier}
                          </p>
                          <p className="text-3xl font-black text-white leading-none">{myTierInfo.subRoman}</p>
                        </div>
                      </div>

                      {/* Rank / Rating */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-xl bg-white/[0.05] border border-white/10 p-3 text-center">
                          <p className="text-[10px] text-white/35 uppercase tracking-widest mb-1">Rank</p>
                          <p className="text-2xl font-black text-white">#{myRank}</p>
                        </div>
                        <div className="rounded-xl bg-white/[0.05] border border-white/10 p-3 text-center">
                          <p className="text-[10px] text-white/35 uppercase tracking-widest mb-1">Rating</p>
                          <p className="text-2xl font-black text-white">{myRating}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 오른쪽: 랭킹 리스트 */}
              <div className="flex-grow space-y-2">
                {users.map((user) => (
                  <UserRow key={user.id} user={user} platform={selectedPlatform} onClick={() => handleUserClick(user.username)} />
                ))}

                {users.length === 0 && (
                  <div className="text-center py-12 text-white/35">
                    {t('common.noData') || 'No ranking data available'}
                  </div>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-end gap-2 pt-4">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-white/60 border border-white/15 rounded-lg hover:bg-white/8 transition disabled:opacity-30 text-sm"
                    >←</button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(p => Math.abs(p - currentPage) <= 1 || p === 1 || p === totalPages)
                        .map((page, idx, arr) => (
                          <div key={page} className="flex items-center">
                            {idx > 0 && arr[idx - 1] !== page - 1 && (
                              <span className="px-1 text-white/25 text-sm">…</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${
                                currentPage === page
                                  ? 'bg-white/15 text-white'
                                  : 'text-white/50 hover:bg-white/8 hover:text-white'
                              }`}
                            >{page}</button>
                          </div>
                        ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-white/60 border border-white/15 rounded-lg hover:bg-white/8 transition disabled:opacity-30 text-sm"
                    >→</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
