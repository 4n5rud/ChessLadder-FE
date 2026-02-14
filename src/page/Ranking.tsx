import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../global/Header';
import Footer from '../global/Footer';
import { useLanguage } from '../context/LanguageContext';
import { getRanking, type RankingUserResponse } from '../api/userService';
import { getOAuthUrl } from '../api/oauthService';
import lichessLogoImg from '../assets/images/logo/lichess-logo.png';

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

// Tier 시스템
const promotionThresholds: { [key: string]: number } = {
  'PAWN': 400,
  'KNIGHT': 901,
  'BISHOP': 1201,
  'ROOK': 1501,
  'QUEEN': 1801,
  'KING': 2101
};

const tierColorScheme: { [key: string]: { mainColor: string; lightBg: string; borderColor: string } } = {
  'PAWN': { mainColor: '#aecdb1', lightBg: '#f0f8f3', borderColor: '#aecdb1' },
  'KNIGHT': { mainColor: '#87abd6', lightBg: '#f0f5fb', borderColor: '#87abd6' },
  'BISHOP': { mainColor: '#ae97d7', lightBg: '#f5f1fb', borderColor: '#ae97d7' },
  'ROOK': { mainColor: '#e7ada8', lightBg: '#fdf4f2', borderColor: '#e7ada8' },
  'QUEEN': { mainColor: '#edae6c', lightBg: '#fef9f2', borderColor: '#edae6c' },
  'KING': { mainColor: '#edae6c', lightBg: '#fef9f2', borderColor: '#edae6c' }
};

const tierImages: { [key: string]: string } = {
  'PAWN': pawnImg,
  'KNIGHT': knightImg,
  'BISHOP': bishopImg,
  'ROOK': rookImg,
  'QUEEN': queenImg,
  'KING': kingImg
};

// 서브티어 계산
const getTierWithSubTier = (rating: number): { tier: string; subTier: number } => {
  const tierRanges: { [key: string]: { min: number; max: number; subTiers: { [key: number]: [number, number] } } } = {
    'PAWN': {
      min: 400,
      max: 900,
      subTiers: {
        5: [400, 500],
        4: [501, 600],
        3: [601, 700],
        2: [701, 800],
        1: [801, 900]
      }
    },
    'KNIGHT': {
      min: 901,
      max: 1200,
      subTiers: {
        5: [901, 960],
        4: [961, 1020],
        3: [1021, 1080],
        2: [1081, 1140],
        1: [1141, 1200]
      }
    },
    'BISHOP': {
      min: 1201,
      max: 1500,
      subTiers: {
        5: [1201, 1260],
        4: [1261, 1320],
        3: [1321, 1380],
        2: [1381, 1440],
        1: [1441, 1500]
      }
    },
    'ROOK': {
      min: 1501,
      max: 1800,
      subTiers: {
        5: [1501, 1560],
        4: [1561, 1620],
        3: [1621, 1680],
        2: [1681, 1740],
        1: [1741, 1800]
      }
    },
    'QUEEN': {
      min: 1801,
      max: 2100,
      subTiers: {
        5: [1801, 1860],
        4: [1861, 1920],
        3: [1921, 1980],
        2: [1981, 2040],
        1: [2041, 2100]
      }
    },
    'KING': {
      min: 2101,
      max: Infinity,
      subTiers: {
        1: [2101, Infinity]
      }
    }
  };

  const tiers = Object.entries(promotionThresholds).sort(([, a], [, b]) => b - a);
  let tier = 'PAWN';
  
  for (const [t, minRating] of tiers) {
    if (rating >= minRating) {
      tier = t;
      break;
    }
  }

  const tierRange = tierRanges[tier];
  let subTier = 5;
  
  for (const [sub, range] of Object.entries(tierRange.subTiers)) {
    if (rating >= range[0] && rating <= range[1]) {
      subTier = parseInt(sub);
      break;
    }
  }

  return { tier, subTier };
};

const getGameTypeImage = (gameType: GameType): string => {
  switch (gameType) {
    case 'RAPID': return rapidImg;
    case 'BLITZ': return blitzImg;
    case 'CLASSICAL': return classicalImg;
    case 'BULLET': return bulletImg;
    default: return rapidImg;
  }
};

export default function Ranking() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<RankingUser[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGameType, setSelectedGameType] = useState<GameType>('RAPID');
  
  // 내 랭킹 정보
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);
  const [isUnrated, setIsUnrated] = useState(false);

  // 랭킹 데이터 조회
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getRanking(selectedGameType, currentPage - 1);
        console.log('[Ranking] API response:', response);

        // rank 0 = unrated 제외
        const filteredUsers = response.users.filter(user => user.rank > 0);
        
        setUsers(filteredUsers);
        setTotalPages(response.total_pages);
        setMyRank(response.my_rank ?? null);
        setMyRating(response.my_rating ?? null);
        setIsLoggedInUser(response.is_logged_in_user);
        setIsUnrated(response.is_unrated ?? false);
      } catch (err) {
        console.error('[Ranking] Failed to fetch ranking:', err);
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [currentPage, selectedGameType, t]);

  const handleUserClick = (userId: number) => {
    navigate(`/profile/${userId}`);
  };

  const handleLogin = async () => {
    try {
      const res = await getOAuthUrl();
      const oauthUrl = res.data?.oauth_url || res.oauth_url || res.oauthUrl;
      
      if (!oauthUrl) {
        throw new Error(t('main.loginFailAlert'));
      }
      
      window.location.assign(oauthUrl);
    } catch (err) {
      console.error('Failed to get OAuth URL:', err);
      alert(t('main.loginFailAlert'));
    }
  };

  const handleGameTypeChange = (gameType: GameType) => {
    setSelectedGameType(gameType);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 px-4 py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* 타이틀 */}
          <div className="mb-12">
            <h1 className="text-5xl font-black text-gray-900 mb-2 tracking-tight">
              {t('common.ranking') || 'Ranking'}
            </h1>
            <p className="text-gray-500 text-lg">
              {t('common.rankingDescription') || 'Browse the top chess players'}
            </p>
          </div>

          {/* Game Type 선택 */}
          <div className="mb-8 flex gap-4 flex-wrap">
            {GAME_TYPES.map((gameType) => (
              <button
                key={gameType}
                onClick={() => handleGameTypeChange(gameType)}
                className={`px-4 py-3 rounded-lg flex items-center gap-2 font-bold transition-all ${
                  selectedGameType === gameType
                    ? 'bg-blue-100 border-2 border-blue-600 text-blue-600'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                <img src={getGameTypeImage(gameType)} alt={gameType} className="w-6 h-6" />
                {gameType}
              </button>
            ))}
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-4 border-[#2F639D] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500">{t('common.loading') || 'Loading...'}</p>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center text-red-500">
                <p className="text-lg font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* 로그인되지 않은 사용자 */}
          {!loading && !error && !isLoggedInUser && (
            <div className="flex gap-8 mb-12">
              {/* 왼쪽: 로그인 메시지 */}
              <div className="w-80 flex-shrink-0">
                <div className="p-6 bg-gradient-to-br from-[#2F639D] to-[#1e3a5f] border-2 border-[#2F639D] rounded-2xl text-white sticky top-24 text-center">
                  <h2 className="text-xl font-black mb-6">
                    {t('common.yourRanking') || 'YOUR RANKING'}
                  </h2>
                  <div className="space-y-4">
                    <p className="text-sm text-white text-opacity-90 leading-relaxed">
                      {t('ranking.loginPrompt') || '로그인해서 내 랭킹을 확인해보세요!'}
                    </p>
                    <button
                      onClick={handleLogin}
                      className="mx-auto flex items-center gap-3 bg-white text-black font-bold py-3 px-7 rounded-full shadow-lg hover:bg-[#e6e6e6] transition text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <img src={lichessLogoImg} alt="Lichess Logo" className="w-8 h-8" />
                      {t('main.loginWithLichess') || (t('common.login') || 'Login')}
                    </button>
                  </div>
                </div>
              </div>

              {/* 오른쪽: 컴팩트 랭킹 리스트*/}
              <div className="flex-grow space-y-2">
                {users.map((user) => {
                  const tierInfo = getTierWithSubTier(user.rating);
                  const tierColor = tierColorScheme[tierInfo.tier] || tierColorScheme['PAWN'];
                  const tierImage = tierImages[tierInfo.tier] || tierImages['PAWN'];
                  const romanNumeral = ['', 'I', 'II', 'III', 'IV', 'V'][tierInfo.subTier] || '';
                  
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user.id)}
                      className="group cursor-pointer bg-white rounded-xl border-2 border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden"
                      style={{ borderColor: tierColor.borderColor }}
                    >
                      {/* 배너 배경 */}
                      {user.banner_image && (
                        <div 
                          className="absolute inset-0 opacity-20 bg-cover bg-center rounded-xl"
                          style={{ backgroundImage: `url('${user.banner_image}')` }}
                        />
                      )}
                      
                      {/* 등수 */}
                      <div className="flex-shrink-0 w-12 text-center relative z-10">
                        <p className="text-lg font-black" style={{ color: tierColor.mainColor }}>
                          #{user.rank}
                        </p>
                      </div>

                      {/* 프로필 */}
                      <div className="flex items-center gap-3 flex-grow relative z-10">
                        {user.profile_image ? (
                          <img
                            src={user.profile_image}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover border-2 flex-shrink-0"
                            style={{ borderColor: tierColor.mainColor }}
                          />
                        ) : (
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: tierColor.mainColor }}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-grow">
                          <p className="font-bold text-gray-900 text-sm truncate">
                            {user.username}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.title || '-'}
                          </p>
                        </div>
                      </div>

                      {/* 티어 & 레이팅 섹션 */}
                      <div className="flex-shrink-0 bg-white border-2 border-black rounded-lg p-2 flex items-end gap-2 relative z-10">
                        {/* 메인 티어 이미지 & 서브 티어 */}
                        <div className="flex flex-col items-center gap-0.5">
                          <img src={tierImage} alt={tierInfo.tier} className="w-10 h-10 object-contain" />
                          <p className="font-black text-xs leading-none" style={{ color: tierColor.mainColor }}>
                            {romanNumeral}
                          </p>
                        </div>
                        
                        {/* 레이팅 */}
                        <div className="text-right">
                          <p className="text-xs font-black text-black">
                            {user.rating}
                          </p>
                          <p className="text-xs font-semibold text-black">
                            Rating
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 로그인한 사용자의 내 랭킹 섹션 */}
          {!loading && !error && isLoggedInUser && (
            <>

              {/* 하이브리드 레이아웃 (왼쪽: My Ranking, 오른쪽: 컴팩트 리스트) */}
              {isUnrated ? (
                /* 언레이팅 상태 */
                <div className="flex gap-8 mb-12">
                  {/* 왼쪽: My Ranking (언레이팅) */}
                  <div className="w-80 flex-shrink-0">
                    <div className="p-6 bg-gradient-to-br from-amber-400 to-amber-500 border-2 border-amber-400 rounded-2xl text-white sticky top-24 text-center">
                      <h2 className="text-xl font-black mb-6">
                        {t('common.yourRanking') || 'YOUR RANKING'}
                      </h2>
                      <div className="space-y-4">
                        <p className="text-sm text-white text-opacity-90 leading-relaxed">
                          아직 레이팅을 얻지 못했습니다.
                        </p>
                        <p className="text-xs text-white text-opacity-80">
                          더 많은 게임을 진행하여 정식 레이팅을 얻어보세요!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽: 컴팩트 랭킹 리스트*/}
                  <div className="flex-grow space-y-2">
                    {users.map((user) => {
                      const tierInfo = getTierWithSubTier(user.rating);
                      const tierColor = tierColorScheme[tierInfo.tier] || tierColorScheme['PAWN'];
                      const tierImage = tierImages[tierInfo.tier] || tierImages['PAWN'];
                      const romanNumeral = ['', 'I', 'II', 'III', 'IV', 'V'][tierInfo.subTier] || '';
                      
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleUserClick(user.id)}
                          className="group cursor-pointer bg-white rounded-xl border-2 border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-all relative overflow-hidden"
                          style={{ borderColor: tierColor.borderColor }}
                        >
                          {/* 배너 배경 */}
                          {user.banner_image && (
                            <div 
                              className="absolute inset-0 opacity-20 bg-cover bg-center rounded-xl"
                              style={{ backgroundImage: `url('${user.banner_image}')` }}
                            />
                          )}
                          
                          {/* 등수 */}
                          <div className="flex-shrink-0 w-12 text-center relative z-10">
                            <p className="text-lg font-black" style={{ color: tierColor.mainColor }}>
                              #{user.rank}
                            </p>
                          </div>

                          {/* 프로필 */}
                          <div className="flex items-center gap-3 flex-grow relative z-10">
                            {user.profile_image ? (
                              <img
                                src={user.profile_image}
                                alt={user.username}
                                className="w-12 h-12 rounded-full object-cover border-2 flex-shrink-0"
                                style={{ borderColor: tierColor.mainColor }}
                              />
                            ) : (
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                style={{ backgroundColor: tierColor.mainColor }}
                              >
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0 flex-grow">
                              <p className="font-bold text-gray-900 text-sm truncate">
                                {user.username}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.title || '-'}
                              </p>
                            </div>
                          </div>

                          {/* 티어 & 레이팅 섹션 */}
                          <div className="flex-shrink-0 bg-white border-2 border-black rounded-lg p-2 flex items-end gap-2 relative z-10">
                            {/* 메인 티어 이미지 & 서브 티어 */}
                            <div className="flex flex-col items-center gap-0.5">
                              <img src={tierImage} alt={tierInfo.tier} className="w-10 h-10 object-contain" />
                              <p className="font-black text-xs leading-none" style={{ color: tierColor.mainColor }}>
                                {romanNumeral}
                              </p>
                            </div>
                            
                            {/* 레이팅 */}
                            <div className="text-right">
                              <p className="text-xs font-black text-black">
                                {user.rating}
                              </p>
                              <p className="text-xs font-semibold text-black">
                                Rating
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : myRank !== null && myRating !== null ? (
                <div className="flex gap-8 mb-12">
                  {/* 왼쪽: My Ranking (고정) */}
                  <div className="w-80 flex-shrink-0">
                    <div className="p-6 bg-gradient-to-br from-[#2F639D] to-[#1e3a5f] border-2 border-[#2F639D] rounded-2xl text-white sticky top-24">
                      <h2 className="text-xl font-black mb-6">
                        {t('common.yourRanking') || 'YOUR RANKING'}
                      </h2>
                      <div className="space-y-4">
                        {/* 순위 */}
                        <div className="text-center pb-4 border-b border-white border-opacity-20">
                          <p className="text-xs text-gray-300 font-bold mb-2 uppercase">Rank</p>
                          <p className="text-5xl font-black">{myRank}</p>
                        </div>
                        
                        {/* 레이팅 */}
                        <div className="text-center pb-4 border-b border-white border-opacity-20">
                          <p className="text-xs text-gray-300 font-bold mb-2 uppercase">Rating</p>
                          <p className="text-3xl font-black">{myRating}</p>
                        </div>
                        
                        {/* 티어 */}
                        <div className="text-center">
                          <p className="text-xs text-gray-300 font-bold mb-3 uppercase">Tier</p>
                          {(() => {
                            const tierInfo = getTierWithSubTier(myRating);
                            const tierImage = tierImages[tierInfo.tier] || tierImages['PAWN'];
                            const romanNumeral = ['', 'I', 'II', 'III', 'IV', 'V'][tierInfo.subTier] || '';
                            return (
                              <div className="flex justify-center items-start gap-2">
                                <img src={tierImage} alt={tierInfo.tier} className="w-10 h-10 object-contain" />
                                <div className="text-3xl font-black">{romanNumeral}</div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽: 컴팩트 랭킹 리스트 */}
                  <div className="flex-grow space-y-2">
                    {users.map((user) => {
                      const tierInfo = getTierWithSubTier(user.rating);
                      const tierColor = tierColorScheme[tierInfo.tier] || tierColorScheme['PAWN'];
                      const tierImage = tierImages[tierInfo.tier] || tierImages['PAWN'];
                      const romanNumeral = ['', 'I', 'II', 'III', 'IV', 'V'][tierInfo.subTier] || '';
                      
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleUserClick(user.id)}
                          className="group cursor-pointer bg-white rounded-xl border-2 border-gray-200 p-4 flex items-center gap-4 hover:shadow-md transition-all"
                          style={{ borderColor: tierColor.borderColor }}
                        >
                          {/* 등수 */}
                          <div className="flex-shrink-0 w-12 text-center">
                            <p className="text-lg font-black" style={{ color: tierColor.mainColor }}>
                              #{user.rank}
                            </p>
                          </div>

                          {/* 프로필 */}
                          <div className="flex items-center gap-3 flex-grow">
                            {user.profile_image ? (
                              <img
                                src={user.profile_image}
                                alt={user.username}
                                className="w-12 h-12 rounded-full object-cover border-2 flex-shrink-0"
                                style={{ borderColor: tierColor.mainColor }}
                              />
                            ) : (
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                style={{ backgroundColor: tierColor.mainColor }}
                              >
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">
                                {user.username}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.description || '-'}
                              </p>
                            </div>
                          </div>

                          {/* 티어 */}
                          <div className="flex-shrink-0 flex items-center gap-1">
                            <img src={tierImage} alt={tierInfo.tier} className="w-8 h-8 object-contain" />
                            <p className="font-black text-lg" style={{ color: tierColor.mainColor }}>
                              {romanNumeral}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* 페이지네이션 - 오른쪽 정렬 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 mb-12">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
                  >
                    ←
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        const distance = Math.abs(page - currentPage);
                        return distance <= 1 || page === 1 || page === totalPages;
                      })
                      .map((page, idx, arr) => (
                        <div key={page}>
                          {idx > 0 && arr[idx - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400 text-sm">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded-lg font-semibold transition text-sm ${
                              currentPage === page
                                ? 'bg-[#2F639D] text-white'
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}

          {/* 데이터 없음 */}
          {!loading && !error && users.length === 0 && isLoggedInUser && (
            <div className="text-center py-12">
              <p className="text-gray-600">
                {t('common.noData') || 'No ranking data available'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
