import React, { useState } from 'react';
import type { ProfileResponse, UserPerfResponse, DailyStreakDto } from '../api/userService';

// 티어 이미지 임포트
import pawnImg from '../assets/images/tier/pawn.png';
import knightImg from '../assets/images/tier/knight.png';
import bishopImg from '../assets/images/tier/vishop.png';
import rookImg from '../assets/images/tier/rook.png';
import queenImg from '../assets/images/tier/queen.png';
import kingImg from '../assets/images/tier/king.png';
import unratedImg from '../assets/images/tier/unrated.png';

// 게임 타입 아이콘 임포트
import blitzIcon from '../assets/images/logo/game/blitz.webp';
import bulletIcon from '../assets/images/logo/game/bullet.webp';
import rapidIcon from '../assets/images/logo/game/rapid.webp';
import classicalIcon from '../assets/images/logo/game/classical.webp';

interface ProfileCardProps {
    profile: ProfileResponse;
    userPerf: UserPerfResponse;
    ratingHistory: any[];
    streakMap: Map<string, DailyStreakDto>;
    selectedYear: number;
    gameType: string;
    promotionThresholds: any;
    convertSubTierToRoman: (subTier: string) => string;
    cardRef?: React.RefObject<HTMLDivElement | null>;
    platform?: 'LICHESS' | 'CHESSCOM';
}

// SVG placeholder for failed image loads
const PLACEHOLDER_SVG =
    'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22120%22 height%3D%22120%22 viewBox%3D%220 0 120 120%22%3E%3Crect width%3D%22120%22 height%3D%22120%22 fill%3D%22%230d1626%22%2F%3E%3Ccircle cx%3D%2260%22 cy%3D%2248%22 r%3D%2220%22 fill%3D%22%23ffffff20%22%2F%3E%3Cellipse cx%3D%2260%22 cy%3D%2292%22 rx%3D%2230%22 ry%3D%2218%22 fill%3D%22%23ffffff10%22%2F%3E%3C%2Fsvg%3E';

const BANNER_PLACEHOLDER_SVG =
    'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22700%22 height%3D%22224%22 viewBox%3D%220 0 700 224%22%3E%3Crect width%3D%22700%22 height%3D%22224%22 fill%3D%22%230d1626%22%2F%3E%3C%2Fsvg%3E';

const LICHESS_RANGES: Record<string, [number, number][]> = {
    PAWN:   [[400,500],[501,600],[601,700],[701,800],[801,900]],
    KNIGHT: [[901,960],[961,1020],[1021,1080],[1081,1140],[1141,1200]],
    BISHOP: [[1201,1260],[1261,1320],[1321,1380],[1381,1440],[1441,1500]],
    ROOK:   [[1501,1560],[1561,1620],[1621,1680],[1681,1740],[1741,1800]],
    QUEEN:  [[1801,1860],[1861,1920],[1921,1980],[1981,2040],[2041,2100]],
    KING:   [[2101,2220],[2221,2340],[2341,2460],[2461,2580],[2581,2700]],
};
const CHESSCOM_RANGES: Record<string, [number, number][]> = {
    PAWN:   [[100,220],[221,340],[341,460],[461,580],[581,700]],
    KNIGHT: [[701,780],[781,860],[861,940],[941,1020],[1021,1100]],
    BISHOP: [[1101,1180],[1181,1260],[1261,1340],[1341,1420],[1421,1500]],
    ROOK:   [[1501,1560],[1561,1620],[1621,1680],[1681,1740],[1741,1800]],
    QUEEN:  [[1801,1880],[1881,1960],[1961,2040],[2041,2120],[2121,2200]],
    KING:   [[2201,2320],[2321,2440],[2441,2560],[2561,2680],[2681,2800]],
};
const TIER_ORDER_CARD = ['PAWN','KNIGHT','BISHOP','ROOK','QUEEN','KING'];
const ROMAN_MAP: Record<number, string> = {1:'I',2:'II',3:'III',4:'IV',5:'V'};

function getTierInfoForCard(rating: number, platform?: 'LICHESS' | 'CHESSCOM'): { tier: string; subRoman: string } {
    const ranges = platform === 'CHESSCOM' ? CHESSCOM_RANGES : LICHESS_RANGES;
    for (const tier of TIER_ORDER_CARD) {
        const subs = ranges[tier];
        if (!subs) continue;
        for (let i = 0; i < subs.length; i++) {
            const [mn, mx] = subs[i];
            if (rating >= mn && rating <= mx) {
                // PAWN arrays: index 0 = [400,500] = lowest = subTier 5 (V)
                // index 4 = [801,900] = highest = subTier 1 (I)
                const subNum5to1 = 5 - i;
                return { tier, subRoman: ROMAN_MAP[subNum5to1] };
            }
        }
    }
    // Above max → KING I
    const lastKing = platform === 'CHESSCOM' ? CHESSCOM_RANGES['KING'] : LICHESS_RANGES['KING'];
    if (lastKing && rating > lastKing[lastKing.length - 1][1]) return { tier: 'KING', subRoman: 'I' };
    return { tier: 'PAWN', subRoman: 'V' };
}

const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    userPerf,
    ratingHistory,
    streakMap,
    selectedYear: _selectedYear,
    gameType,
    promotionThresholds: _promotionThresholds,
    convertSubTierToRoman: _convertSubTierToRoman,
    cardRef,
    platform,
}) => {
    const [profileImgSrc, setProfileImgSrc] = useState<string>(
        profile.profile_image || PLACEHOLDER_SVG
    );
    const [bannerImgSrc, setBannerImgSrc] = useState<string>(
        profile.banner_image || BANNER_PLACEHOLDER_SVG
    );

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const { tier: currentTier, subRoman: _cardSub } = userPerf.uncertain
        ? { tier: 'UNRATED', subRoman: '' }
        : getTierInfoForCard(userPerf.rating, platform);

    // 티어별 색상 (은은하게)
    const tierColorScheme: Record<string, { primary: string; glow: string; text: string }> = {
        'PAWN':    { primary: '#4ade80', glow: 'rgba(74,222,128,0.15)', text: '#4ade80' },
        'KNIGHT':  { primary: '#60a5fa', glow: 'rgba(96,165,250,0.15)', text: '#60a5fa' },
        'BISHOP':  { primary: '#c084fc', glow: 'rgba(192,132,252,0.15)', text: '#c084fc' },
        'ROOK':    { primary: '#f87171', glow: 'rgba(248,113,113,0.15)', text: '#f87171' },
        'QUEEN':   { primary: '#fb923c', glow: 'rgba(251,146,60,0.15)',  text: '#fb923c' },
        'KING':    { primary: '#fbbf24', glow: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
        'UNRATED': { primary: '#94a3b8', glow: 'rgba(148,163,184,0.10)', text: '#94a3b8' }
    };

    const colors = tierColorScheme[currentTier] || tierColorScheme['PAWN'];

    const getTierImage = (tier: string) => {
        switch (tier) {
            case 'PAWN':    return pawnImg;
            case 'KNIGHT':  return knightImg;
            case 'BISHOP':  return bishopImg;
            case 'ROOK':    return rookImg;
            case 'QUEEN':   return queenImg;
            case 'KING':    return kingImg;
            default:        return unratedImg;
        }
    };

    const getGameIcon = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType === 'blitz')     return blitzIcon;
        if (lowerType === 'bullet')    return bulletIcon;
        if (lowerType === 'rapid')     return rapidIcon;
        if (lowerType === 'classical') return classicalIcon;
        return null;
    };

    const romanSubTier = _cardSub;

    // 카드 통계는 선택된 게임 타입(userPerf) 기준으로만 계산
    const typedGames = userPerf.gamesPlayed ?? 0;
    const typedWins = userPerf.wins ?? 0;
    const typedLosses = userPerf.losses ?? 0;
    const typedDraws = userPerf.draws ?? 0;
    const winRate = typedGames > 0
        ? ((typedWins / typedGames) * 100).toFixed(1)
        : '0.0';

    const gameTypeLabel = gameType.toUpperCase();

    // Streak: count consecutive days with hasGame=true up to today
    const currentStreak = (() => {
        if (!streakMap || streakMap.size === 0) return 0;
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const entry = streakMap.get(key);
            if (entry && (entry as any).hasGame !== undefined ? (entry as any).hasGame : entry && entry.total > 0) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        return streak;
    })();

    // Sparkline from ratingHistory (last 12 months)
    const sparklinePoints = (() => {
        const data = ratingHistory ?? [];
        if (data.length < 2) return null;
        const ratings = data.map((d: any) => d.rating as number);
        const mn = Math.min(...ratings);
        const mx = Math.max(...ratings);
        const range = mx - mn || 1;
        const W = 120, H = 32, pad = 2;
        const pts = ratings.map((r, i) => {
            const x = pad + (i / (ratings.length - 1)) * (W - pad * 2);
            const y = (H - pad) - ((r - mn) / range) * (H - pad * 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');
        const trend = ratings[ratings.length - 1] >= ratings[0];
        return { pts, W, H, trend, last: ratings[ratings.length - 1], first: ratings[0] };
    })();

    return (
        <div
            ref={cardRef}
            className="w-[700px] overflow-hidden flex flex-col shadow-2xl rounded-[30px]"
            style={{
                fontFamily: "'Inter', sans-serif",
                background: 'linear-gradient(160deg, #0d1626 0%, #070d1a 100%)',
            }}
        >
            {/* Header */}
            <div className="relative h-44 w-full overflow-hidden">
                {profile.banner_image ? (
                    <img
                        src={bannerImgSrc}
                        alt="Banner"
                        loading="eager"
                        onError={() => setBannerImgSrc(BANNER_PLACEHOLDER_SVG)}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(135deg, #10213d 0%, #0b1528 100%)' }}
                    />
                )}
                <div className="absolute inset-0" style={{
                    background: 'linear-gradient(to top, #070d1a 0%, rgba(7,13,26,0.4) 60%, transparent 100%)'
                }} />

                <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between gap-4 z-10">
                    <div className="relative shrink-0">
                        <img
                            src={profileImgSrc}
                            alt="Profile"
                            loading="eager"
                            onError={() => setProfileImgSrc(PLACEHOLDER_SVG)}
                            className="w-20 h-20 rounded-2xl object-cover shadow-xl"
                            style={{ border: `2px solid ${colors.primary}55` }}
                        />
                        <div
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: '#0d1626', border: `1px solid ${colors.primary}50` }}
                        >
                            <img src={getTierImage(currentTier)} alt={currentTier} loading="eager" className="w-5 h-5 object-contain" />
                        </div>
                    </div>
                    <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2 mb-1.5">
                            <h2 className="text-3xl font-black tracking-tight text-white truncate">{profile.username}</h2>
                            {profile.title && (
                                <span
                                    className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
                                    style={{
                                        backgroundColor: `${colors.primary}20`,
                                        border: `1px solid ${colors.primary}40`,
                                        color: colors.text
                                    }}
                                >
                                    {profile.title}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/70 uppercase tracking-widest">
                            {getGameIcon(gameType) && (
                                <img src={getGameIcon(gameType)!} alt={gameType} className="w-3.5 h-3.5 object-contain opacity-80" />
                            )}
                            <span>
                                {gameTypeLabel} · {currentTier}{romanSubTier ? ` ${romanSubTier}` : ''}
                            </span>
                        </div>
                    </div>
                    <div
                        className="px-3 py-1.5 rounded-lg text-[11px] font-black tracking-widest"
                        style={{ background: `${colors.primary}24`, border: `1px solid ${colors.primary}55`, color: colors.text }}
                    >
                        TYPE CARD
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="px-6 pt-5 pb-6 flex flex-col gap-4">

                {profile.description && (
                    <div
                        className="px-4 py-3 rounded-xl"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.025)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderLeft: `3px solid ${colors.primary}60`
                        }}
                    >
                        <p className="text-[10px] text-white/30 uppercase tracking-[0.18em] mb-1">About</p>
                        <p className="text-sm text-white/65 leading-relaxed line-clamp-2">"{profile.description}"</p>
                    </div>
                )}

                <div className="grid grid-cols-5 gap-4 items-stretch">
                    <div
                        className="col-span-2 rounded-2xl p-5 flex flex-col items-center justify-center"
                        style={{
                            background: `linear-gradient(145deg, ${colors.glow}, rgba(255,255,255,0.03))`,
                            border: `1px solid ${colors.primary}45`,
                        }}
                    >
                        <img
                            src={getTierImage(currentTier)}
                            alt={currentTier}
                            className="w-24 h-24 object-contain mb-2"
                            style={{ filter: `drop-shadow(0 0 6px ${colors.primary})` }}
                        />
                        <div
                            className="px-3 py-1 rounded-lg text-4xl font-black tracking-tight mb-2"
                            style={{ color: colors.text, background: `${colors.primary}20`, border: `1px solid ${colors.primary}50` }}
                        >
                            {romanSubTier}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-white">{userPerf.rating}</span>
                            <span className="text-[10px] text-white/35 uppercase tracking-widest">rating</span>
                        </div>
                        <span className="text-[10px] text-white/35 uppercase tracking-widest mt-1">{currentTier}</span>

                        {/* Streak & Sparkline */}
                        <div className="mt-3 w-full flex flex-col gap-1.5">
                            {/* Streak */}
                            <div
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                            >
                                <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">Streak</span>
                                <span className="text-sm font-black" style={{ color: currentStreak > 0 ? '#fb923c' : 'rgba(255,255,255,0.35)' }}>
                                    {currentStreak > 0 ? `🔥 ${currentStreak}d` : '—'}
                                </span>
                            </div>
                            {/* Sparkline */}
                            {sparklinePoints && (
                                <div
                                    className="px-2.5 py-1.5 rounded-lg"
                                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[9px] text-white/30 uppercase tracking-widest font-black">Rating Trend</span>
                                        <span className="text-[9px] font-black" style={{ color: sparklinePoints.trend ? '#4ade80' : '#f87171' }}>
                                            {sparklinePoints.trend ? '▲' : '▼'} {Math.abs(sparklinePoints.last - sparklinePoints.first)}
                                        </span>
                                    </div>
                                    <svg width={sparklinePoints.W} height={sparklinePoints.H} viewBox={`0 0 ${sparklinePoints.W} ${sparklinePoints.H}`} style={{ display: 'block', width: '100%' }}>
                                        <polyline
                                            points={sparklinePoints.pts}
                                            fill="none"
                                            stroke={sparklinePoints.trend ? '#4ade80' : '#f87171'}
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            opacity="0.7"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-span-3 grid grid-cols-2 gap-3">
                        {[
                            { label: `${gameTypeLabel} GAMES`, value: typedGames },
                            { label: 'WIN RATE',    value: `${winRate}%`, highlight: true },
                            { label: 'WINS',        value: typedWins },
                            { label: 'LOSSES',      value: typedLosses },
                            { label: 'DRAWS',       value: typedDraws },
                            { label: 'TIME CLASS',  value: gameTypeLabel },
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className="rounded-xl p-3 flex flex-col justify-center"
                                style={{
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.07)'
                                }}
                            >
                                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                <p
                                    className="text-xl font-black"
                                    style={{ color: stat.highlight ? colors.text : 'rgba(255,255,255,0.85)' }}
                                >
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div
                className="px-6 py-4 flex justify-between items-center"
                style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black text-white shadow"
                            style={{ backgroundColor: colors.primary }}
                        >
                            L
                        </div>
                        <span className="text-xs font-black tracking-tight text-white/70 uppercase">ChessLadder Player Card</span>
                    </div>
                    <div className="flex gap-4 ml-7">
                        <p className="text-[9px] font-bold tracking-widest uppercase">
                            <span className="text-white/20">ChessLadder: </span>
                            <span className="text-white/40">{formatDate(profile.createdAt)}</span>
                        </p>
                        <p className="text-[9px] font-bold tracking-widest uppercase">
                            <span className="text-white/20">Platform: </span>
                            <span className="text-white/40">{gameTypeLabel}</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-white/30 tracking-[0.2em]">VERIFIED DATA</span>
                    <span className="text-[9px] text-white/20 tracking-tighter uppercase">chessladder.org</span>
                </div>
            </div>
        </div>
    );
};

export default ProfileCard;
