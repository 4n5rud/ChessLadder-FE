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

type TierRanges = Record<string, { subTiers: Record<number, [number, number]> }>;

const LICHESS_TIER_RANGES: TierRanges = {
    PAWN:   { subTiers: { 5:[400,500],   4:[501,600],  3:[601,700],  2:[701,800],  1:[801,900]   } },
    KNIGHT: { subTiers: { 5:[901,960],   4:[961,1020], 3:[1021,1080],2:[1081,1140],1:[1141,1200] } },
    BISHOP: { subTiers: { 5:[1201,1260], 4:[1261,1320],3:[1321,1380],2:[1381,1440],1:[1441,1500] } },
    ROOK:   { subTiers: { 5:[1501,1560], 4:[1561,1620],3:[1621,1680],2:[1681,1740],1:[1741,1800] } },
    QUEEN:  { subTiers: { 5:[1801,1860], 4:[1861,1920],3:[1921,1980],2:[1981,2040],1:[2041,2100] } },
    KING:   { subTiers: { 5:[2101,2220], 4:[2221,2340],3:[2341,2460],2:[2461,2580],1:[2581,2700] } },
};

const CHESSCOM_TIER_RANGES: TierRanges = {
    PAWN:   { subTiers: { 5:[100,220],   4:[221,340],  3:[341,460],  2:[461,580],  1:[581,700]   } },
    KNIGHT: { subTiers: { 5:[701,780],   4:[781,860],  3:[861,940],  2:[941,1020], 1:[1021,1100] } },
    BISHOP: { subTiers: { 5:[1101,1180], 4:[1181,1260],3:[1261,1340],2:[1341,1420],1:[1421,1500] } },
    ROOK:   { subTiers: { 5:[1501,1560], 4:[1561,1620],3:[1621,1680],2:[1681,1740],1:[1741,1800] } },
    QUEEN:  { subTiers: { 5:[1801,1880], 4:[1881,1960],3:[1961,2040],2:[2041,2120],1:[2121,2200] } },
    KING:   { subTiers: { 5:[2201,2320], 4:[2321,2440],3:[2441,2560],2:[2561,2680],1:[2681,2800] } },
};

const TIER_ORDER = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'] as const;
const SUB_ROMAN: Record<number, string> = { 1:'I', 2:'II', 3:'III', 4:'IV', 5:'V' };

interface TierInfo {
    tier: string;
    subNum: number;
    subRoman: string;
    levelMin: number;
    levelMax: number;
}

const getPlatformTierInfo = (rating: number, platform?: 'LICHESS' | 'CHESSCOM'): TierInfo => {
    const ranges = platform === 'CHESSCOM' ? CHESSCOM_TIER_RANGES : LICHESS_TIER_RANGES;

    for (const tier of TIER_ORDER) {
        const data = ranges[tier];
        if (!data) continue;
        for (let sub = 1; sub <= 5; sub++) {
            const range = data.subTiers[sub];
            if (!range) continue;
            const [mn, mx] = range;
            if (rating >= mn && rating <= mx) {
                return { tier, subNum: sub, subRoman: SUB_ROMAN[sub], levelMin: mn, levelMax: mx };
            }
        }
    }

    // Above max → clamp to KING I at 100%
    const kingData = ranges['KING']?.subTiers[1];
    if (kingData && rating > kingData[1]) {
        return { tier: 'KING', subNum: 1, subRoman: 'I', levelMin: kingData[0], levelMax: kingData[1] };
    }
    // Below minimum → PAWN V
    const pawnV = ranges['PAWN']?.subTiers[5];
    return { tier: 'PAWN', subNum: 5, subRoman: 'V', levelMin: pawnV?.[0] ?? 0, levelMax: pawnV?.[1] ?? 100 };
};


// 다음 레벨 계산 함수
const getNextLevel = (_currentRating: number, currentTier: string, currentSub: string, tierRanges: Record<string, any>) => {
    const tierOrder = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'];
    const tierIndex = tierOrder.indexOf(currentTier);
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
    promotionThresholds: _promotionThresholds,
    tierColorScheme,
    platform,
}: TierSectionProps) => {
    const { t, language } = useLanguage();

    const opaque = (rgba: string) => rgba.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[^)]+\)/, 'rgb($1,$2,$3)');

    if (loadingPerf) {
        return (
            <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
                <div className="flex flex-col items-center justify-center gap-3 py-16 bg-[#0b1220] border border-white/10 rounded-2xl">
                    <div className="flex gap-1 text-4xl opacity-10 select-none">
                        <span>♟</span><span>♞</span><span>♝</span><span>♜</span><span>♛</span><span>♚</span>
                    </div>
                    <p className="text-white/20 text-xs">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (!userPerf) {
        return (
            <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
                <div className="flex flex-col items-center justify-center gap-4 py-16 bg-[#070d1a] border border-white/8 rounded-2xl">
                    <div className="flex gap-1 text-5xl opacity-15 select-none">
                        <span>♟</span><span>♞</span><span>♝</span><span>♜</span><span>♛</span><span>♚</span>
                    </div>
                    <p className="text-white/30 text-sm">
                        {language === 'KR' ? '레이팅 데이터 없음' : 'No rating data'}
                    </p>
                    <p className="text-white/15 text-xs">
                        {language === 'KR' ? '이 타임 컨트롤로 플레이된 게임이 없습니다' : 'No games played with this time control'}
                    </p>
                </div>
            </div>
        );
    }

    const tierInfo = getPlatformTierInfo(userPerf.rating, platform);
    const { tier: mainTier, subRoman: currentSub, levelMin, levelMax } = tierInfo;

    const tierRanges = platform === 'CHESSCOM' ? CHESSCOM_TIER_RANGES : LICHESS_TIER_RANGES;

    const { nextTier, nextSub, nextMin } = getNextLevel(userPerf.rating, mainTier, currentSub, tierRanges);

    const remaining = Math.max(nextMin - userPerf.rating, 0);
    const levelRange = levelMax - levelMin;
    const currentProgress = userPerf.rating - levelMin;
    const pct = Math.min(Math.max((currentProgress / levelRange) * 100, 0), 100);

    const tierNameMap: Record<string, string> = {
        PAWN: 'pawn.png', KNIGHT: 'knight.png', BISHOP: 'vishop.png',
        ROOK: 'rook.png', QUEEN: 'queen.png', KING: 'king.png',
    };
    const tierImageSrc = new URL(`../assets/images/tier/${tierNameMap[mainTier] || 'pawn.png'}`, import.meta.url).href;

    const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

    // 현재 티어의 색상 스키마 가져오기
    const tierColors = tierColorScheme[mainTier] || tierColorScheme['KING'];
    const mainSolid = opaque(tierColors.mainColor);
    const textSolid = opaque(tierColors.darkText);
    const softSolid = opaque(tierColors.lightText);

    return (
        <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
            <div
                className="relative overflow-hidden rounded-2xl p-5 md:p-8 border shadow-lg"
                style={{
                    background: 'linear-gradient(160deg, #0a1222 0%, #0e172b 58%, #0a1222 100%)',
                    borderColor: 'rgba(255,255,255,0.12)',
                    boxShadow: '0 24px 50px rgba(0,0,0,0.42)',
                }}
            >
                {/* Top accent */}
                <div
                    className="absolute left-4 right-4 top-0 h-[3px] rounded-b-full pointer-events-none"
                    style={{ background: `linear-gradient(90deg, ${mainSolid}, ${textSolid})` }}
                />

                {/* Base gradient layer */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at 14% 8%, ${softSolid}16, transparent 40%), linear-gradient(145deg, #0d1527 0%, #0b1324 52%, #0a1222 100%)`,
                    }}
                />
                {/* Aurora accents */}
                <div
                    className="absolute -top-16 -right-10 w-64 h-64 rounded-full pointer-events-none"
                    style={{
                        background: mainSolid,
                        opacity: 0.07,
                        filter: 'blur(72px)',
                    }}
                />
                <div
                    className="absolute -bottom-24 -left-12 w-72 h-72 rounded-full pointer-events-none"
                    style={{
                        background: textSolid,
                        opacity: 0.04,
                        filter: 'blur(82px)',
                    }}
                />

                <div className="relative z-10">
                {/* Tier info row */}
                <div className="flex flex-col md:flex-row md:items-center gap-5 md:gap-8 mb-8">
                    {/* Tier image */}
                    <div
                        className="flex-shrink-0 w-28 h-28 md:w-36 md:h-36 mx-auto md:mx-0 rounded-2xl border-2 flex items-center justify-center shadow-md"
                        style={{
                            background: 'linear-gradient(145deg, #111b31 0%, #0d162a 100%)',
                            borderColor: `${mainSolid}66`,
                            boxShadow: `inset 0 0 0 1px ${mainSolid}26`,
                        }}
                    >
                        <img
                            src={tierImageSrc}
                            alt={mainTier}
                            className="w-20 h-20 md:w-28 md:h-28 object-contain"
                            style={{ filter: `drop-shadow(0 0 5px ${mainSolid})` }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>

                    {/* Rating + level */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4 mb-3 justify-center md:justify-start">
                            <p
                                className="text-4xl md:text-6xl font-black drop-shadow-lg"
                                style={{ color: textSolid }}
                            >
                                {cap(mainTier)}
                            </p>
                            <span
                                className="inline-flex items-center justify-center min-w-[44px] md:min-w-[56px] h-9 md:h-11 px-3 rounded-xl font-black text-2xl md:text-3xl leading-none"
                                style={{
                                    color: textSolid,
                                    background: `${mainSolid}22`,
                                    border: `1px solid ${mainSolid}66`,
                                    boxShadow: `inset 0 0 0 1px ${mainSolid}2a, 0 0 10px ${mainSolid}33`,
                                }}
                            >
                                {currentSub}
                            </span>
                        </div>
                        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.72)' }}>
                            {userPerf.rating} Rating
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-between text-xs font-semibold mb-3" style={{ color: 'rgba(255,255,255,0.72)' }}>
                        <span>{cap(mainTier)} {currentSub} → {cap(nextTier)} {nextSub}</span>
                        <span>{remaining} {language === 'KR' ? '레이팅 남음' : 'rating left'}</span>
                    </div>
                    <div
                        className="w-full rounded-full h-3 overflow-hidden shadow-inner"
                        style={{ backgroundColor: '#13203a' }}
                    >
                        <div
                            className="h-full rounded-full shadow-lg"
                            style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${mainSolid} 0%, ${textSolid} 100%)`,
                                boxShadow: `0 0 6px ${mainSolid}`,
                            }}
                        />
                    </div>
                </div>
                </div>
            </div>
        </div>
    );
};
