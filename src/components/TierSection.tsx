import type { UserPerfResponse } from "../api/userService";
import { useLanguage } from "../context/LanguageContext";

interface TierSectionProps {
    userPerf: UserPerfResponse | null;
    loadingPerf: boolean;
    tierColorScheme: Record<string, any>;
    promotionThresholds: { [key: string]: number };
    convertSubTierToRoman: (subTier: string) => string;
    platform?: 'LICHESS' | 'CHESSCOM';
}

const getRatingTier = (rating: number, thresholds: Record<string, number>): string => {
    const sorted = Object.entries(thresholds).sort(([, a], [, b]) => b - a);
    for (const [tier, min] of sorted) {
        if (rating >= min) return tier;
    }
    return 'PAWN';
};

const getTierWithSubTier = (rating: number, thresholds: Record<string, number>, platform?: 'LICHESS' | 'CHESSCOM'): string => {
    const tier = getRatingTier(rating, thresholds);

    const lichessTierRanges: Record<string, { subTiers: Record<number, [number, number]> }> = {
        PAWN:   { subTiers: { 5:[400,500],  4:[501,600],  3:[601,700],  2:[701,800],  1:[801,900]  } },
        KNIGHT: { subTiers: { 5:[901,960],  4:[961,1020], 3:[1021,1080],2:[1081,1140],1:[1141,1200]} },
        BISHOP: { subTiers: { 5:[1201,1260],4:[1261,1320],3:[1321,1380],2:[1381,1440],1:[1441,1500]} },
        ROOK:   { subTiers: { 5:[1501,1560],4:[1561,1620],3:[1621,1680],2:[1681,1740],1:[1741,1800]} },
        QUEEN:  { subTiers: { 5:[1801,1860],4:[1861,1920],3:[1921,1980],2:[1981,2040],1:[2041,2100]} },
        KING:   { subTiers: { 5:[2101,2220],4:[2221,2340],3:[2341,2460],2:[2461,2580],1:[2581,2700]} },
    };

    const chesscomTierRanges: Record<string, { subTiers: Record<number, [number, number]> }> = {
        PAWN:   { subTiers: { 5:[100,220],   4:[221,340],  3:[341,460],  2:[461,580],  1:[581,700]   } },
        KNIGHT: { subTiers: { 5:[701,780],   4:[781,860],  3:[861,940],  2:[941,1020], 1:[1021,1100] } },
        BISHOP: { subTiers: { 5:[1101,1180], 4:[1181,1260],3:[1261,1340],2:[1341,1420],1:[1421,1500] } },
        ROOK:   { subTiers: { 5:[1501,1560],4:[1561,1620],3:[1621,1680],2:[1681,1740],1:[1741,1800] } },
        QUEEN:  { subTiers: { 5:[1801,1880],4:[1881,1960],3:[1961,2040],2:[2041,2120],1:[2121,2200] } },
        KING:   { subTiers: { 5:[2201,2320],4:[2321,2440],3:[2441,2560],2:[2561,2680],1:[2681,2800] } },
    };

    const tierRanges = platform === 'CHESSCOM' ? chesscomTierRanges : lichessTierRanges;
    const roman: Record<string, string> = { '1':'I','2':'II','3':'III','4':'IV','5':'V' };
    const data = tierRanges[tier];
    if (!data) return tier;
    let sub = 5;
    for (const [s, [mn, mx]] of Object.entries(data.subTiers)) {
        if (rating >= mn && rating <= mx) { sub = parseInt(s); break; }
    }
    return `${tier} ${roman[sub]}`;
};

// 다음 레벨 계산 함수
const getNextLevel = (currentRating: number, currentTier: string, currentSub: string, tierRanges: Record<string, any>) => {
    const tierOrder = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'];
    const tierIndex = tierOrder.indexOf(currentTier);
    const subOrder = [5, 4, 3, 2, 1];
    const currentSubNum = parseInt(currentSub === 'I' ? '1' : currentSub === 'II' ? '2' : currentSub === 'III' ? '3' : currentSub === 'IV' ? '4' : '5');

    let nextTier = currentTier;
    let nextSub = currentSub;
    let nextMin = 0;

    if (currentSubNum === 1) {
        // 현재 메인 티어의 I 단계 → 다음 메인 티어의 V 단계
        if (tierIndex < tierOrder.length - 1) {
            nextTier = tierOrder[tierIndex + 1];
            nextSub = 'V';
            nextMin = tierRanges[nextTier].subTiers[5][0];
        }
    } else {
        // 같은 메인 티어 내에서 다음 서브 단계로
        const nextSubNum = currentSubNum - 1;
        const romanConvert: Record<number, string> = { 5: 'V', 4: 'IV', 3: 'III', 2: 'II', 1: 'I' };
        nextSub = romanConvert[nextSubNum];
        nextMin = tierRanges[currentTier].subTiers[nextSubNum][0];
    }

    return { nextTier, nextSub, nextMin };
};

export const TierSection = ({
    userPerf,
    loadingPerf,
    promotionThresholds,
    tierColorScheme,
    platform,
}: TierSectionProps) => {
    const { t, language } = useLanguage();

    if (loadingPerf) {
        return (
            <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
                <div className="flex items-center justify-center py-12 bg-white/4 border border-white/8 rounded-xl">
                    <p className="text-white/35 text-sm">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (!userPerf) {
        return (
            <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
                <div className="flex items-center justify-center py-12 bg-white/4 border border-white/8 rounded-xl">
                    <p className="text-white/35 text-sm">{t('profile.noRatingData')}</p>
                </div>
            </div>
        );
    }

    const mainTier = getRatingTier(userPerf.rating, promotionThresholds);
    const tierWithSubTier = getTierWithSubTier(userPerf.rating, promotionThresholds, platform);

    // Lichess 티어 범위
    const lichessTierRanges: Record<string, any> = {
        PAWN:   { subTiers: { 5:[400,500],  4:[501,600],  3:[601,700],  2:[701,800],  1:[801,900]  } },
        KNIGHT: { subTiers: { 5:[901,960],  4:[961,1020], 3:[1021,1080],2:[1081,1140],1:[1141,1200]} },
        BISHOP: { subTiers: { 5:[1201,1260],4:[1261,1320],3:[1321,1380],2:[1381,1440],1:[1441,1500]} },
        ROOK:   { subTiers: { 5:[1501,1560],4:[1561,1620],3:[1621,1680],2:[1681,1740],1:[1741,1800]} },
        QUEEN:  { subTiers: { 5:[1801,1860],4:[1861,1920],3:[1921,1980],2:[1981,2040],1:[2041,2100]} },
        KING:   { subTiers: { 5:[2101,2220],4:[2221,2340],3:[2341,2460],2:[2461,2580],1:[2581,2700]} },
    };

    // Chess.com 티어 범위
    const chesscomTierRanges: Record<string, any> = {
        PAWN:   { subTiers: { 5:[100,220],   4:[221,340],  3:[341,460],  2:[461,580],  1:[581,700]   } },
        KNIGHT: { subTiers: { 5:[701,780],   4:[781,860],  3:[861,940],  2:[941,1020], 1:[1021,1100] } },
        BISHOP: { subTiers: { 5:[1101,1180], 4:[1181,1260],3:[1261,1340],2:[1341,1420],1:[1421,1500] } },
        ROOK:   { subTiers: { 5:[1501,1560],4:[1561,1620],3:[1621,1680],2:[1681,1740],1:[1741,1800] } },
        QUEEN:  { subTiers: { 5:[1801,1880],4:[1881,1960],3:[1961,2040],2:[2041,2120],1:[2121,2200] } },
        KING:   { subTiers: { 5:[2201,2320],4:[2321,2440],3:[2441,2560],2:[2561,2680],1:[2681,2800] } },
    };

    // 플랫폼에 따라 다른 tierRanges 선택
    const tierRanges = platform === 'CHESSCOM' ? chesscomTierRanges : lichessTierRanges;

    const parts = tierWithSubTier.split(' ');
    const currentSub = parts[1] || 'V';

    const { nextTier, nextSub, nextMin } = getNextLevel(userPerf.rating, mainTier, currentSub, tierRanges);

    const remaining = Math.max(nextMin - userPerf.rating, 0);
    const currentLevelData = tierRanges[mainTier].subTiers[parseInt(currentSub === 'I' ? '1' : currentSub === 'II' ? '2' : currentSub === 'III' ? '3' : currentSub === 'IV' ? '4' : '5')];
    const levelRange = currentLevelData[1] - currentLevelData[0];
    const currentProgress = userPerf.rating - currentLevelData[0];
    const pct = Math.min(Math.max((currentProgress / levelRange) * 100, 0), 100);

    const tierNameMap: Record<string, string> = {
        PAWN: 'pawn.png', KNIGHT: 'knight.png', BISHOP: 'vishop.png',
        ROOK: 'rook.png', QUEEN: 'queen.png', KING: 'king.png',
    };
    const tierImageSrc = new URL(`../assets/images/tier/${tierNameMap[mainTier] || 'pawn.png'}`, import.meta.url).href;

    const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

    // 현재 티어의 색상 스키마 가져오기
    const tierColors = tierColorScheme[mainTier] || tierColorScheme['KING'];

    return (
        <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
            <div
                className="rounded-2xl p-5 md:p-8 border-2 backdrop-blur-sm transition-all duration-300 shadow-lg"
                style={{
                    backgroundColor: tierColors.darkBg,
                    borderColor: tierColors.borderColor,
                }}
            >
                {/* Tier info row */}
                <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8 mb-8">
                    {/* Tier image */}
                    <div
                        className="flex-shrink-0 w-28 h-28 md:w-36 md:h-36 mx-auto md:mx-0 rounded-2xl border-2 flex items-center justify-center shadow-md"
                        style={{
                            backgroundColor: tierColors.lightBg,
                            borderColor: tierColors.borderColor,
                        }}
                    >
                        <img
                            src={tierImageSrc}
                            alt={mainTier}
                            className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-lg"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>

                    {/* Rating + level */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-3 mb-3 justify-center md:justify-start">
                            <p
                                className="text-4xl md:text-6xl font-black drop-shadow-lg"
                                style={{ color: tierColors.darkText }}
                            >
                                {cap(mainTier)}
                            </p>
                            <p
                                className="text-2xl md:text-3xl font-bold"
                                style={{ color: tierColors.lightText }}
                            >
                                {currentSub}
                            </p>
                        </div>
                        <p className="text-sm font-medium" style={{ color: tierColors.lightText }}>
                            {userPerf.rating} Rating
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between text-xs font-semibold mb-3" style={{ color: tierColors.lightText }}>
                        <span>{cap(mainTier)} {currentSub} → {cap(nextTier)} {nextSub}</span>
                        <span>{remaining} {language === 'KR' ? '레이팅 남음' : 'rating left'}</span>
                    </div>
                    <div
                        className="w-full rounded-full h-3 overflow-hidden shadow-inner"
                        style={{ backgroundColor: tierColors.lightBg }}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-500 shadow-lg"
                            style={{
                                width: `${pct}%`,
                                backgroundColor: tierColors.mainColor,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
