import React from 'react';
import type { ProfileResponse, UserPerfResponse, DailyStreakDto } from '../api/userService';
import RatingHistoryChart from './RatingHistoryChart';

// 티어 이미지 임포트
import pawnImg from '../assets/images/tier/pawn.png';
import knightImg from '../assets/images/tier/knight.png';
import bishopImg from '../assets/images/tier/vishop.png';
import rookImg from '../assets/images/tier/rook.png';
import queenImg from '../assets/images/tier/queen.png';
import kingImg from '../assets/images/tier/king.png';
import unratedImg from '../assets/images/tier/unrated.png';

interface ProfileCardProps {
    profile: ProfileResponse;
    userPerf: UserPerfResponse;
    ratingHistory: any[];
    streakMap: Map<string, DailyStreakDto>;
    selectedYear: number;
    promotionThresholds: any;
    convertSubTierToRoman: (subTier: string) => string;
    cardRef: React.RefObject<HTMLDivElement | null>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    userPerf,
    ratingHistory,
    streakMap,
    selectedYear,
    promotionThresholds,
    convertSubTierToRoman,
    cardRef
}) => {
    // Force English for the card
    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getTier = (rating: number): string => {
        const tiers = Object.entries(promotionThresholds).sort(([, a], [, b]) => (b as number) - (a as number));
        for (const [tier, minRating] of tiers) {
            if (rating >= (minRating as number)) {
                return tier;
            }
        }
        return 'PAWN';
    };

    const currentTier = userPerf.uncertain ? 'UNRATED' : getTier(userPerf.rating);
    
    // 티어별 테마 색상 정의
    const themeColors: Record<string, { primary: string; secondary: string; light: string; text: string }> = {
        'PAWN': { primary: '#22c55e', secondary: '#166534', light: '#f0fdf4', text: '#14532d' },
        'KNIGHT': { primary: '#3b82f6', secondary: '#1e40af', light: '#eff6ff', text: '#1e3a8a' },
        'BISHOP': { primary: '#a855f7', secondary: '#6b21a8', light: '#f5f3ff', text: '#4c1d95' },
        'ROOK': { primary: '#ef4444', secondary: '#991b1b', light: '#fef2f2', text: '#7f1d1d' },
        'QUEEN': { primary: '#f59e0b', secondary: '#92400e', light: '#fffbeb', text: '#78350f' },
        'KING': { primary: '#f59e0b', secondary: '#92400e', light: '#fffbeb', text: '#78350f' },
        'UNRATED': { primary: '#6b7280', secondary: '#374151', light: '#f9fafb', text: '#111827' }
    };

    const colors = themeColors[currentTier] || themeColors['PAWN'];

    const getTierImage = (tier: string) => {
        switch (tier) {
            case 'PAWN': return pawnImg;
            case 'KNIGHT': return knightImg;
            case 'BISHOP': return bishopImg;
            case 'ROOK': return rookImg;
            case 'QUEEN': return queenImg;
            case 'KING': return kingImg;
            default: return unratedImg;
        }
    };

    const getSubTier = (rating: number): string => {
        // Simple sub-tier calculation logic similar to TierSection.tsx
        const tier = getTier(rating);
        const ranges: any = {
            'PAWN': [400, 900], 'KNIGHT': [901, 1200], 'BISHOP': [1201, 1500],
            'ROOK': [1501, 1800], 'QUEEN': [1801, 2100], 'KING': [2101, 2700]
        };
        const range = ranges[tier];
        if (!range) return '';
        const [min, max] = range;
        const size = (max - min) / 5;
        const sub = Math.ceil((rating - min) / size);
        const subTier = Math.max(1, Math.min(5, 6 - sub));
        return subTier.toString();
    };

    const subTier = userPerf.uncertain ? '' : getSubTier(userPerf.rating);
    const romanSubTier = convertSubTierToRoman(subTier);

    return (
        <div 
            ref={cardRef}
            className="w-[700px] bg-white overflow-hidden flex flex-col shadow-2xl rounded-[40px]"
            style={{ fontFamily: "'Inter', sans-serif" }}
        >
            {/* 1. Header: Modern Tier Themed Banner */}
            <div className="relative h-56 w-full overflow-hidden">
                <div 
                    className="absolute inset-0 transition-transform duration-700 hover:scale-110"
                    style={{
                        backgroundImage: profile.banner_image ? `url(${profile.banner_image})` : 'none',
                        backgroundColor: profile.banner_image ? 'transparent' : colors.primary,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />
                {/* Gradient overlay using theme primary color */}
                <div 
                    className="absolute inset-0 bg-gradient-to-t opacity-90"
                    style={{ backgroundImage: `linear-gradient(to top, ${colors.secondary}, transparent)` }}
                />
                
                <div className="absolute bottom-8 left-10 flex items-center gap-8 z-10">
                    <div className="relative">
                        <img 
                            src={profile.profile_image || 'https://via.placeholder.com/120'} 
                            alt="Profile" 
                            className="w-28 h-28 rounded-[32px] border-[6px] bg-white object-cover shadow-2xl"
                            style={{ borderColor: 'white' }}
                        />
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg">
                            <img src={getTierImage(currentTier)} alt={currentTier} className="w-7 h-7 object-contain" />
                        </div>
                    </div>
                    <div className="text-white drop-shadow-lg">
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-4xl font-black tracking-tight">{profile.username}</h2>
                            {profile.title && (
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/30">
                                    {profile.title}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col gap-0.5 opacity-90">
                            {/* Joined dates moved to footer */}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="p-10 flex flex-col gap-8 bg-white">
                
                {/* Bio / Description Section */}
                {profile.description && (
                    <div className="px-8 py-6 rounded-[32px] bg-gray-50/50 border border-gray-100/50 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: colors.primary }} />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">About Player</p>
                        <p className="text-sm text-gray-700 italic leading-relaxed font-medium">"{profile.description}"</p>
                    </div>
                )}
                
                {/* Tier & Vital Stats Grid */}
                <div className="flex gap-8 items-stretch">
                    {/* Tier Display Card */}
                    <div className="flex-[1.4] p-8 rounded-[40px] border-2 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm transition-all hover:shadow-md"
                         style={{ borderColor: `${colors.primary}20`, backgroundColor: colors.light }}>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            <img src={getTierImage(currentTier)} alt={currentTier} className="w-36 h-36 object-contain mb-2 drop-shadow-2xl transition-transform group-hover:scale-110" />
                            <div className="text-7xl font-black mb-1 italic tracking-tighter" style={{ color: colors.secondary }}>
                                {romanSubTier}
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.3em] mb-1" style={{ color: colors.text }}>{currentTier}</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black" style={{ color: colors.text }}>{userPerf.rating}</span>
                                    <span className="text-[10px] font-black opacity-50 uppercase tracking-wider" style={{ color: colors.text }}>RATING</span>
                                </div>
                            </div>
                        </div>

                        {/* Theme-colored decorative elements */}
                        <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-10 animate-pulse" style={{ backgroundColor: colors.primary }} />
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full opacity-5" style={{ backgroundColor: colors.primary }} />
                    </div>

                    {/* Stats Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        {[
                            { label: 'TOTAL GAMES', value: profile.allGames, icon: '🎮', color: colors.text },
                            { label: 'WIN RATE', value: `${profile.allGames > 0 ? ((profile.wins / profile.allGames) * 100).toFixed(1) : '0.0'}%`, icon: '📈', color: colors.primary },
                            { label: 'WINS', value: profile.wins, icon: '🏆', color: '#16a34a' },
                            { label: 'LOSSES', value: profile.losses, icon: '💀', color: '#dc2626' },
                            { label: 'RATED', value: profile.ratedGames, icon: '⚡', color: colors.text },
                            { label: 'DRAWS', value: profile.draws, icon: '🤝', color: '#6b7280' }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-gray-50/50 p-4 rounded-[32px] border border-gray-100/50 flex flex-col justify-center transition-all hover:bg-white hover:shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs">{stat.icon}</span>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</p>
                                </div>
                                <p className="text-xl font-black tracking-tight" style={{ color: stat.color }}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Chart Section */}
                <div className="relative bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm overflow-hidden h-[320px] transition-all hover:shadow-md">
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Performance Evolution</p>
                            <h3 className="text-lg font-black text-gray-800">Rating Trajectory</h3>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Peak Career</span>
                                <span className="text-sm font-black" style={{ color: colors.primary }}>{userPerf.highestRating || '-'}</span>
                            </div>
                            <div className="w-px h-8 bg-gray-100" />
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Current</span>
                                <span className="text-sm font-black text-gray-800">{userPerf.rating}</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-x-8 bottom-8 top-24">
                        <RatingHistoryChart 
                            ratingHistory={ratingHistory} 
                            tierThresholds={promotionThresholds}
                            isCard={true}
                        />
                    </div>
                </div>

                {/* Activity Streak Section */}
                <div className="bg-gray-50/50 rounded-[40px] p-8 border border-gray-100/50">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{selectedYear} ACTIVITY</p>
                            <h3 className="text-lg font-black text-gray-800">Daily Grind</h3>
                        </div>
                        <div className="flex gap-6">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Intensity</p>
                                <div className="flex gap-1.5 mt-1">
                                    {[0.1, 0.3, 0.5, 0.7, 1].map(op => (
                                        <div key={op} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors.primary, opacity: op }} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex w-full mb-2" style={{ gap: '3px' }}>
                        {(() => {
                            const weeks = [];
                            const year = selectedYear;
                            const firstDay = new Date(year, 0, 1);
                            const lastDay = new Date(year, 11, 31);
                            
                            let currentDate = new Date(firstDay);
                            currentDate.setDate(currentDate.getDate() - currentDate.getDay());

                            const TOTAL_WEEKS = 53;
                            for (let w = 0; w < TOTAL_WEEKS; w++) {
                                weeks.push(
                                    <div key={w} className="flex flex-col flex-1" style={{ gap: '3px' }}>
                                        {Array.from({ length: 7 }).map((_, d) => {
                                            const date = new Date(currentDate);
                                            date.setDate(date.getDate() + (w * 7) + d);
                                            const dateStr = date.toISOString().split('T')[0];
                                            
                                            if (date < firstDay || date > lastDay) {
                                                return <div key={`${w}-${d}`} className="aspect-square w-full rounded-[2px] opacity-0" />;
                                            }
                                            
                                            const dailyData = streakMap.get(dateStr);
                                            let activity = 0;
                                            if (dailyData) {
                                                const total = dailyData.total ?? 0;
                                                if (total === 0) activity = 0;
                                                else if (total <= 2) activity = 1;
                                                else if (total <= 5) activity = 2;
                                                else if (total <= 8) activity = 3;
                                                else activity = 4;
                                            }
                                            
                                            const opacityMap = [0, 0.25, 0.5, 0.75, 1];

                                            return (
                                                <div
                                                    key={dateStr}
                                                    className="aspect-square w-full rounded-[2px] transition-transform hover:scale-125"
                                                    style={{ 
                                                        backgroundColor: activity === 0 ? '#e2e8f0' : colors.primary,
                                                        opacity: activity === 0 ? 0.3 : opacityMap[activity]
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>
                                );
                            }
                            return weeks;
                        })()}
                    </div>
                    <div className="flex justify-between px-1">
                         <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">January</span>
                         <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">December</span>
                    </div>
                </div>
            </div>

            {/* 3. Footer: Brand & Verification */}
            <div className="bg-white px-10 py-8 border-t border-gray-50 flex justify-between items-center group">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-white shadow-lg transition-transform group-hover:rotate-12" style={{ backgroundColor: colors.primary }}>L</div>
                        <span className="text-sm font-black tracking-tight text-gray-800 uppercase">ChessLadder Player Card</span>
                    </div>
                    <div className="flex gap-4 ml-9">
                        <p className="text-[9px] font-black tracking-widest uppercase">
                            <span className="text-gray-300">ChessLadder Joined: </span>
                            <span className="text-gray-500">{formatDate(profile.createdAt)}</span>
                        </p>
                        <p className="text-[9px] font-black tracking-widest uppercase">
                            <span className="text-gray-300">Lichess Joined: </span>
                            <span className="text-gray-500">{formatDate(profile.lichessCreatedAt)}</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-400 tracking-[0.2em] mb-0.5">VERIFIED DATA</span>
                    <span className="text-[9px] font-bold text-gray-300 tracking-tighter uppercase">Generated at chessmate.kr</span>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
