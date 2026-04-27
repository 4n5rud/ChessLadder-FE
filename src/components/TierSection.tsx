import type { UserPerfResponse } from "../api/userService";
import { useLanguage } from "../context/LanguageContext";
import { getTierInfo, getTierRanges, TIER_COLOR_SCHEME, SUB_ROMAN, type Platform } from "../utils/tierUtils";
import { TierBadge } from "./TierBadge";

interface TierSectionProps {
    userPerf: UserPerfResponse | null;
    loadingPerf: boolean;
    tierColorScheme: Record<string, any>;
    promotionThresholds: { [key: string]: number };
    convertSubTierToRoman: (subTier: string) => string;
    platform?: Platform;
}


// 다음 레벨 계산 함수
const getNextLevel = (_currentRating: number, currentTier: string, currentSubNum: number, tierRanges: Record<string, any>) => {
    const tierOrder = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'];
    const tierIndex = tierOrder.indexOf(currentTier);

    let nextTier = currentTier;
    let nextSub = SUB_ROMAN[currentSubNum];
    let nextMin = 0;

    if (currentSubNum === 1) {
        if (tierIndex < tierOrder.length - 1) {
            nextTier = tierOrder[tierIndex + 1];
            nextSub = SUB_ROMAN[5];
            nextMin = tierRanges[nextTier].subTiers[5][0];
        }
    } else {
        const nextSubNum = currentSubNum - 1;
        nextSub = SUB_ROMAN[nextSubNum];
        nextMin = tierRanges[currentTier].subTiers[nextSubNum][0];
    }

    return { nextTier, nextSub, nextMin };
};

export const TierSection = ({
    userPerf,
    loadingPerf,
    promotionThresholds: _promotionThresholds,
    tierColorScheme: _tierColorScheme,
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

    const tierInfo = getTierInfo(userPerf.rating, platform);
    const { tier: mainTier, subRoman: currentSub, subNum: currentSubNum, levelMin, levelMax } = tierInfo;

    const tierRanges = getTierRanges(platform);

    const { nextTier, nextSub, nextMin } = getNextLevel(userPerf.rating, mainTier, currentSubNum, tierRanges);

    const remaining = Math.max(nextMin - userPerf.rating, 0);
    const levelRange = levelMax - levelMin;
    const currentProgress = userPerf.rating - levelMin;
    const pct = Math.min(Math.max((currentProgress / levelRange) * 100, 0), 100);

    const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

    const tierColors = TIER_COLOR_SCHEME[mainTier as keyof typeof TIER_COLOR_SCHEME] || TIER_COLOR_SCHEME['KING'];
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
                <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 mb-8">
                    {/* Unified tier badge */}
                    <TierBadge
                        tier={mainTier}
                        subRoman={currentSub}
                        size="xl"
                        className="mx-auto md:mx-0"
                    />

                    {/* Rating info */}
                    <div className="flex-1 text-center md:text-left">
                        <p
                            className="text-4xl md:text-6xl font-black drop-shadow-lg mb-2"
                            style={{ color: textSolid }}
                        >
                            {cap(mainTier)}
                        </p>
                        <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.72)' }}>
                            {userPerf.rating} Rating
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mb-6">
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

                {/* Game-type stats strip */}
                {(() => {
                    const games = userPerf.gamesPlayed ?? 0;
                    const wins = userPerf.wins ?? 0;
                    const losses = userPerf.losses ?? 0;
                    const draws = userPerf.draws ?? 0;
                    const winRate = games > 0 ? ((wins / games) * 100).toFixed(1) : '0.0';
                    const statItems: { label: string; value: string; color?: string }[] = [
                        { label: language === 'KR' ? '총 게임' : 'Games',   value: games.toLocaleString() },
                        { label: language === 'KR' ? '승리'   : 'Wins',     value: wins.toLocaleString(),   color: '#4ade80' },
                        { label: language === 'KR' ? '패배'   : 'Losses',   value: losses.toLocaleString(), color: '#f87171' },
                        { label: language === 'KR' ? '무승부' : 'Draws',    value: draws.toLocaleString() },
                        { label: language === 'KR' ? '승률'   : 'Win Rate', value: `${winRate}%`,           color: textSolid },
                    ];
                    return (
                        <div className="grid grid-cols-5 gap-2">
                            {statItems.map((s, i, arr) => (
                                <div
                                    key={s.label}
                                    className="flex flex-col items-center justify-center py-2.5 px-1"
                                    style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 12,
                                        border: '1px solid rgba(255,255,255,0.07)',
                                        borderRight: i < arr.length - 1 ? undefined : undefined,
                                    }}
                                >
                                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)', marginBottom: 5 }}>
                                        {s.label}
                                    </span>
                                    <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', color: s.color ?? 'rgba(255,255,255,0.82)' }}>
                                        {s.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    );
                })()}
                </div>
            </div>
        </div>
    );
};
