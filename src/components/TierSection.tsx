import type { UserTierDto } from "../api/userService";

interface TierSectionProps {
    userTier: UserTierDto | null;
    loadingTier: boolean;
    tierColorScheme: { [key: string]: { mainColor: string; lightBg: string; darkBg: string; borderColor: string; lightText: string; darkText: string } };
    promotionThresholds: { [key: string]: number };
    convertSubTierToRoman: (subTier: string) => string;
}

export const TierSection = ({
    userTier,
    loadingTier,
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
        let nextTierName = currentTier;
        
        if (currentSubTier === 1) {
            // 현재가 I이면 다음 메인 티어의 I을 목표
            nextTierName = tiers[nextTierIndex];
            nextSubTier = 1;
            const nextTierRating = nextTierThreshold;
            const remainingRating = Math.max(nextTierRating - rating, 0);
            const nextDisplayTier = tiers[nextTierIndex];
            
            return { 
                nextTierThreshold, 
                remainingRating, 
                percentage: (ratingInCurrentTier / tierRange) * 100,
                currentThreshold, 
                nextTier: nextDisplayTier,
                nextSubTier: 1,
                currentSubTier
            };
        } else {
            // 같은 메인 티어 내에서 다음 서브티어 계산
            const nextSubTierThreshold = prevTierThreshold + (subTierRange * (5 - nextSubTier + 1));
            const remainingRating = Math.max(nextSubTierThreshold - rating, 0);
            
            return { 
                nextTierThreshold: nextSubTierThreshold,
                remainingRating, 
                percentage: (ratingInCurrentTier / tierRange) * 100,
                currentThreshold, 
                nextTier: currentTier,
                nextSubTier,
                currentSubTier
            };
        }
    };

    if (loadingTier) {
        return (
            <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                <div className="flex items-center justify-center py-12 bg-white border border-gray-200 rounded-lg">
                    <p className="text-gray-500 text-sm">티어 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (!userTier || !userTier.tierResult || !userTier.tierResult.mainTier) {
        return (
            <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                <div className="flex items-center justify-center py-12 bg-white border border-gray-200 rounded-lg">
                    <p className="text-gray-500 text-sm">티어 정보를 불러올 수 없습니다.</p>
                </div>
            </div>
        );
    }

    const mainTier = userTier.tierResult.mainTier;
    const tierNameMap: { [key: string]: string } = {
        'PAWN': 'pawn.png',
        'KNIGHT': 'knight.png',
        'BISHOP': 'vishop.png',
        'ROOK': 'rook.png',
        'QUEEN': 'queen.png',
        'KING': 'king.png'
    };
    const fileName = tierNameMap[mainTier] || 'pawn.png';
    const tierImageSrc = new URL(`../assets/images/tier/${fileName}`, import.meta.url).href;

    const { remainingRating, percentage, nextTier, nextSubTier, currentSubTier } = calculatePromotionProgress(userTier.rating, mainTier);
    
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
                {/* 티어 이미지 + 현재 티어 정보 (수평) */}
                <div className="flex items-center gap-8 mb-8">
                    {/* 티어 이미지 */}
                    <div 
                        className="flex-shrink-0 w-40 h-40 rounded-xl flex items-center justify-center shadow-lg" 
                        style={{ backgroundColor: tierColorScheme[mainTier]?.mainColor }}
                    >
                        <img
                            src={tierImageSrc}
                            alt={mainTier}
                            className="w-32 h-32 object-contain drop-shadow-lg"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>

                    {/* 현재 티어 정보 (수평) */}
                    <div className="flex-1">
                        <div className="flex items-baseline gap-3 mb-4">
                            <p className="text-6xl font-black" style={{ color: tierColorScheme[mainTier]?.darkText }}>
                                {mainTier.charAt(0) + mainTier.slice(1).toLowerCase()}
                            </p>
                            {userTier.tierResult.subTier && (
                                <p className="text-3xl font-bold" style={{ color: tierColorScheme[mainTier]?.darkText, opacity: 0.7 }}>
                                    {convertSubTierToRoman(userTier.tierResult.subTier)}
                                </p>
                            )}
                        </div>
                        
                        {/* 레이팅을 아주 작게 표시 */}
                        <div className="text-xs font-bold opacity-60" style={{ color: tierColorScheme[mainTier]?.darkText }}>
                            {userTier.rating} Rating
                        </div>
                    </div>
                </div>

                {/* 프로모션 프로그래스 바 - 가장 하단에 길게 */}
                <div className="w-full">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-bold flex items-center gap-2" style={{ color: tierColorScheme[mainTier]?.darkText }}>
                            <span>{mainTier.charAt(0) + mainTier.slice(1).toLowerCase()} {convertSubTierToRoman(String(currentSubTier))}</span>
                            <span>→</span>
                            <span style={{ color: tierColorScheme[nextTier]?.mainColor }} className="font-black">
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
                                        backgroundColor: tierColorScheme[mainTier]?.mainColor
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
