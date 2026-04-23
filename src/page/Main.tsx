
import Header from '../global/Header';
import Footer from '../global/Footer';
import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getOAuthUrl, getChesscomOAuthUrl } from '../api/oauthService';
import { loadAllNews, type NewsItem } from '../api/newsService';
import { getPlatformStats, type PlatformStatsResponse } from '../api/userService';
import { useLanguage } from '../context/LanguageContext';
import { useAuthStore } from '../store/authStore';
import pawnImg from '../assets/images/tier/pawn.png';
import knightImg from '../assets/images/tier/knight.png';
import bishopImg from '../assets/images/tier/vishop.png';
import rookImg from '../assets/images/tier/rook.png';
import queenImg from '../assets/images/tier/queen.png';
import kingImg from '../assets/images/tier/king.png';
import lichessLogoImg from '../assets/images/logo/lichess-logo.png';
import chesscomLogoImg from '../assets/images/logo/chesscom-logo.png';

interface TierData {
    name: string;
    range: string;
    icon: string;
    color: string;
    levels: { level: string; min: number; max: number | string }[];
}

function Main() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [isChesscomLoading, setIsChesscomLoading] = useState(false);
    const [platformStats, setPlatformStats] = useState<PlatformStatsResponse>({ lichessCount: 0, chesscomCount: 0, totalCount: 0 });
    const [selectedTier, setSelectedTier] = useState<string | null>('KNIGHT');
    const [selectedPlatform, setSelectedPlatform] = useState<'lichess' | 'chesscom'>('lichess');
    const [recentNews, setRecentNews] = useState<NewsItem | null>(null);
    
    // Zustand store에서 로그인 상태 구독
    const user = useAuthStore((state) => state.user);

    // Lichess 티어 데이터
    const lichessTierData: TierData[] = [
        {
            name: 'PAWN',
            range: '400~900',
            icon: pawnImg,
            color: 'linear-gradient(135deg, #C0A060, #A0805F)',
            levels: [
                {level: 'Ⅴ', min: 400, max: 500},
                {level: 'Ⅳ', min: 501, max: 600},
                {level: 'Ⅲ', min: 601, max: 700},
                {level: 'Ⅱ', min: 701, max: 800},
                {level: 'Ⅰ', min: 801, max: 900},
            ]
        },
        {
            name: 'KNIGHT',
            range: '901~1200',
            icon: knightImg,
            color: 'linear-gradient(135deg, #7CA0D0, #5C80B0)',
            levels: [
                {level: 'Ⅴ', min: 901, max: 960},
                {level: 'Ⅳ', min: 961, max: 1020},
                {level: 'Ⅲ', min: 1021, max: 1080},
                {level: 'Ⅱ', min: 1081, max: 1140},
                {level: 'Ⅰ', min: 1141, max: 1200},
            ]
        },
        {
            name: 'BISHOP',
            range: '1201~1500',
            icon: bishopImg,
            color: 'linear-gradient(135deg, #BFA7D2, #9F87B2)',
            levels: [
                {level: 'Ⅴ', min: 1201, max: 1260},
                {level: 'Ⅳ', min: 1261, max: 1320},
                {level: 'Ⅲ', min: 1321, max: 1380},
                {level: 'Ⅱ', min: 1381, max: 1440},
                {level: 'Ⅰ', min: 1441, max: 1500},
            ]
        },
        {
            name: 'ROOK',
            range: '1501~1800',
            icon: rookImg,
            color: 'linear-gradient(135deg, #E6B7C2, #C697A2)',
            levels: [
                {level: 'Ⅴ', min: 1501, max: 1560},
                {level: 'Ⅳ', min: 1561, max: 1620},
                {level: 'Ⅲ', min: 1621, max: 1680},
                {level: 'Ⅱ', min: 1681, max: 1740},
                {level: 'Ⅰ', min: 1741, max: 1800},
            ]
        },
        {
            name: 'QUEEN',
            range: '1801~2100',
            icon: queenImg,
            color: 'linear-gradient(135deg, #F5D06F, #D5B04F)',
            levels: [
                {level: 'Ⅴ', min: 1801, max: 1860},
                {level: 'Ⅳ', min: 1861, max: 1920},
                {level: 'Ⅲ', min: 1921, max: 1980},
                {level: 'Ⅱ', min: 1981, max: 2040},
                {level: 'Ⅰ', min: 2041, max: 2100},
            ]
        },
        {
            name: 'KING',
            range: '2101~2700+',
            icon: kingImg,
            color: 'linear-gradient(135deg, #F7E08C, #D7C06C)',
            levels: [
                {level: 'Ⅴ', min: 2101, max: 2220},
                {level: 'Ⅳ', min: 2221, max: 2340},
                {level: 'Ⅲ', min: 2341, max: 2460},
                {level: 'Ⅱ', min: 2461, max: 2580},
                {level: 'Ⅰ', min: 2581, max: '2700+'},
            ]
        },
    ];

    // Chess.com 티어 데이터
    const chesscomTierData: TierData[] = [
        {
            name: 'PAWN',
            range: '100~700',
            icon: pawnImg,
            color: 'linear-gradient(135deg, #C0A060, #A0805F)',
            levels: [
                {level: 'Ⅴ', min: 100, max: 220},
                {level: 'Ⅳ', min: 221, max: 340},
                {level: 'Ⅲ', min: 341, max: 460},
                {level: 'Ⅱ', min: 461, max: 580},
                {level: 'Ⅰ', min: 581, max: 700},
            ]
        },
        {
            name: 'KNIGHT',
            range: '701~1100',
            icon: knightImg,
            color: 'linear-gradient(135deg, #7CA0D0, #5C80B0)',
            levels: [
                {level: 'Ⅴ', min: 701, max: 780},
                {level: 'Ⅳ', min: 781, max: 860},
                {level: 'Ⅲ', min: 861, max: 940},
                {level: 'Ⅱ', min: 941, max: 1020},
                {level: 'Ⅰ', min: 1021, max: 1100},
            ]
        },
        {
            name: 'BISHOP',
            range: '1101~1500',
            icon: bishopImg,
            color: 'linear-gradient(135deg, #BFA7D2, #9F87B2)',
            levels: [
                {level: 'Ⅴ', min: 1101, max: 1180},
                {level: 'Ⅳ', min: 1181, max: 1260},
                {level: 'Ⅲ', min: 1261, max: 1340},
                {level: 'Ⅱ', min: 1341, max: 1420},
                {level: 'Ⅰ', min: 1421, max: 1500},
            ]
        },
        {
            name: 'ROOK',
            range: '1501~1800',
            icon: rookImg,
            color: 'linear-gradient(135deg, #E6B7C2, #C697A2)',
            levels: [
                {level: 'Ⅴ', min: 1501, max: 1560},
                {level: 'Ⅳ', min: 1561, max: 1620},
                {level: 'Ⅲ', min: 1621, max: 1680},
                {level: 'Ⅱ', min: 1681, max: 1740},
                {level: 'Ⅰ', min: 1741, max: 1800},
            ]
        },
        {
            name: 'QUEEN',
            range: '1801~2200',
            icon: queenImg,
            color: 'linear-gradient(135deg, #F5D06F, #D5B04F)',
            levels: [
                {level: 'Ⅴ', min: 1801, max: 1880},
                {level: 'Ⅳ', min: 1881, max: 1960},
                {level: 'Ⅲ', min: 1961, max: 2040},
                {level: 'Ⅱ', min: 2041, max: 2120},
                {level: 'Ⅰ', min: 2121, max: 2200},
            ]
        },
        {
            name: 'KING',
            range: '2201~2800+',
            icon: kingImg,
            color: 'linear-gradient(135deg, #F7E08C, #D7C06C)',
            levels: [
                {level: 'Ⅴ', min: 2201, max: 2320},
                {level: 'Ⅳ', min: 2321, max: 2440},
                {level: 'Ⅲ', min: 2441, max: 2560},
                {level: 'Ⅱ', min: 2561, max: 2680},
                {level: 'Ⅰ', min: 2681, max: '2800+'},
            ]
        },
    ];

    const tierData = selectedPlatform === 'lichess' ? lichessTierData : chesscomTierData;

    const handleLichessLogin = async () => {
        if (isLoading) return;
        try {
            setIsLoading(true);
            const result = await getOAuthUrl();
            if (!result.success || !result.oauth_url) throw new Error(t('main.loginFailAlert'));
            sessionStorage.setItem('oauth_platform', 'LICHESS');
            window.location.href = result.oauth_url;
        } catch (error) {
            setIsLoading(false);
        }
    };

    const handleChesscomLogin = async () => {
        if (isChesscomLoading) return;
        try {
            setIsChesscomLoading(true);
            const result = await getChesscomOAuthUrl();
            if (!result.success || !result.oauth_url) throw new Error(t('main.loginFailAlert'));
            sessionStorage.setItem('oauth_platform', 'CHESSCOM');
            window.location.href = result.oauth_url;
        } catch (error) {
            setIsChesscomLoading(false);
        }
    };

    // 플랫폼별 사용자 수 조회
    useEffect(() => {
        getPlatformStats().then(setPlatformStats);
    }, []);

    // 최근 뉴스 로드
    useEffect(() => {
        const fetchRecentNews = async () => {
            try {
                const news = await loadAllNews();
                if (news.length > 0) {
                    setRecentNews(news[0]);
                }
            } catch (err) {
                // 최근 뉴스 로드 실패
            }
        };

        fetchRecentNews();
    }, []);
    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#070d1a]">
            <Header />

            {/* ── Hero Section ── */}
            <main className="hero-glow-bg relative flex flex-col items-center justify-start min-h-screen px-4 text-center pt-[14vh] pb-16 overflow-hidden">
                {/* Chess grid overlay */}
                <div className="chess-grid absolute inset-0 pointer-events-none" />

                {/* Floating orb accents */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#2F639D]/7 rounded-full blur-[140px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-[#1a6b8a]/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Floating tier pieces — drift across full screen */}
                {([
                    // 중앙 상단 근처
                    { src: kingImg,   cls: 'anim-float-a', top: '8%',  left: '20%',  w: 70,  op: 0.13, dur: '22s', delay: '0s'    },
                    { src: queenImg,  cls: 'anim-float-b', top: '5%',  left: '50%',  w: 58,  op: 0.11, dur: '19s', delay: '-6s'   },
                    { src: rookImg,   cls: 'anim-float-c', top: '10%', left: '72%',  w: 48,  op: 0.10, dur: '26s', delay: '-12s'  },
                    // 중앙
                    { src: bishopImg, cls: 'anim-float-d', top: '30%', left: '15%',  w: 54,  op: 0.09, dur: '24s', delay: '-4s'   },
                    { src: knightImg, cls: 'anim-float-a', top: '35%', left: '42%',  w: 44,  op: 0.08, dur: '30s', delay: '-17s'  },
                    { src: pawnImg,   cls: 'anim-float-b', top: '28%', left: '65%',  w: 36,  op: 0.09, dur: '21s', delay: '-9s'   },
                    { src: queenImg,  cls: 'anim-float-c', top: '38%', left: '82%',  w: 62,  op: 0.10, dur: '27s', delay: '-3s'   },
                    // 중앙 하단
                    { src: kingImg,   cls: 'anim-float-d', top: '55%', left: '8%',   w: 50,  op: 0.09, dur: '23s', delay: '-14s'  },
                    { src: rookImg,   cls: 'anim-float-a', top: '58%', left: '32%',  w: 42,  op: 0.08, dur: '28s', delay: '-7s'   },
                    { src: bishopImg, cls: 'anim-float-b', top: '52%', left: '58%',  w: 56,  op: 0.09, dur: '20s', delay: '-20s'  },
                    { src: knightImg, cls: 'anim-float-c', top: '60%', left: '78%',  w: 46,  op: 0.08, dur: '25s', delay: '-11s'  },
                    // 하단
                    { src: pawnImg,   cls: 'anim-float-d', top: '76%', left: '12%',  w: 34,  op: 0.07, dur: '32s', delay: '-5s'   },
                    { src: queenImg,  cls: 'anim-float-a', top: '78%', left: '38%',  w: 52,  op: 0.08, dur: '18s', delay: '-16s'  },
                    { src: kingImg,   cls: 'anim-float-b', top: '80%', left: '62%',  w: 40,  op: 0.07, dur: '29s', delay: '-8s'   },
                    { src: rookImg,   cls: 'anim-float-c', top: '75%', left: '85%',  w: 44,  op: 0.07, dur: '22s', delay: '-22s'  },
                    // 추가 — 빈 공간 채우기
                    { src: bishopImg, cls: 'anim-float-a', top: '18%', left: '88%',  w: 38,  op: 0.07, dur: '35s', delay: '-26s'  },
                    { src: pawnImg,   cls: 'anim-float-d', top: '45%', left: '25%',  w: 30,  op: 0.06, dur: '33s', delay: '-30s'  },
                    { src: knightImg, cls: 'anim-float-b', top: '90%', left: '48%',  w: 36,  op: 0.06, dur: '31s', delay: '-18s'  },
                ] as const).map(({ src, cls, top, left, w, op, dur, delay }, i) => (
                    <img
                        key={i}
                        src={src}
                        alt=""
                        aria-hidden="true"
                        className={`float-piece ${cls}`}
                        style={{
                            top, left,
                            width: w,
                            opacity: op,
                            '--dur': dur,
                            animationDelay: delay,
                        } as React.CSSProperties}
                    />
                ))}

                {/* Title */}
                <h1 className="relative font-extrabold tracking-tight mb-3 fade-in-title">
                    <span className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl text-white drop-shadow-lg">
                        ChessLadder
                    </span>
                </h1>
                <h2 className="relative text-lg md:text-xl text-white/40 font-medium mb-14 fade-in-subtitle tracking-wide">
                    {t('main.tagline')}
                </h2>

                {/* Tier icons */}
                <div className="relative grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-5 mb-14 w-full max-w-2xl mx-auto">
                    {[
                        {src: pawnImg, label: 'Pawn'},
                        {src: knightImg, label: 'Knight'},
                        {src: bishopImg, label: 'Bishop'},
                        {src: rookImg, label: 'Rook'},
                        {src: queenImg, label: 'Queen'},
                        {src: kingImg, label: 'King'},
                    ].map(({src, label}, index) => (
                        <div key={label} className="flex flex-col items-center group tier-item" style={{animationDelay: `${1 + index * 0.1}s`}}>
                            <div className="glass-card tier-card-3d aspect-square w-full flex items-center justify-center">
                                <img src={src} alt={label} className="w-10 h-10 md:w-14 md:h-14 object-contain drop-shadow-lg" />
                            </div>
                            <span className="mt-2 text-xs md:text-sm text-white/35 font-semibold tracking-wider group-hover:text-white/70 transition">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Login buttons */}
                {!user && (
                    <div className="relative flex flex-col sm:flex-row gap-3 items-center fade-in-bottom-section" style={{animationDelay: '1.5s'}}>
                        <button
                            onClick={handleLichessLogin}
                            disabled={isLoading}
                            className="flex items-center gap-3 bg-white border border-white text-black font-semibold py-3 px-7 rounded-full backdrop-blur-sm hover:bg-gray-100 hover:border-gray-200 transition text-base disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <img src={lichessLogoImg} alt="Lichess" className="w-7 h-7 object-contain" />
                            {isLoading ? t('profile.loading') : t('main.loginWithLichess')}
                        </button>
                        <button
                            onClick={handleChesscomLogin}
                            disabled={isChesscomLoading}
                            className="flex items-center gap-3 bg-[#81B64C] border border-[#6a9e3a] text-white font-semibold py-3 px-7 rounded-full hover:bg-[#70a33e] transition text-base disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <img src={chesscomLogoImg} alt="Chess.com" className="w-7 h-7 object-contain rounded-sm" />
                            {isChesscomLoading ? t('profile.loading') : t('main.loginWithChesscom')}
                        </button>
                    </div>
                )}

                {/* Stats cards */}
                <div className="relative flex flex-col gap-2 items-stretch w-full max-w-xl mx-auto mt-3 md:mt-4 fade-in-bottom-section" style={{animationDelay: '1.5s'}}>

                    {/* 카드 1: 플랫폼별 유저 VS */}
                    <div className="glass-card-info w-full p-3">
                        <p className="text-[10px] text-white/35 uppercase tracking-widest mb-2">{t('main.recentUsers')}</p>
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center">
                                    <img src={lichessLogoImg} alt="Lichess" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <span className="text-lg font-black text-white leading-none">{platformStats.lichessCount.toLocaleString()}</span>
                                <span className="text-[10px] text-white/35 uppercase tracking-wider leading-none">Lichess</span>
                            </div>
                            <span className="text-xl font-black text-white/15 pb-1">VS</span>
                            <div className="flex flex-col items-center gap-1.5">
                                <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center">
                                    <img src={chesscomLogoImg} alt="Chess.com" className="w-4 h-4 object-contain" />
                                </div>
                                <span className="text-lg font-black text-white leading-none">{platformStats.chesscomCount.toLocaleString()}</span>
                                <span className="text-[10px] text-white/35 uppercase tracking-wider leading-none">Chess.com</span>
                            </div>
                        </div>
                        {(() => {
                            const total = platformStats.totalCount;
                            const lichessPct = total > 0 ? Math.round((platformStats.lichessCount / total) * 100) : 50;
                            const chesscomPct = 100 - lichessPct;
                            const isEmpty = total === 0;
                            return (
                                <>
                                    <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden flex">
                                        {!isEmpty && (
                                            <>
                                                <div className="h-full bg-white/60 transition-all duration-700" style={{ width: `${lichessPct}%` }} />
                                                <div className="h-full bg-[#81b64c]/80 transition-all duration-700" style={{ width: `${chesscomPct}%` }} />
                                            </>
                                        )}
                                    </div>
                                    <div className="flex justify-between mt-0.5">
                                        <span className="text-[10px] text-white/30">{isEmpty ? '-' : `${lichessPct}%`}</span>
                                        <span className="text-[10px] text-white/30">{isEmpty ? '-' : `${chesscomPct}%`}</span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>

                    {/* 카드 2: 최근 소식 */}
                    <div
                        className="glass-card-info w-full p-4 cursor-pointer hover:bg-white/[0.07] transition"
                        onClick={() => navigate('/news')}
                    >
                        <p className="text-[11px] text-white/35 uppercase tracking-widest mb-2">{t('main.recentNews')}</p>
                        {recentNews ? (
                            <div className="group">
                                <p className="text-[13px] text-white/80 font-medium leading-snug mb-1.5 line-clamp-2 group-hover:text-white transition">{recentNews.title}</p>
                                <span className="text-xs text-[#86ABD7]">{t('main.viewMore')}</span>
                            </div>
                        ) : (
                            <p className="text-xs text-white/25">{t('common.noData')}</p>
                        )}
                    </div>

                </div>
            </main>

            <Outlet />

            {/* ── Tier System Section ── */}
            <div className="w-full bg-[#070d1a] border-t border-white/5">
                <div className="flex flex-col pt-20 md:pt-32 pb-16 md:pb-24 px-4 md:px-8 max-w-5xl mx-auto text-white">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">{t('main.tierSystem')}</h2>
                    <p className="text-sm md:text-base mb-10 text-white/45">{t('main.tierDescription')}</p>

                    {/* Platform Tabs */}
                    <div className="flex gap-2 mb-8 border-b border-white/10">
                        <button
                            onClick={() => { setSelectedPlatform('lichess'); setSelectedTier(null); }}
                            className={`pb-3 px-0 text-sm md:text-base font-semibold transition border-b-2 ${
                                selectedPlatform === 'lichess'
                                    ? 'text-white border-b-white'
                                    : 'text-white/60 hover:text-white border-b-transparent hover:border-white/20'
                            }`}
                        >
                            Lichess
                        </button>
                        <button
                            onClick={() => { setSelectedPlatform('chesscom'); setSelectedTier(null); }}
                            className={`pb-3 px-4 text-sm md:text-base font-semibold transition border-b-2 ${
                                selectedPlatform === 'chesscom'
                                    ? 'text-white border-b-white'
                                    : 'text-white/60 hover:text-white border-b-transparent hover:border-white/20'
                            }`}
                        >
                            Chess.com
                        </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 md:gap-4 mb-10 w-full">
                        {tierData.map(tier => (
                            <div
                                key={tier.name}
                                className="flex flex-col items-center cursor-pointer group"
                                onClick={() => setSelectedTier(selectedTier === tier.name ? null : tier.name)}
                            >
                                <div
                                    className={`aspect-square w-full rounded-xl flex items-center justify-center mb-2 transition-all duration-200 group-hover:scale-105 border bg-white/5 ${
                                        selectedTier === tier.name
                                            ? 'border-white/30 ring-1 ring-white/15'
                                            : 'border-white/8 hover:border-white/18'
                                    }`}
                                >
                                    <img src={tier.icon} alt={tier.name} className="w-10 h-14 md:w-11 md:h-15 object-contain" />
                                </div>
                                <span className="text-xs font-semibold text-white/45 group-hover:text-white/70 transition text-center">{tier.name}</span>
                            </div>
                        ))}
                    </div>

                    {selectedTier && (
                        <div className="rounded-xl p-6 border border-white/8 bg-white/4">
                            {tierData.find(t => t.name === selectedTier) && (
                                <>
                                    <div className="flex items-center gap-4 mb-5">
                                        <img src={tierData.find(t => t.name === selectedTier)?.icon} alt={selectedTier} className="w-10 h-14 object-contain" />
                                        <div>
                                            <h3 className="text-2xl font-bold">{selectedTier}</h3>
                                            <p className="text-sm text-white/50">{tierData.find(t => t.name === selectedTier)?.range}</p>
                                        </div>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-white/10">
                                                <th className="pb-2 font-semibold text-white/60">{t('main.stage')}</th>
                                                <th className="pb-2 font-semibold text-white/60">{t('main.ratingRange')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tierData.find(t => t.name === selectedTier)?.levels.map(lv => (
                                                <tr key={lv.level} className="border-b border-white/5 hover:bg-white/5 transition">
                                                    <td className="py-2 font-semibold">{lv.level}</td>
                                                    <td className="py-2 text-white/70">{lv.min} ~ {lv.max}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── 서비스 소개 섹션 ── */}
            <div className="w-full bg-[#070d1a] border-t border-white/5">
                <div className="max-w-5xl mx-auto px-4 md:px-8 pt-20 pb-24 text-white">
                    <h2 className="text-2xl md:text-3xl font-bold mb-6">ChessLadder</h2>
                    <p className="text-white/55 text-base leading-relaxed mb-4 max-w-2xl">
                        {t('main.ratedGameDesc')}
                    </p>
                    <p className="text-white/55 text-base leading-relaxed max-w-2xl">
                        {t('main.platformSupport')}
                    </p>
                    <div className="flex items-center gap-6 mt-6">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                <img src={lichessLogoImg} alt="Lichess" className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
                            </div>
                            <span className="text-white/70 text-sm font-medium">Lichess</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                                <img src={chesscomLogoImg} alt="Chess.com" className="w-4 h-4 object-contain rounded-sm" />
                            </div>
                            <span className="text-white/70 text-sm font-medium">Chess.com</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 커뮤니티 & 지원 ── */}
            <div className="w-full bg-[#070d1a] border-t border-white/5">
                <div className="flex flex-col sm:flex-row gap-8 pt-12 pb-16 px-4 md:px-8 max-w-5xl mx-auto text-white">
                    <div className="flex-1 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-2xl p-6">
                        <h2 className="text-base font-bold mb-1">{t('main.discordLink')}</h2>
                        <p className="text-xs text-white/40 mb-4">{t('main.discordDesc') || '개발 소식과 커뮤니티에 참여하세요'}</p>
                        <a
                            href="https://discord.gg/8VkKJte5sz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-2 px-5 rounded-full transition text-sm"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            {t('main.joinDiscord')}
                        </a>
                    </div>
                    <div className="flex-1 bg-yellow-400/5 border border-yellow-400/15 rounded-2xl p-6">
                        <h2 className="text-base font-bold mb-1">{t('main.buyMeCoffee')}</h2>
                        <p className="text-xs text-white/40 mb-4">{t('main.coffeeDesc') || '서버 운영을 도와주세요 ☕'}</p>
                        <a
                            href="https://buymeacoffee.com/4n5rud"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-yellow-400/15 border border-yellow-400/25 hover:bg-yellow-400/25 text-yellow-300 font-semibold py-2 px-5 rounded-full transition text-sm"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/>
                            </svg>
                            Buy Me a Coffee
                        </a>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}

export default Main;