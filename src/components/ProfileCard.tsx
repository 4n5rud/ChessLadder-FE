import React, { useState } from 'react';
import type { ProfileResponse, UserPerfResponse, DailyStreakDto, FirstMoveResponse, ColorStatsResponse } from '../api/userService';
import { getTierInfo } from '../utils/tierUtils';

import pawnImg    from '../assets/images/tier/pawn.png';
import knightImg  from '../assets/images/tier/knight.png';
import bishopImg  from '../assets/images/tier/vishop.png';
import rookImg    from '../assets/images/tier/rook.png';
import queenImg   from '../assets/images/tier/queen.png';
import kingImg    from '../assets/images/tier/king.png';
import unratedImg from '../assets/images/tier/unrated.png';

import blitzIcon     from '../assets/images/logo/game/blitz.webp';
import bulletIcon    from '../assets/images/logo/game/bullet.webp';
import rapidIcon     from '../assets/images/logo/game/rapid.webp';
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
    firstMoveStats?: FirstMoveResponse | null;
    colorStats?: ColorStatsResponse | null;
}

const PLACEHOLDER_SVG =
    'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22120%22 height%3D%22120%22 viewBox%3D%220 0 120 120%22%3E%3Crect width%3D%22120%22 height%3D%22120%22 fill%3D%22%230d1626%22%2F%3E%3Ccircle cx%3D%2260%22 cy%3D%2248%22 r%3D%2220%22 fill%3D%22%23ffffff20%22%2F%3E%3Cellipse cx%3D%2260%22 cy%3D%2292%22 rx%3D%2230%22 ry%3D%2218%22 fill%3D%22%23ffffff10%22%2F%3E%3C%2Fsvg%3E';

const TIER_COLORS: Record<string, { primary: string; glow: string; text: string; bannerGradient: string }> = {
    PAWN:    { primary: '#4ade80', glow: 'rgba(74,222,128,0.28)',   text: '#4ade80', bannerGradient: 'linear-gradient(145deg, #051a0e 0%, #0b3020 55%, #0a1e14 100%)' },
    KNIGHT:  { primary: '#60a5fa', glow: 'rgba(96,165,250,0.28)',   text: '#60a5fa', bannerGradient: 'linear-gradient(145deg, #040e1e 0%, #0c1e38 55%, #091628 100%)' },
    BISHOP:  { primary: '#c084fc', glow: 'rgba(192,132,252,0.28)',  text: '#c084fc', bannerGradient: 'linear-gradient(145deg, #0e0520 0%, #1c0a38 55%, #130620 100%)' },
    ROOK:    { primary: '#f87171', glow: 'rgba(248,113,113,0.28)',  text: '#f87171', bannerGradient: 'linear-gradient(145deg, #1a0505 0%, #320a0a 55%, #220606 100%)' },
    QUEEN:   { primary: '#fb923c', glow: 'rgba(251,146,60,0.28)',   text: '#fb923c', bannerGradient: 'linear-gradient(145deg, #1a0b00 0%, #321500 55%, #221000 100%)' },
    KING:    { primary: '#fbbf24', glow: 'rgba(251,191,36,0.28)',   text: '#fbbf24', bannerGradient: 'linear-gradient(145deg, #1a1200 0%, #321e00 55%, #221600 100%)' },
    UNRATED: { primary: '#94a3b8', glow: 'rgba(148,163,184,0.18)',  text: '#94a3b8', bannerGradient: 'linear-gradient(145deg, #0d1626 0%, #131f33 55%, #0d1626 100%)' },
};

const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    userPerf,
    ratingHistory,
    streakMap,
    selectedYear,
    gameType,
    promotionThresholds: _pt,
    convertSubTierToRoman: _cstr,
    cardRef,
    platform,
    firstMoveStats,
    colorStats,
}) => {
    const [profileImgSrc, setProfileImgSrc] = useState<string>(profile.profile_image || PLACEHOLDER_SVG);
    const [bannerImgSrc, setBannerImgSrc]   = useState<string | null>(profile.banner_image || null);

    const { tier: currentTier, subRoman } = userPerf.uncertain
        ? { tier: 'UNRATED', subRoman: '' }
        : getTierInfo(userPerf.rating, platform);

    const C = TIER_COLORS[currentTier] ?? TIER_COLORS.PAWN;

    const getTierImage = (t: string) => {
        switch (t) {
            case 'PAWN':    return pawnImg;
            case 'KNIGHT':  return knightImg;
            case 'BISHOP':  return bishopImg;
            case 'ROOK':    return rookImg;
            case 'QUEEN':   return queenImg;
            case 'KING':    return kingImg;
            default:        return unratedImg;
        }
    };

    const getGameIcon = (t: string) => {
        const l = t.toLowerCase();
        if (l === 'blitz')     return blitzIcon;
        if (l === 'bullet')    return bulletIcon;
        if (l === 'rapid')     return rapidIcon;
        if (l === 'classical') return classicalIcon;
        return null;
    };

    // ── Stats ────────────────────────────────────────────────────
    const games   = userPerf.gamesPlayed ?? 0;
    const wins    = userPerf.wins        ?? 0;
    const losses  = userPerf.losses      ?? 0;
    const draws   = userPerf.draws       ?? 0;
    const winRate = games > 0 ? ((wins / games) * 100).toFixed(1) : '0.0';
    const label   = gameType.toUpperCase();
    const hasBanner = !!bannerImgSrc;

    // ── Streak heatmap (선택 연도 1월~12월, 미래 포함 전체) ────
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const heatmapData = (() => {
        const weeks: { date: string; total: number; future: boolean }[][] = [];
        const start = new Date(selectedYear, 0, 1);
        const end   = new Date(selectedYear, 11, 31);
        let cur = new Date(start);
        let week: { date: string; total: number; future: boolean }[] = [];
        while (cur <= end) {
            const ds = cur.toISOString().slice(0, 10);
            const isFuture = ds > todayStr;
            week.push({ date: ds, total: isFuture ? 0 : (streakMap.get(ds)?.total ?? 0), future: isFuture });
            if (week.length === 7) { weeks.push(week); week = []; }
            cur.setDate(cur.getDate() + 1);
        }
        if (week.length > 0) weeks.push(week);
        return weeks;
    })();

    const getHeatColor = (total: number) => {
        if (total === 0) return 'rgba(255,255,255,0.06)';
        const alpha = total <= 2 ? 0.30 : total <= 5 ? 0.52 : total <= 8 ? 0.74 : 0.95;
        const hex = C.primary;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    };

    const getHeatBorder = (total: number) => {
        if (total === 0) return 'rgba(255,255,255,0.09)';
        const alpha = total <= 2 ? 0.40 : total <= 5 ? 0.65 : total <= 8 ? 0.88 : 0.95;
        const hex = C.primary;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    };

    // ── Streak summary ───────────────────────────────────────────
    const currentStreak = (() => {
        if (!streakMap || streakMap.size === 0) return 0;
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const entry = streakMap.get(d.toISOString().slice(0, 10));
            const has = entry ? entry.total > 0 : false;
            if (has) streak++;
            else if (i > 0) break;
        }
        return streak;
    })();

    const maxStreak = (() => {
        if (!streakMap || streakMap.size === 0) return 0;
        let max = 0, temp = 0;
        const sorted = Array.from(streakMap.entries()).sort(([a], [b]) => a.localeCompare(b));
        for (const [, entry] of sorted) {
            if (entry.total > 0) { temp++; max = Math.max(max, temp); }
            else temp = 0;
        }
        return max;
    })();

    // ── Rating History SVG Chart ─────────────────────────────────
    const ratingChart = (() => {
        const rows = Array.isArray(ratingHistory) ? ratingHistory : [];
        const byMonth = new Map<string, number>();
        for (const row of rows) {
            const ym = typeof row?.yearMonth === 'string' ? row.yearMonth : null;
            const rating = Number(row?.rating ?? NaN);
            if (!ym || !/^\d{4}-\d{2}$/.test(ym) || Number.isNaN(rating)) continue;
            byMonth.set(ym, rating);
        }
        const entries = Array.from(byMonth.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-24) // last 24 months max
            .map(([ym, rating]) => ({ ym, rating }));

        if (entries.length < 2) return null;

        const W = 440, H = 110;
        const pad = { top: 12, right: 10, bottom: 22, left: 38 };
        const iW = W - pad.left - pad.right;
        const iH = H - pad.top - pad.bottom;

        const allRatings = entries.map(e => e.rating);
        const minR = Math.min(...allRatings);
        const maxR = Math.max(...allRatings);
        const rng = maxR - minR || 100;

        const xS = (i: number) => pad.left + (i / (entries.length - 1)) * iW;
        const yS = (r: number) => pad.top + iH - ((r - minR) / rng) * iH;

        const linePts = entries.map((e, i) => `${xS(i)},${yS(e.rating)}`).join(' ');
        const areaPath = `M${xS(0)},${yS(entries[0].rating)} ` +
            entries.map((e, i) => `L${xS(i)},${yS(e.rating)}`).join(' ') +
            ` L${xS(entries.length - 1)},${pad.top + iH} L${pad.left},${pad.top + iH} Z`;

        // y-axis labels (3 levels)
        const yLabels = [minR, Math.round(minR + rng / 2), maxR];

        // x-axis: show every N months
        const step = entries.length <= 6 ? 1 : entries.length <= 12 ? 2 : 4;
        const xLabels = entries.filter((_, i) => i % step === 0 || i === entries.length - 1);

        return { W, H, pad, linePts, areaPath, entries, xS, yS, yLabels, xLabels, minR, maxR };
    })();

    // ── First Moves ───────────────────────────────────────────────
    const topWhite = Object.entries(firstMoveStats?.white_moves ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
    const topBlack = Object.entries(firstMoveStats?.black_moves ?? {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
    const whiteMax = topWhite[0]?.[1] ?? 1;
    const blackMax = topBlack[0]?.[1] ?? 1;
    const hasFirstMoves = topWhite.length > 0 || topBlack.length > 0;

    return (
        <div
            ref={cardRef}
            style={{
                width: 700,
                fontFamily: "'Inter', 'SF Pro Display', sans-serif",
                background: '#070d1a',
                borderRadius: 28,
                overflow: 'hidden',
                boxShadow: '0 40px 100px rgba(0,0,0,0.70)',
            }}
        >
            {/* ═══════════════════════════════════════════════════
                BANNER HERO
            ═══════════════════════════════════════════════════ */}
            <div style={{ position: 'relative', height: 260 }}>
                <div style={{ position: 'absolute', inset: 0, background: hasBanner ? '#000' : C.bannerGradient }} />
                {hasBanner && (
                    <img src={bannerImgSrc!} alt="" onError={() => setBannerImgSrc(null)}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(7,13,26,0.05) 0%, rgba(7,13,26,0.30) 40%, rgba(7,13,26,0.88) 80%, #070d1a 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 75% 10%, ${C.glow} 0%, transparent 62%)`, mixBlendMode: hasBanner ? 'screen' : 'normal' }} />

                {/* Game type chip */}
                <div style={{ position: 'absolute', top: 18, right: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 9, background: `${C.primary}1a`, border: `1px solid ${C.primary}44`, backdropFilter: 'blur(4px)' }}>
                    {getGameIcon(gameType) && <img src={getGameIcon(gameType)!} alt="" style={{ width: 12, height: 12, objectFit: 'contain', opacity: 0.9 }} />}
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.20em', textTransform: 'uppercase', color: C.text }}>{label}</span>
                </div>

                {/* Bottom: avatar + info + rating */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 20px', display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={profileImgSrc} alt="Profile" onError={() => setProfileImgSrc(PLACEHOLDER_SVG)}
                            style={{ width: 86, height: 86, borderRadius: 20, objectFit: 'cover', border: `2.5px solid ${C.primary}55`, boxShadow: `0 0 28px ${C.glow}, 0 8px 24px rgba(0,0,0,0.50)` }} />
                        <div style={{ position: 'absolute', bottom: -7, right: -7, width: 28, height: 28, borderRadius: 7, background: '#0c1524', border: `1.5px solid ${C.primary}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src={getTierImage(currentTier)} alt={currentTier} style={{ width: 17, height: 17, objectFit: 'contain' }} />
                        </div>
                    </div>
                    <div style={{ flex: 1, paddingBottom: 4, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6, flexWrap: 'wrap' }}>
                            <h2 style={{ margin: 0, fontSize: 30, fontWeight: 900, letterSpacing: '-0.025em', color: '#ffffff', lineHeight: 1 }}>{profile.username}</h2>
                            {profile.title && <span style={{ padding: '2px 7px', borderRadius: 6, fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', background: `${C.primary}1e`, border: `1px solid ${C.primary}40`, color: C.text }}>{profile.title}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: `${C.text}bb` }}>{currentTier}{subRoman ? ` ${subRoman}` : ''}</span>
                            {profile.description && <>
                                <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10 }}>·</span>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>"{profile.description}"</span>
                            </>}
                        </div>
                    </div>
                    <div style={{ flexShrink: 0, paddingBottom: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 50, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.035em', color: '#ffffff', textShadow: `0 0 32px ${C.glow}` }}>{userPerf.rating}</span>
                        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginTop: 2 }}>RATING</span>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                STATS STRIP
            ═══════════════════════════════════════════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', margin: '16px 24px 0', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)' }}>
                {([
                    { label: 'Games',    value: games.toLocaleString(),   color: undefined     },
                    { label: 'Wins',     value: wins.toLocaleString(),     color: '#4ade80'     },
                    { label: 'Losses',   value: losses.toLocaleString(),   color: '#f87171'     },
                    { label: 'Draws',    value: draws.toLocaleString(),    color: undefined     },
                    { label: 'Win Rate', value: `${winRate}%`,             color: C.text        },
                ] as { label: string; value: string; color?: string }[]).map((s, i, arr) => (
                    <div key={s.label} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.24)' }}>{s.label}</span>
                        <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.025em', color: s.color ?? 'rgba(255,255,255,0.82)' }}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════
                BODY: TIER  |  RATING HISTORY CHART
            ═══════════════════════════════════════════════════ */}
            <div style={{ display: 'grid', gridTemplateColumns: '175px 1fr', padding: '18px 24px', gap: 0 }}>
                {/* Left: Tier image + streak boxes */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingRight: 18, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 10px 10px', borderRadius: 14, width: '100%', background: `linear-gradient(145deg, ${C.glow.replace('0.28','0.10')} 0%, rgba(255,255,255,0.02) 100%)`, border: `1px solid ${C.primary}28` }}>
                        <img src={getTierImage(currentTier)} alt={currentTier} style={{ width: 64, height: 64, objectFit: 'contain', filter: `drop-shadow(0 0 12px ${C.primary}cc)`, marginBottom: 8 }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.10em', textTransform: 'uppercase', color: C.text }}>{currentTier}</span>
                            {subRoman && <span style={{ padding: '1px 6px', borderRadius: 5, fontSize: 10, fontWeight: 800, background: `${C.primary}1e`, border: `1px solid ${C.primary}44`, color: C.text }}>{subRoman}</span>}
                        </div>
                    </div>

                    {/* Streak 2×2 */}
                    <div style={{ width: '100%', padding: '10px 10px', borderRadius: 12, background: currentStreak > 0 ? 'linear-gradient(145deg, rgba(251,146,60,0.10) 0%, rgba(251,146,60,0.03) 100%)' : 'rgba(255,255,255,0.03)', border: currentStreak > 0 ? '1px solid rgba(251,146,60,0.28)' : '1px solid rgba(255,255,255,0.07)' }}>
                        <p style={{ margin: '0 0 8px', fontSize: 8, fontWeight: 800, letterSpacing: '0.20em', textTransform: 'uppercase', color: currentStreak > 0 ? 'rgba(251,146,60,0.65)' : 'rgba(255,255,255,0.22)' }}>Streak</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {[
                                { label: 'Current', value: String(currentStreak), unit: 'days', color: '#fb923c' },
                                { label: 'Best',    value: String(maxStreak),     unit: 'days', color: 'rgba(255,255,255,0.78)' },
                            ].map(item => (
                                <div key={item.label} style={{ borderRadius: 8, padding: '6px 8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                                    <p style={{ margin: 0, fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>{item.label}</p>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 3 }}>
                                        <span style={{ fontSize: 16, lineHeight: 1, fontWeight: 900, letterSpacing: '-0.02em', color: item.color }}>{item.value}</span>
                                        <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)' }}>{item.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Rating history SVG chart */}
                <div style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>Rating History</span>
                        {ratingChart && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 7, background: ratingChart.maxR >= ratingChart.minR ? 'rgba(74,222,128,0.10)' : 'rgba(248,113,113,0.10)', border: `1px solid ${ratingChart.maxR >= ratingChart.minR ? 'rgba(74,222,128,0.28)' : 'rgba(248,113,113,0.28)'}` }}>
                                <span style={{ fontSize: 9, fontWeight: 900, color: ratingChart.maxR >= ratingChart.minR ? '#4ade80' : '#f87171' }}>{ratingChart.maxR >= ratingChart.minR ? '▲' : '▼'}</span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: ratingChart.maxR >= ratingChart.minR ? '#4ade80' : '#f87171', letterSpacing: '-0.01em' }}>
                                    {ratingChart.maxR >= ratingChart.minR ? '+' : ''}{ratingChart.entries[ratingChart.entries.length - 1].rating - ratingChart.entries[0].rating}
                                </span>
                            </div>
                        )}
                    </div>

                    {ratingChart ? (
                        <div style={{ borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '8px 6px 6px', flex: 1 }}>
                            <svg width={ratingChart.W} height={ratingChart.H} style={{ display: 'block', width: '100%', height: 'auto' }}>
                                <defs>
                                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={C.primary} stopOpacity="0.35" />
                                        <stop offset="100%" stopColor={C.primary} stopOpacity="0.02" />
                                    </linearGradient>
                                </defs>

                                {/* Grid lines */}
                                {ratingChart.yLabels.map((r, i) => (
                                    <g key={i}>
                                        <line x1={ratingChart.pad.left} y1={ratingChart.yS(r)} x2={ratingChart.W - ratingChart.pad.right} y2={ratingChart.yS(r)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                                        <text x={ratingChart.pad.left - 4} y={ratingChart.yS(r) + 3} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.25)" fontFamily="Inter, sans-serif">{r}</text>
                                    </g>
                                ))}

                                {/* Area fill */}
                                <path d={ratingChart.areaPath} fill="url(#chartGrad)" />

                                {/* Line */}
                                <polyline points={ratingChart.linePts} fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Data points */}
                                {ratingChart.entries.map((e, i) => (
                                    <circle key={i} cx={ratingChart.xS(i)} cy={ratingChart.yS(e.rating)} r="2.5" fill={C.primary} stroke="#070d1a" strokeWidth="1.5" />
                                ))}

                                {/* X-axis labels */}
                                {ratingChart.xLabels.map((e, i) => {
                                    const idx = ratingChart.entries.indexOf(e);
                                    return (
                                        <text key={i} x={ratingChart.xS(idx)} y={ratingChart.H - 4} textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.22)" fontFamily="Inter, sans-serif">
                                            {e.ym.slice(2).replace('-', '/')}
                                        </text>
                                    );
                                })}
                            </svg>
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', minHeight: 120 }}>
                            <span style={{ fontSize: 20, opacity: 0.12 }}>♟</span>
                            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>No rating data</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                STREAK HEATMAP (last 26 weeks)
            ═══════════════════════════════════════════════════ */}
            <div style={{ margin: '0 24px 16px', padding: '12px 12px 10px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>Activity {selectedYear}</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.20)' }}>Less → More</span>
                </div>
                <div style={{ display: 'flex', gap: 2, width: '100%' }}>
                    {heatmapData.map((week, wi) => (
                        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                            {week.map((day) => (
                                <div key={day.date} style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 2, background: day.future ? 'rgba(255,255,255,0.02)' : getHeatColor(day.total), border: `1px solid ${day.future ? 'rgba(255,255,255,0.04)' : getHeatBorder(day.total)}` }} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                COLOR WIN RATE (white / black donuts)
            ═══════════════════════════════════════════════════ */}
            {colorStats && (() => {
                const wW = colorStats.white_wins, wD = colorStats.white_draws, wL = colorStats.white_losses;
                const bW = colorStats.black_wins, bD = colorStats.black_draws, bL = colorStats.black_losses;
                const wTotal = (wW + wD + wL) || 1;
                const bTotal = (bW + bD + bL) || 1;

                const DX = 44, DY = 44, DR = 32, DSW = 10;
                const CIRC = 2 * Math.PI * DR;
                const seg = (n: number, t: number) => (n / t) * CIRC;
                const rot = (deg: number) => `rotate(${deg} ${DX} ${DY})`;

                const wWinSeg  = seg(wW, wTotal), wDrawSeg = seg(wD, wTotal);
                const bWinSeg  = seg(bW, bTotal), bDrawSeg = seg(bD, bTotal);
                const wWinRot  = -90, wDrawRot = wWinRot + (wW / wTotal) * 360, wLossRot = wDrawRot + (wD / wTotal) * 360;
                const bWinRot  = -90, bDrawRot = bWinRot + (bW / bTotal) * 360, bLossRot = bDrawRot + (bD / bTotal) * 360;

                const DonutBox = ({ label, wins, draws, losses, total, winSeg, drawSeg, lossSeg, winRot: wr, drawRot: dr, lossRot: lr, winColor }: {
                    label: string; wins: number; draws: number; losses: number; total: number;
                    winSeg: number; drawSeg: number; lossSeg: number;
                    winRot: number; drawRot: number; lossRot: number; winColor: string;
                }) => (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ margin: 0, fontSize: 8, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', alignSelf: 'flex-start' }}>{label}</p>
                        <svg width={88} height={88} viewBox="0 0 88 88">
                            <circle cx={DX} cy={DY} r={DR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={DSW} />
                            <circle cx={DX} cy={DY} r={DR} fill="none" stroke="#f87171" strokeWidth={DSW} strokeDasharray={`${seg(losses, total)} ${CIRC - seg(losses, total)}`} transform={rot(lr)} />
                            <circle cx={DX} cy={DY} r={DR} fill="none" stroke="rgba(148,163,184,0.45)" strokeWidth={DSW} strokeDasharray={`${drawSeg} ${CIRC - drawSeg}`} transform={rot(dr)} />
                            <circle cx={DX} cy={DY} r={DR} fill="none" stroke={winColor} strokeWidth={DSW} strokeDasharray={`${winSeg} ${CIRC - winSeg}`} transform={rot(wr)} />
                            <text x={DX} y={DY - 3} textAnchor="middle" fontSize="12" fontWeight="900" fill="rgba(255,255,255,0.90)" fontFamily="Inter, sans-serif">{((wins / total) * 100).toFixed(1)}%</text>
                            <text x={DX} y={DY + 9} textAnchor="middle" fontSize="7" fontWeight="700" fill="rgba(255,255,255,0.28)" fontFamily="Inter, sans-serif">WIN</text>
                        </svg>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <span style={{ fontSize: 9, color: winColor }}>{wins}W</span>
                            <span style={{ fontSize: 9, color: 'rgba(148,163,184,0.50)' }}>{draws}D</span>
                            <span style={{ fontSize: 9, color: '#f87171' }}>{losses}L</span>
                        </div>
                    </div>
                );

                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', margin: '0 24px 16px', gap: 10 }}>
                        <DonutBox label="⬜ White" wins={wW} draws={wD} losses={wL} total={wTotal}
                            winSeg={wWinSeg} drawSeg={wDrawSeg} lossSeg={seg(wL, wTotal)}
                            winRot={wWinRot} drawRot={wDrawRot} lossRot={wLossRot}
                            winColor="rgba(255,255,255,0.85)" />
                        <DonutBox label="⬛ Black" wins={bW} draws={bD} losses={bL} total={bTotal}
                            winSeg={bWinSeg} drawSeg={bDrawSeg} lossSeg={seg(bL, bTotal)}
                            winRot={bWinRot} drawRot={bDrawRot} lossRot={bLossRot}
                            winColor={C.text} />
                    </div>
                );
            })()}

            {/* ═══════════════════════════════════════════════════
                FIRST MOVES (if available)
            ═══════════════════════════════════════════════════ */}
            {hasFirstMoves && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', margin: '0 24px 16px', gap: 10 }}>
                    {/* White moves */}
                    <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ margin: '0 0 8px', fontSize: 8, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>⬜ White First Moves</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {topWhite.map(([move, count]) => (
                                <div key={move}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                        <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.80)', fontFamily: 'monospace' }}>{move}</span>
                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}>{count}</span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: 2, background: 'rgba(255,255,255,0.55)', width: `${(count / whiteMax) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Black moves */}
                    <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <p style={{ margin: '0 0 8px', fontSize: 8, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>⬛ Black First Moves</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {topBlack.map(([move, count]) => (
                                <div key={move}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                        <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.80)', fontFamily: 'monospace' }}>{move}</span>
                                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)' }}>{count}</span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', borderRadius: 2, background: `${C.primary}cc`, width: `${(count / blackMax) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════ */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 24px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: '#000' }}>L</div>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>ChessLadder Player Card</span>
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)' }}>chessladder.org</span>
            </div>
        </div>
    );
};

export default ProfileCard;
