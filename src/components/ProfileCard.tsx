import React, { useState } from 'react';
import type { ProfileResponse, UserPerfResponse, DailyStreakDto } from '../api/userService';
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

const MONTH_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const ProfileCard: React.FC<ProfileCardProps> = ({
    profile,
    userPerf,
    ratingHistory,
    streakMap,
    selectedYear: _sy,
    gameType,
    promotionThresholds: _pt,
    convertSubTierToRoman: _cstr,
    cardRef,
    platform,
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

    // ── Streak ──────────────────────────────────────────────────
    const currentStreak = (() => {
        if (!streakMap || streakMap.size === 0) return 0;
        const today = new Date();
        let streak = 0;
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const entry = streakMap.get(d.toISOString().slice(0, 10));
            const has = entry
                ? ((entry as any).hasGame !== undefined ? (entry as any).hasGame : entry.total > 0)
                : false;
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
            const has = (entry as any).hasGame !== undefined ? (entry as any).hasGame : entry.total > 0;
            if (has) { temp++; max = Math.max(max, temp); }
            else temp = 0;
        }
        return max;
    })();

    // ── Stats ───────────────────────────────────────────────────
    const games   = userPerf.gamesPlayed ?? 0;
    const wins    = userPerf.wins        ?? 0;
    const losses  = userPerf.losses      ?? 0;
    const draws   = userPerf.draws       ?? 0;
    const winRate = games > 0 ? ((wins / games) * 100).toFixed(1) : '0.0';
    const label   = gameType.toUpperCase();

    const streakSummary = (() => {
        let totalGames = 0;
        let activeDays = 0;
        for (const [, entry] of Array.from(streakMap.entries())) {
            const total = Number(entry.total ?? 0) || 0;
            totalGames += total;
            if (total > 0) activeDays += 1;
        }
        return { totalGames, activeDays };
    })();

    // ── Year/Month rating dots ─────────────────────────────────
    const monthlyHistory = (() => {
        const byMonth = new Map<string, number>();
        const rows = Array.isArray(ratingHistory) ? ratingHistory : [];

        for (const row of rows) {
            const ym = typeof row?.yearMonth === 'string' ? row.yearMonth : null;
            const rating = Number(row?.rating ?? NaN);
            if (!ym || !/^\d{4}-\d{2}$/.test(ym) || Number.isNaN(rating)) continue;
            byMonth.set(ym, rating);
        }

        const entries = Array.from(byMonth.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([yearMonth, rating]) => ({ yearMonth, rating }));

        const yearSet = new Set(entries.map((e) => e.yearMonth.slice(0, 4)));
        const years = Array.from(yearSet).sort((a, b) => a.localeCompare(b)).slice(-3);

        const matrix: Record<string, Record<number, number>> = {};
        years.forEach((y) => { matrix[y] = {}; });
        entries.forEach((e) => {
            const y = e.yearMonth.slice(0, 4);
            const m = Number(e.yearMonth.slice(5, 7));
            if (!matrix[y] || m < 1 || m > 12) return;
            matrix[y][m] = e.rating;
        });

        const first = entries[0]?.rating ?? null;
        const last = entries[entries.length - 1]?.rating ?? null;
        const delta = first !== null && last !== null ? last - first : null;
        const trendUp = delta !== null ? delta >= 0 : null;

        return { years, matrix, count: entries.length, first, last, delta, trendUp };
    })();

    const getRatingDotColor = (rating: number): string => {
        const info = getTierInfo(rating, platform);
        return TIER_COLORS[info.tier]?.primary ?? 'rgba(255,255,255,0.7)';
    };

    // ── Banner background ────────────────────────────────────────
    const hasBanner = !!bannerImgSrc;

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
            <div style={{ position: 'relative', height: 280 }}>
                {/* Background: photo or tier gradient */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: hasBanner ? '#000' : C.bannerGradient,
                }} />
                {hasBanner && (
                    <img
                        src={bannerImgSrc!}
                        alt=""
                        onError={() => setBannerImgSrc(null)}
                        style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%', objectFit: 'cover',
                        }}
                    />
                )}

                {/* Vignette: strong bottom darkening */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(7,13,26,0.05) 0%, rgba(7,13,26,0.30) 40%, rgba(7,13,26,0.88) 80%, #070d1a 100%)',
                }} />

                {/* Tier-color ambient glow (top-right) */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `radial-gradient(ellipse at 75% 10%, ${C.glow} 0%, transparent 62%)`,
                    mixBlendMode: hasBanner ? 'screen' : 'normal',
                }} />

                {/* ── Game type chip (top-right) ── */}
                <div style={{
                    position: 'absolute', top: 20, right: 22,
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 13px', borderRadius: 9,
                    background: `${C.primary}1a`,
                    border: `1px solid ${C.primary}44`,
                    backdropFilter: 'blur(4px)',
                }}>
                    {getGameIcon(gameType) && (
                        <img src={getGameIcon(gameType)!} alt="" style={{ width: 13, height: 13, objectFit: 'contain', opacity: 0.9 }} />
                    )}
                    <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.20em',
                        textTransform: 'uppercase', color: C.text,
                    }}>{label}</span>
                </div>

                {/* ── Bottom overlay row: avatar + info + rating ── */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '0 24px 22px',
                    display: 'flex', alignItems: 'flex-end', gap: 18,
                }}>
                    {/* Avatar + tier badge */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <img
                            src={profileImgSrc}
                            alt="Profile"
                            onError={() => setProfileImgSrc(PLACEHOLDER_SVG)}
                            style={{
                                width: 90, height: 90, borderRadius: 20,
                                objectFit: 'cover',
                                border: `2.5px solid ${C.primary}55`,
                                boxShadow: `0 0 28px ${C.glow}, 0 8px 24px rgba(0,0,0,0.50)`,
                            }}
                        />
                        <div style={{
                            position: 'absolute', bottom: -8, right: -8,
                            width: 30, height: 30, borderRadius: 8,
                            background: '#0c1524',
                            border: `1.5px solid ${C.primary}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        }}>
                            <img src={getTierImage(currentTier)} alt={currentTier} style={{ width: 18, height: 18, objectFit: 'contain' }} />
                        </div>
                    </div>

                    {/* Name + tier label */}
                    <div style={{ flex: 1, paddingBottom: 4, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7, flexWrap: 'wrap' }}>
                            <h2 style={{
                                margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: '-0.025em',
                                color: '#ffffff', lineHeight: 1,
                                textShadow: '0 2px 16px rgba(0,0,0,0.60)',
                            }}>{profile.username}</h2>
                            {profile.title && (
                                <span style={{
                                    padding: '2px 8px', borderRadius: 6,
                                    fontSize: 10, fontWeight: 800, letterSpacing: '0.15em',
                                    textTransform: 'uppercase',
                                    background: `${C.primary}1e`,
                                    border: `1px solid ${C.primary}40`,
                                    color: C.text,
                                }}>{profile.title}</span>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <span style={{
                                fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                color: `${C.text}bb`,
                            }}>{currentTier}{subRoman ? ` ${subRoman}` : ''}</span>

                            {profile.description && (
                                <>
                                    <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: 10 }}>·</span>
                                    <span style={{
                                        fontSize: 11, color: 'rgba(255,255,255,0.40)',
                                        fontStyle: 'italic',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        maxWidth: 220,
                                    }}>"{profile.description}"</span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Rating (right-aligned, large) */}
                    <div style={{
                        flexShrink: 0, paddingBottom: 4,
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                    }}>
                        <span style={{
                            fontSize: 52, fontWeight: 900, lineHeight: 1,
                            letterSpacing: '-0.035em', color: '#ffffff',
                            textShadow: `0 0 32px ${C.glow}, 0 2px 20px rgba(0,0,0,0.5)`,
                        }}>{userPerf.rating}</span>
                        <span style={{
                            fontSize: 8, fontWeight: 800, letterSpacing: '0.22em',
                            textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
                            marginTop: 2,
                        }}>RATING</span>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                BODY  (2-col: tier+streak | rating month dots)
            ═══════════════════════════════════════════════════ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '210px 1fr',
                padding: '22px 24px',
                gap: 0,
            }}>
                {/* ── Left column ─────────────────────────────── */}
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: 14,
                    paddingRight: 20,
                    borderRight: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {/* Tier card */}
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        padding: '18px 12px 14px',
                        borderRadius: 16,
                        background: `linear-gradient(145deg, ${C.glow.replace('0.28','0.12')} 0%, rgba(255,255,255,0.02) 100%)`,
                        border: `1px solid ${C.primary}28`,
                    }}>
                        <img
                            src={getTierImage(currentTier)}
                            alt={currentTier}
                            style={{
                                width: 68, height: 68, objectFit: 'contain',
                                filter: `drop-shadow(0 0 12px ${C.primary}cc)`,
                                marginBottom: 10,
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 0 }}>
                            <span style={{
                                fontSize: 12, fontWeight: 800, letterSpacing: '0.10em',
                                textTransform: 'uppercase', color: C.text,
                            }}>{currentTier}</span>
                            {subRoman && (
                                <span style={{
                                    padding: '1px 7px', borderRadius: 5,
                                    fontSize: 11, fontWeight: 800,
                                    background: `${C.primary}1e`,
                                    border: `1px solid ${C.primary}44`,
                                    color: C.text,
                                }}>{subRoman}</span>
                            )}
                        </div>
                    </div>

                    {/* Streak summary */}
                    <div style={{
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: currentStreak > 0
                            ? 'linear-gradient(145deg, rgba(251,146,60,0.10) 0%, rgba(251,146,60,0.04) 100%)'
                            : 'rgba(255,255,255,0.03)',
                        border: currentStreak > 0
                            ? '1px solid rgba(251,146,60,0.28)'
                            : '1px solid rgba(255,255,255,0.07)',
                    }}>
                        <p style={{
                            margin: '0 0 10px', fontSize: 8, fontWeight: 800,
                            letterSpacing: '0.22em', textTransform: 'uppercase',
                            color: currentStreak > 0 ? 'rgba(251,146,60,0.65)' : 'rgba(255,255,255,0.22)',
                        }}>Streak Summary</p>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                        }}>
                            {[
                                { label: 'Current', value: currentStreak.toLocaleString(), unit: 'days', color: '#fb923c' },
                                { label: 'Best', value: maxStreak.toLocaleString(), unit: 'days', color: 'rgba(255,255,255,0.78)' },
                                { label: 'Active', value: streakSummary.activeDays.toLocaleString(), unit: 'days', color: 'rgba(255,255,255,0.72)' },
                                { label: 'Games', value: streakSummary.totalGames.toLocaleString(), unit: 'total', color: 'rgba(255,255,255,0.88)' },
                            ].map((item) => (
                                <div
                                    key={item.label}
                                    style={{
                                        borderRadius: 10,
                                        padding: '8px 9px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        background: 'rgba(255,255,255,0.03)',
                                    }}
                                >
                                    <p style={{
                                        margin: 0,
                                        fontSize: 8,
                                        fontWeight: 700,
                                        letterSpacing: '0.13em',
                                        textTransform: 'uppercase',
                                        color: 'rgba(255,255,255,0.30)',
                                    }}>{item.label}</p>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                                        <span style={{
                                            fontSize: 17,
                                            lineHeight: 1,
                                            fontWeight: 900,
                                            letterSpacing: '-0.02em',
                                            color: item.color,
                                        }}>{item.value}</span>
                                        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)' }}>{item.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Right column: year/month dots ─────────────── */}
                <div style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                            fontSize: 8, fontWeight: 800, letterSpacing: '0.22em',
                            textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)',
                        }}>Rating History (Y/M)</span>
                        {monthlyHistory.delta !== null && monthlyHistory.trendUp !== null && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '4px 10px', borderRadius: 7,
                                background: monthlyHistory.trendUp ? 'rgba(74,222,128,0.10)' : 'rgba(248,113,113,0.10)',
                                border: `1px solid ${monthlyHistory.trendUp ? 'rgba(74,222,128,0.28)' : 'rgba(248,113,113,0.28)'}`,
                            }}>
                                <span style={{
                                    fontSize: 9, fontWeight: 900,
                                    color: monthlyHistory.trendUp ? '#4ade80' : '#f87171',
                                }}>{monthlyHistory.trendUp ? '▲' : '▼'}</span>
                                <span style={{
                                    fontSize: 12, fontWeight: 800,
                                    color: monthlyHistory.trendUp ? '#4ade80' : '#f87171',
                                    letterSpacing: '-0.01em',
                                }}>
                                    {monthlyHistory.delta > 0 ? '+' : ''}{monthlyHistory.delta}
                                </span>
                            </div>
                        )}
                    </div>

                    {monthlyHistory.count > 0 ? (
                        <>
                            <div style={{
                                borderRadius: 12,
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                padding: '10px 10px 8px',
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '34px repeat(12, 1fr)', gap: 4 }}>
                                    <div />
                                    {MONTH_SHORT.map((m) => (
                                        <div key={m} style={{ textAlign: 'center', fontSize: 8, color: 'rgba(255,255,255,0.22)', fontWeight: 700 }}>
                                            {m}
                                        </div>
                                    ))}

                                    {monthlyHistory.years.map((year) => (
                                        <React.Fragment key={year}>
                                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', fontWeight: 700, paddingTop: 2 }}>
                                                {year.slice(2)}
                                            </div>
                                            {Array.from({ length: 12 }, (_, idx) => idx + 1).map((month) => {
                                                const rating = monthlyHistory.matrix[year]?.[month];
                                                const hasData = typeof rating === 'number';
                                                return (
                                                    <div
                                                        key={`${year}-${month}`}
                                                        title={hasData ? `${year}-${String(month).padStart(2, '0')}: ${rating}` : `${year}-${String(month).padStart(2, '0')}: no data`}
                                                        style={{
                                                            width: 11,
                                                            height: 11,
                                                            borderRadius: 999,
                                                            justifySelf: 'center',
                                                            alignSelf: 'center',
                                                            background: hasData ? getRatingDotColor(rating as number) : 'rgba(255,255,255,0.06)',
                                                            border: hasData ? '1px solid rgba(255,255,255,0.45)' : '1px solid rgba(255,255,255,0.10)',
                                                            boxShadow: hasData ? '0 0 8px rgba(255,255,255,0.10)' : 'none',
                                                        }}
                                                    />
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>Start</span>
                                    <span style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.02em' }}>
                                        {monthlyHistory.first?.toLocaleString() ?? '-'}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.12)' }} />
                                    <span style={{
                                        fontSize: 8, fontWeight: 700, letterSpacing: '0.16em',
                                        textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)',
                                    }}>Year / Month Dots</span>
                                    <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.12)' }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>Now</span>
                                    <span style={{
                                        fontSize: 15,
                                        fontWeight: 800,
                                        color: monthlyHistory.last ? getRatingDotColor(monthlyHistory.last) : 'rgba(255,255,255,0.45)',
                                        letterSpacing: '-0.02em',
                                    }}>
                                        {monthlyHistory.last?.toLocaleString() ?? '-'}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            flex: 1,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 8,
                            borderRadius: 14,
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            minHeight: 138,
                        }}>
                            <span style={{ fontSize: 24, opacity: 0.12 }}>♟</span>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', fontWeight: 600 }}>
                                No rating data
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                STATS STRIP
            ═══════════════════════════════════════════════════ */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                margin: '0 24px 20px',
                borderRadius: 14, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.07)',
            }}>
                {([
                    { label: 'Games',    value: games.toLocaleString(),   color: undefined         },
                    { label: 'Wins',     value: wins.toLocaleString(),     color: '#4ade80'         },
                    { label: 'Losses',   value: losses.toLocaleString(),   color: '#f87171'         },
                    { label: 'Draws',    value: draws.toLocaleString(),    color: undefined         },
                    { label: 'Win Rate', value: `${winRate}%`,             color: C.text            },
                ] as { label: string; value: string; color?: string }[]).map((s, i, arr) => (
                    <div
                        key={s.label}
                        style={{
                            padding: '11px 14px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                            display: 'flex', flexDirection: 'column', gap: 4,
                        }}
                    >
                        <span style={{
                            fontSize: 7, fontWeight: 800, letterSpacing: '0.18em',
                            textTransform: 'uppercase', color: 'rgba(255,255,255,0.24)',
                        }}>{s.label}</span>
                        <span style={{
                            fontSize: 19, fontWeight: 900, lineHeight: 1,
                            letterSpacing: '-0.025em',
                            color: s.color ?? 'rgba(255,255,255,0.82)',
                        }}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════════════════ */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 24px 15px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: C.primary,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 900, color: '#000',
                    }}>L</div>
                    <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.09em',
                        textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)',
                    }}>ChessLadder Player Card</span>
                </div>
                <span style={{
                    fontSize: 9, fontWeight: 600, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)',
                }}>chessladder.org</span>
            </div>
        </div>
    );
};

export default ProfileCard;
