import type { UserPerfResponse } from "../api/userService";

interface TierSectionProps {
    userPerf: UserPerfResponse | null;
    loadingPerf: boolean;
    tierColorScheme: { [key: string]: { mainColor: string; lightBg: string; darkBg: string; borderColor: string; lightText: string; darkText: string } };
    promotionThresholds: { [key: string]: number };
    convertSubTierToRoman: (subTier: string) => string;
}

const getRatingTier = (rating: number, thresholds: Record<string, number>): string => {
  const sortedTiers = Object.entries(thresholds).sort(([, a], [, b]) => b - a);
  
  for (const [tier, minRating] of sortedTiers) {
    if (rating >= minRating) {
      return tier;
    }
  }
  
  return 'PAWN';
};

const getTierWithSubTier = (rating: number, thresholds: Record<string, number>): string => {
  const tier = getRatingTier(rating, thresholds);
  
  // 각 티어의 레이팅 범위 및 서브티어 기준
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
      max: 2700,
      subTiers: {
        5: [2101, 2220],
        4: [2221, 2340],
        3: [2341, 2460],
        2: [2461, 2580],
        1: [2581, 2700]
      }
    }
  };
  
  const tierData = tierRanges[tier];
  if (!tierData) return `${tier}`;
  
  // 현재 레이팅에 해당하는 서브티어 찾기
  let currentSubTier = 5;
  for (const [subTier, [min, max]] of Object.entries(tierData.subTiers)) {
    if (rating >= min && rating <= max) {
      currentSubTier = parseInt(subTier);
      break;
    }
  }
  
  const romanMap: { [key: string]: string } = {
    '1': 'I',
    '2': 'II',
    '3': 'III',
    '4': 'IV',
    '5': 'V'
  };
  
  return `${tier} ${romanMap[currentSubTier]}`;
};

export const TierSection = ({
    userPerf,
    loadingPerf,
    tierColorScheme,
    promotionThresholds,
    convertSubTierToRoman
}: TierSectionProps) => {
    const calculatePromotionProgress = (rating: number, currentTier: string) => {
        const tiers = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'];
        const currentTierIndex = tiers.indexOf(currentTier);
        
        const currentThreshold = promotionThresholds[currentTier] || 0;
        const nextTierIndex = Math.min(currentTierIndex + 1, tiers.length - 1);
        const nextTierThreshold = promotionThresholds[tiers[nextTierIndex]];
        
        const prevTierIndex = Math.max(currentTierIndex - 1, 0);
        const prevTierThreshold = currentTierIndex === 0 ? 0 : promotionThresholds[tiers[prevTierIndex]];
        
        const tierRange = currentThreshold - prevTierThreshold;
        const ratingInCurrentTier = rating - prevTierThreshold;
        
        // 현재 서브티어 계산 (1=I, 2=II, 3=III, 4=IV, 5=V)
        const subTierRange = tierRange / 5;
        const progressInTier = (ratingInCurrentTier / tierRange) * 100;
        let currentSubTier = 5;
        if (progressInTier >= 80) currentSubTier = 1;
        else if (progressInTier >= 60) currentSubTier = 2;
        else if (progressInTier >= 40) currentSubTier = 3;
        else if (progressInTier >= 20) currentSubTier = 4;
        else currentSubTier = 5;
        
        // 다음 서브티어 결정
        let nextSubTier = currentSubTier > 1 ? currentSubTier - 1 : 1;
        
        if (currentSubTier === 1) {
            // 현재가 I이면 다음 메인 티어의 I을 목표
            nextSubTier = 1;
            const nextTierRating = nextTierThreshold;
            const remainingRating = Math.max(nextTierRating - rating, 0);
            const nextDisplayTier = tiers[nextTierIndex];
            
            // 다음 티어까지의 진행도 (0~100%)
            const tierToNextRange = nextTierThreshold - currentThreshold;
            const progressToNext = ((rating - currentThreshold) / tierToNextRange) * 100;
            
            return { 
                nextTierThreshold, 
                remainingRating, 
                percentage: Math.min(Math.max(progressToNext, 0), 100),
                currentThreshold, 
                nextTier: nextDisplayTier,
                nextSubTier: 1,
                currentSubTier
            };
        } else {
            // 같은 메인 티어 내에서 다음 서브티어 계산
            const nextSubTierThreshold = prevTierThreshold + (subTierRange * (5 - nextSubTier + 1));
            const remainingRating = Math.max(nextSubTierThreshold - rating, 0);
            
            // 현재 서브티어 내에서의 진행도
            const currentSubTierMin = prevTierThreshold + (subTierRange * (5 - currentSubTier + 1));
            const currentSubTierRange = subTierRange;
            const progressInSubTier = ((rating - currentSubTierMin) / currentSubTierRange) * 100;
            
            return { 
                nextTierThreshold: nextSubTierThreshold,
                remainingRating, 
                percentage: Math.min(Math.max(progressInSubTier, 0), 100),
                currentThreshold, 
                nextTier: currentTier,
                nextSubTier,
                currentSubTier
            };
        }
    };

    if (loadingPerf) {
        return (
            <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                <div className="flex items-center justify-center py-12 bg-white border border-gray-200 rounded-lg">
                    <p className="text-gray-500 text-sm">티어 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (!userPerf) {
        return (
            <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                <div className="flex items-center justify-center py-12 bg-white border border-gray-200 rounded-lg">
                    <p className="text-gray-500 text-sm">티어 정보를 불러올 수 없습니다.</p>
                </div>
            </div>
        );
    }

    const mainTier = getRatingTier(userPerf.rating, promotionThresholds);
    const tierWithSubTier = getTierWithSubTier(userPerf.rating, promotionThresholds);
    const isUncertain = userPerf.uncertain;
    const ratedGames = userPerf.rated || 0;
    const remainingGamesToMeasure = Math.max(50 - ratedGames, 0);
    
    const tierNameMap: { [key: string]: string } = {
        'PAWN': 'pawn.png',
        'KNIGHT': 'knight.png',
        'BISHOP': 'vishop.png',
        'ROOK': 'rook.png',
        'QUEEN': 'queen.png',
        'KING': 'king.png'
    };
    const fileName = isUncertain ? 'unrated.png' : (tierNameMap[mainTier] || 'pawn.png');
    const tierImageSrc = new URL(`../assets/images/tier/${fileName}`, import.meta.url).href;

    const { remainingRating, percentage, nextTier, nextSubTier, currentSubTier } = calculatePromotionProgress(userPerf.rating, mainTier);
    
    const romanMap: { [key: string]: string } = {
        '1': 'I',
        '2': 'II',
        '3': 'III',
        '4': 'IV',
        '5': 'V'
    };

    return (
        <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
            <div className="bg-white border-2 border-gray-300 rounded-xl p-8 card-section card-hover shadow-lg">
                {/* 티어 이미지 + 현재 티어 정보 + 최고/최저 레이팅 (수평) */}
                <div className="flex items-center gap-8 mb-8">
                    {/* 티어 이미지 */}
                    <div 
                        className={`flex-shrink-0 rounded-xl flex items-center justify-center shadow-lg ${
                            isUncertain ? 'w-48 h-48' : 'w-40 h-40'
                        }`}
                        style={{ backgroundColor: isUncertain ? '#d1d5db' : tierColorScheme[mainTier]?.mainColor }}
                    >
                        <img
                            src={tierImageSrc}
                            alt={mainTier}
                            className={`object-contain ${
                                isUncertain ? 'w-40 h-40' : 'w-32 h-32'
                            }`}
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>

                    {/* 현재 티어 정보 (중앙) */}
                    <div className="flex-1">
                        {isUncertain ? (
                            // Uncertain 상태일 때
                            <>
                                <div className="flex items-baseline gap-3 mb-4">
                                    <p className="text-6xl font-black" style={{ color: '#999' }}>
                                        UNRATED
                                    </p>
                                    <p className="text-3xl font-bold" style={{ color: '#999' }}>
                                        ?
                                    </p>
                                </div>
                                <div className="text-xs font-bold opacity-60" style={{ color: '#999' }}>
                                    {userPerf.rating} Rating
                                </div>
                            </>
                        ) : (
                            // 정상 상태일 때
                            <>
                                <div className="flex items-baseline gap-3 mb-4">
                                    <p className="text-6xl font-black" style={{ color: isUncertain ? '#999' : tierColorScheme[mainTier]?.darkText }}>
                                        {mainTier.charAt(0) + mainTier.slice(1).toLowerCase()}
                                    </p>
                                    <p className="text-3xl font-bold" style={{ color: isUncertain ? '#999' : tierColorScheme[mainTier]?.darkText, opacity: 0.7 }}>
                                        {tierWithSubTier.split(' ')[1]}
                                    </p>
                                </div>
                                
                                {/* 레이팅을 아주 작게 표시 */}
                                <div className="text-xs font-bold opacity-60" style={{ color: isUncertain ? '#999' : tierColorScheme[mainTier]?.darkText }}>
                                    {userPerf.rating} Rating
                                </div>
                            </>
                        )}
                    </div>

                    {/* 최고/최저 레이팅 (오른쪽) */}
                    {!isUncertain && (
                        <div className="flex-shrink-0 flex gap-4">
                            {/* 최고 레이팅 */}
                            <div className="text-center">
                                <div className="text-xs font-bold text-blue-600 uppercase mb-2">최고</div>
                                <div className="text-3xl font-black text-blue-700">{userPerf.highestRating}</div>
                                <div className="text-xs text-blue-600 font-semibold mt-1">
                                    {mainTier}
                                </div>
                            </div>

                            {/* 구분선 */}
                            <div className="w-px bg-gray-300"></div>

                            {/* 최저 레이팅 */}
                            <div className="text-center">
                                <div className="text-xs font-bold text-red-600 uppercase mb-2">최저</div>
                                <div className="text-3xl font-black text-red-700">{userPerf.lowestRating}</div>
                                <div className="text-xs text-red-600 font-semibold mt-1">
                                    {mainTier}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 프로모션 프로그래스 바 - 가장 하단에 길게 */}
                <div className="w-full">
                    {isUncertain ? (
                        // Uncertain 상태일 때 - 레이팅 게임 프로그래스
                        <>
                            <div className="mb-2 flex items-center justify-between">
                                <div className="text-sm font-bold" style={{ color: '#999' }}>
                                    티어 측정까지 레이팅게임 <span className="font-black">{remainingGamesToMeasure}</span> 게임 남음
                                </div>
                            </div>
                            <div className="flex items-center w-full">
                                <div className="flex-1">
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                        <div 
                                            className="h-full transition-all duration-500 rounded-full bg-gray-400" 
                                            style={{
                                                width: `${(ratedGames / 50) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="ml-3 text-xs font-bold text-gray-600">
                                    {ratedGames}/50
                                </div>
                            </div>
                        </>
                    ) : (
                        // 정상 상태일 때 - 티어 프로모션 프로그래스
                        <>
                            <div className="mb-2 flex items-center justify-between">
                                <div className="text-sm font-bold flex items-center gap-2" style={{ color: isUncertain ? '#666' : tierColorScheme[mainTier]?.darkText }}>
                                    <span>{mainTier.charAt(0) + mainTier.slice(1).toLowerCase()} {convertSubTierToRoman(String(currentSubTier))}</span>
                                    <span>→</span>
                                    <span style={{ color: isUncertain ? '#888' : tierColorScheme[nextTier]?.mainColor }} className="font-black">
                                        {nextTier.charAt(0) + nextTier.slice(1).toLowerCase()} {romanMap[nextSubTier]}
                                    </span>
                                    <span>프로모션까지</span>
                                    <span>{remainingRating} Rating</span>
                                </div>
                            </div>
                            <div className="flex items-center w-full">
                                {/* 프로그래스 바 */}
                                <div className="flex-1">
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                        <div 
                                            className="h-full transition-all duration-500 rounded-full" 
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: isUncertain ? '#9ca3af' : tierColorScheme[mainTier]?.mainColor
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* 게임 통계 정보 섹션 */}
                {!isUncertain && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* 연승/연패 */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-xs font-bold text-gray-500 mb-1">최대 연승</div>
                                <div className="text-2xl font-black text-green-600">
                                    {userPerf.maxStreak}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-xs font-bold text-gray-500 mb-1">최대 연패</div>
                                <div className="text-2xl font-black text-red-600">
                                    {userPerf.maxLossStreak}
                                </div>
                            </div>

                            {/* 전체 게임 */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-xs font-bold text-gray-500 mb-1">전체 게임</div>
                                <div className="text-2xl font-black text-gray-700">
                                    {userPerf.all}
                                </div>
                            </div>

                            {/* 레이팅 게임 */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-xs font-bold text-gray-500 mb-1">레이팅 게임</div>
                                <div className="text-2xl font-black text-blue-600">
                                    {userPerf.rated}
                                </div>
                            </div>

                            {/* 평균 상대 레이팅 */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-xs font-bold text-gray-500 mb-1">상대 평균 레이팅</div>
                                <div className="text-2xl font-black text-purple-600">
                                    {Math.round(userPerf.opAvg)}
                                </div>
                            </div>

                            {/* 토너먼트 게임 */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="text-xs font-bold text-gray-500 mb-1">토너먼트 게임</div>
                                <div className="text-2xl font-black text-orange-600">
                                    {userPerf.tour}
                                </div>
                            </div>
                        </div>

                        {/* 상세 통계 */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-center">
                                <div className="bg-green-50 p-3 rounded">
                                    <div className="text-xs font-bold text-gray-600">승리</div>
                                    <div className="text-xl font-black text-green-600">{userPerf.wins}</div>
                                </div>
                                <div className="bg-red-50 p-3 rounded">
                                    <div className="text-xs font-bold text-gray-600">패배</div>
                                    <div className="text-xl font-black text-red-600">{userPerf.losses}</div>
                                </div>
                                <div className="bg-gray-100 p-3 rounded">
                                    <div className="text-xs font-bold text-gray-600">무승부</div>
                                    <div className="text-xl font-black text-gray-600">{userPerf.draws}</div>
                                </div>
                                <div className="bg-yellow-50 p-3 rounded">
                                    <div className="text-xs font-bold text-gray-600">광폭</div>
                                    <div className="text-xl font-black text-yellow-600">{userPerf.berserk}</div>
                                </div>
                                <div className="bg-blue-50 p-3 rounded">
                                    <div className="text-xs font-bold text-gray-600">연결 끊김</div>
                                    <div className="text-xl font-black text-blue-600">{userPerf.disconnects}</div>
                                </div>
                                <div className="bg-purple-50 p-3 rounded">
                                    <div className="text-xs font-bold text-gray-600">총 시간</div>
                                    <div className="text-xl font-black text-purple-600">{Math.floor(userPerf.seconds / 3600)}h</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
