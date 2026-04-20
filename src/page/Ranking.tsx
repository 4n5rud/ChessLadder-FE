import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../global/Header';
import Footer from '../global/Footer';
import { useLanguage } from '../context/LanguageContext';
import { useAuthStore } from '../store/authStore';
import { getRanking, type RankingUserResponse } from '../api/userService';
import { getOAuthUrl, getChesscomOAuthUrl } from '../api/oauthService';
import lichessLogoImg from '../assets/images/logo/lichess-logo.png';
import chesscomLogoImg from '../assets/images/logo/chesscom-logo.png';

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

interface RankingUser extends RankingUserResponse {}

const promotionThresholds: { [key: string]: number } = {
  'PAWN': 400,
  'KNIGHT': 901,
  'BISHOP': 1201,
  'ROOK': 1501,
  'QUEEN': 1801,
  'KING': 2101
};

const tierColorScheme: { [key: string]: { mainColor: string; borderColor: string } } = {
  'PAWN':   { mainColor: 'rgba(150,155,165,0.75)', borderColor: 'rgba(150,155,165,0.25)' },
  'KNIGHT': { mainColor: 'rgba(80,160,100,0.80)',  borderColor: 'rgba(80,160,100,0.25)'  },
  'BISHOP': { mainColor: 'rgba(60,145,195,0.80)',  borderColor: 'rgba(60,145,195,0.25)'  },
  'ROOK':   { mainColor: 'rgba(47,99,157,0.90)',   borderColor: 'rgba(47,99,157,0.30)'   },
  'QUEEN':  { mainColor: 'rgba(130,75,185,0.80)',  borderColor: 'rgba(130,75,185,0.25)'  },
  'KING':   { mainColor: 'rgba(195,155,55,0.82)',  borderColor: 'rgba(195,155,55,0.28)'  },
};

const tierImages: { [key: string]: string } = {
  'PAWN': pawnImg, 'KNIGHT': knightImg, 'BISHOP': bishopImg,
  'ROOK': rookImg, 'QUEEN': queenImg,   'KING': kingImg
};

const getTierWithSubTier = (rating: number): { tier: string; subTier: number } => {
  const tierRanges: { [key: string]: { subTiers: { [key: number]: [number, number] } } } = {
    'PAWN':   { subTiers: { 5:[400,500],  4:[501,600],  3:[601,700],  2:[701,800],  1:[801,900]  } },
    'KNIGHT': { subTiers: { 5:[901,960],  4:[961,1020], 3:[1021,1080],2:[1081,1140],1:[1141,1200]} },
    'BISHOP': { subTiers: { 5:[1201,1260],4:[1261,1320],3:[1321,1380],2:[1381,1440],1:[1441,1500]} },
    'ROOK':   { subTiers: { 5:[1501,1560],4:[1561,1620],3:[1621,1680],2:[1681,1740],1:[1741,1800]} },
    'QUEEN':  { subTiers: { 5:[1801,1860],4:[1861,1920],3:[1921,1980],2:[1981,2040],1:[2041,2100]} },
    'KING':   { subTiers: { 5:[2101,2220],4:[2221,2340],3:[2341,2460],2:[2461,2580],1:[2581,2700]} },
  };

  const tiers = Object.entries(promotionThresholds).sort(([, a], [, b]) => b - a);
  let tier = 'PAWN';
  for (const [t, minRating] of tiers) {
    if (rating >= minRating) { tier = t; break; }
  }

  let subTier = 5;
  for (const [sub, range] of Object.entries(tierRanges[tier].subTiers)) {
    if (rating >= range[0] && rating <= range[1]) { subTier = parseInt(sub); break; }
  }
  return { tier, subTier };
};

const getGameTypeImage = (gameType: GameType): string => {
  const map: Record<GameType, string> = { RAPID: rapidImg, BLITZ: blitzImg, CLASSICAL: classicalImg, BULLET: bulletImg };
  return map[gameType];
};

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];

function UserRow({ user, onClick }: { user: RankingUser; onClick: () => void }) {
  const tierInfo = getTierWithSubTier(user.rating);
  const tierColor = tierColorScheme[tierInfo.tier] || tierColorScheme['PAWN'];
  const tierImage = tierImages[tierInfo.tier] || tierImages['PAWN'];
  const roman = ROMAN[tierInfo.subTier] || '';

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

      <div className="flex-shrink-0 flex items-center gap-2 relative z-10">
        <div className="flex flex-col items-center">
          <img src={tierImage} alt={tierInfo.tier} className="w-8 h-8 object-contain" />
          <p className="text-xs font-black leading-none" style={{ color: tierColor.mainColor }}>{roman}</p>
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
  const storeUser = useAuthStore((state) => state.user);

  const [users, setUsers] = useState<RankingUser[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<GameType>('RAPID');

  const [myRank, setMyRank] = useState<number | null>(null);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);
  const [isUnrated, setIsUnrated] = useState(false);

  const [isLichessLoading, setIsLichessLoading] = useState(false);
  const [isChesscomLoading, setIsChesscomLoading] = useState(false);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getRanking(selectedGameType, currentPage - 1);
        setUsers(response.users.filter(u => u.rank > 0));
        setTotalPages(response.total_pages);
        setMyRank(response.my_rank ?? null);
        setMyRating(response.my_rating ?? null);
        setIsLoggedInUser(response.is_logged_in_user);
        setIsUnrated(response.is_unrated ?? false);
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [currentPage, selectedGameType, t]);

  const handleUserClick = (username: string) => navigate(`/profile/${username}`);

  const handleLichessLogin = async () => {
    if (isLichessLoading) return;
    try {
      setIsLichessLoading(true);
      const res = await getOAuthUrl();
      if (!res.success || !res.oauth_url) throw new Error();
      sessionStorage.setItem('oauth_platform', 'LICHESS');
      window.location.href = res.oauth_url;
    } catch {
      setIsLichessLoading(false);
    }
  };

  const handleChesscomLogin = async () => {
    if (isChesscomLoading) return;
    try {
      setIsChesscomLoading(true);
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

  const myTierInfo = myRating !== null ? getTierWithSubTier(myRating) : null;

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

                  {!isLoggedInUser ? (
                    /* 비로그인 */
                    <div className="space-y-3">
                      <p className="text-xs text-white/50 leading-relaxed mb-4">
                        {t('ranking.loginPrompt') || '로그인해서 내 랭킹을 확인해보세요!'}
                      </p>
                      {(!storeUser || storeUser.platform === 'LICHESS') && (
                        <button onClick={handleLichessLogin} disabled={isLichessLoading}
                          className="w-full flex items-center gap-2 bg-white text-black font-semibold py-2.5 px-4 rounded-full hover:bg-gray-100 transition text-sm disabled:opacity-50">
                          <img src={lichessLogoImg} alt="Lichess" className="w-5 h-5" />
                          {isLichessLoading ? t('profile.loading') : t('main.loginWithLichess')}
                        </button>
                      )}
                      {(!storeUser || storeUser.platform === 'CHESSCOM') && (
                        <button onClick={handleChesscomLogin} disabled={isChesscomLoading}
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
                  ) : myRank !== null && myRating !== null && myTierInfo ? (
                    /* 랭킹 정보 */
                    <div className="space-y-5">
                      <div className="text-center pb-4 border-b border-white/10">
                        <p className="text-xs text-white/35 uppercase tracking-widest mb-1">Rank</p>
                        <p className="text-4xl font-black text-white">#{myRank}</p>
                      </div>
                      <div className="text-center pb-4 border-b border-white/10">
                        <p className="text-xs text-white/35 uppercase tracking-widest mb-1">Rating</p>
                        <p className="text-3xl font-black text-white">{myRating}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/35 uppercase tracking-widest mb-3">Tier</p>
                        <div className="flex justify-center items-center gap-2">
                          <img src={tierImages[myTierInfo.tier]} alt={myTierInfo.tier} className="w-10 h-10 object-contain" />
                          <span className="text-2xl font-black text-white">{ROMAN[myTierInfo.subTier]}</span>
                        </div>
                        <p className="text-xs text-white/40 mt-1" style={{ color: tierColorScheme[myTierInfo.tier]?.mainColor }}>
                          {myTierInfo.tier}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 오른쪽: 랭킹 리스트 */}
              <div className="flex-grow space-y-2">
                {users.map((user) => (
                  <UserRow key={user.id} user={user} onClick={() => handleUserClick(user.username)} />
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
