
import Header from '../global/Header';
import Footer from '../global/Footer';
import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getOAuthUrl, getChesscomOAuthUrl } from '../api/oauthService';
import { loadAllNews, type NewsItem } from '../api/newsService';
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
    const [userCount, setUserCount] = useState<number>(0);
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
                {level: 'V', min: 400, max: 500},
                {level: 'IV', min: 501, max: 600},
                {level: 'III', min: 601, max: 700},
                {level: 'II', min: 701, max: 800},
                {level: 'I', min: 801, max: 900},
            ]
        },
        {
            name: 'KNIGHT',
            range: '901~1200',
            icon: knightImg,
            color: 'linear-gradient(135deg, #7CA0D0, #5C80B0)',
            levels: [
                {level: 'V', min: 901, max: 960},
                {level: 'IV', min: 961, max: 1020},
                {level: 'III', min: 1021, max: 1080},
                {level: 'II', min: 1081, max: 1140},
                {level: 'I', min: 1141, max: 1200},
            ]
        },
        {
            name: 'BISHOP',
            range: '1201~1500',
            icon: bishopImg,
            color: 'linear-gradient(135deg, #BFA7D2, #9F87B2)',
            levels: [
                {level: 'V', min: 1201, max: 1260},
                {level: 'IV', min: 1261, max: 1320},
                {level: 'III', min: 1321, max: 1380},
                {level: 'II', min: 1381, max: 1440},
                {level: 'I', min: 1441, max: 1500},
            ]
        },
        {
            name: 'ROOK',
            range: '1501~1800',
            icon: rookImg,
            color: 'linear-gradient(135deg, #E6B7C2, #C697A2)',
            levels: [
                {level: 'V', min: 1501, max: 1560},
                {level: 'IV', min: 1561, max: 1620},
                {level: 'III', min: 1621, max: 1680},
                {level: 'II', min: 1681, max: 1740},
                {level: 'I', min: 1741, max: 1800},
            ]
        },
        {
            name: 'QUEEN',
            range: '1801~2100',
            icon: queenImg,
            color: 'linear-gradient(135deg, #F5D06F, #D5B04F)',
            levels: [
                {level: 'V', min: 1801, max: 1860},
                {level: 'IV', min: 1861, max: 1920},
                {level: 'III', min: 1921, max: 1980},
                {level: 'II', min: 1981, max: 2040},
                {level: 'I', min: 2041, max: 2100},
            ]
        },
        {
            name: 'KING',
            range: '2101~2700+',
            icon: kingImg,
            color: 'linear-gradient(135deg, #F7E08C, #D7C06C)',
            levels: [
                {level: 'V', min: 2101, max: 2220},
                {level: 'IV', min: 2221, max: 2340},
                {level: 'III', min: 2341, max: 2460},
                {level: 'II', min: 2461, max: 2580},
                {level: 'I', min: 2581, max: '2700+'},
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
                {level: 'V', min: 100, max: 220},
                {level: 'IV', min: 221, max: 340},
                {level: 'III', min: 341, max: 460},
                {level: 'II', min: 461, max: 580},
                {level: 'I', min: 581, max: 700},
            ]
        },
        {
            name: 'KNIGHT',
            range: '701~1100',
            icon: knightImg,
            color: 'linear-gradient(135deg, #7CA0D0, #5C80B0)',
            levels: [
                {level: 'V', min: 701, max: 780},
                {level: 'IV', min: 781, max: 860},
                {level: 'III', min: 861, max: 940},
                {level: 'II', min: 941, max: 1020},
                {level: 'I', min: 1021, max: 1100},
            ]
        },
        {
            name: 'BISHOP',
            range: '1101~1500',
            icon: bishopImg,
            color: 'linear-gradient(135deg, #BFA7D2, #9F87B2)',
            levels: [
                {level: 'V', min: 1101, max: 1180},
                {level: 'IV', min: 1181, max: 1260},
                {level: 'III', min: 1261, max: 1340},
                {level: 'II', min: 1341, max: 1420},
                {level: 'I', min: 1421, max: 1500},
            ]
        },
        {
            name: 'ROOK',
            range: '1501~1800',
            icon: rookImg,
            color: 'linear-gradient(135deg, #E6B7C2, #C697A2)',
            levels: [
                {level: 'V', min: 1501, max: 1560},
                {level: 'IV', min: 1561, max: 1620},
                {level: 'III', min: 1621, max: 1680},
                {level: 'II', min: 1681, max: 1740},
                {level: 'I', min: 1741, max: 1800},
            ]
        },
        {
            name: 'QUEEN',
            range: '1801~2200',
            icon: queenImg,
            color: 'linear-gradient(135deg, #F5D06F, #D5B04F)',
            levels: [
                {level: 'V', min: 1801, max: 1880},
                {level: 'IV', min: 1881, max: 1960},
                {level: 'III', min: 1961, max: 2040},
                {level: 'II', min: 2041, max: 2120},
                {level: 'I', min: 2121, max: 2200},
            ]
        },
        {
            name: 'KING',
            range: '2201~2800+',
            icon: kingImg,
            color: 'linear-gradient(135deg, #F7E08C, #D7C06C)',
            levels: [
                {level: 'V', min: 2201, max: 2320},
                {level: 'IV', min: 2321, max: 2440},
                {level: 'III', min: 2441, max: 2560},
                {level: 'II', min: 2561, max: 2680},
                {level: 'I', min: 2681, max: '2800+'},
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

    // 사용자 수 조회
    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const { api } = await import('../api/apiClient');
                const data = await api('/user/count');
                
                // 새 명세서: { data: { totalCount } }
                const userCountValue = data.data?.totalCount ?? data.totalCount ?? data.data?.count ?? data.count ?? 0;
                
                setUserCount(userCountValue);
            } catch (err) {
                // 사용자 수 조회 실패
                setUserCount(0);
            }
        };

        fetchUserCount();
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
            <main className="hero-glow-bg relative flex flex-col items-center justify-center min-h-screen px-4 text-center pb-24 overflow-hidden">
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
                <div className="relative flex flex-col sm:flex-row gap-3 items-center fade-in-bottom-section" style={{animationDelay: '1.5s'}}>
                    {/* 비로그인: 두 버튼 모두 표시 / 로그인: 해당 플랫폼 버튼만 표시 */}
                    {(!user || user.platform === 'LICHESS') && (
                        <button
                            onClick={handleLichessLogin}
                            disabled={isLoading || !!user}
                            className="flex items-center gap-3 bg-white border border-white text-black font-semibold py-3 px-7 rounded-full backdrop-blur-sm hover:bg-gray-100 hover:border-gray-200 transition text-base disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <img src={lichessLogoImg} alt="Lichess" className="w-7 h-7 object-contain" />
                            {isLoading ? t('profile.loading') : (user ? t('profile.alreadyLoggedIn') : t('main.loginWithLichess'))}
                        </button>
                    )}
                    {(!user || user.platform === 'CHESSCOM') && (
                        <button
                            onClick={handleChesscomLogin}
                            disabled={isChesscomLoading || !!user}
                            className="flex items-center gap-3 bg-[#81B64C] border border-[#6a9e3a] text-white font-semibold py-3 px-7 rounded-full hover:bg-[#70a33e] transition text-base disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <img src={chesscomLogoImg} alt="Chess.com" className="w-7 h-7 object-contain" />
                            {isChesscomLoading ? t('profile.loading') : (user ? t('profile.alreadyLoggedIn') : t('main.loginWithChesscom'))}
                        </button>
                    )}
                </div>

                {/* Stats cards */}
                <div className="relative pt-16 flex flex-col sm:flex-row gap-4 items-stretch w-full max-w-xl mx-auto fade-in-bottom-section" style={{animationDelay: '1.5s'}}>
                    <div className="glass-card-info flex-1 p-5 text-center">
                        <p className="text-xs text-white/35 uppercase tracking-widest mb-1">{t('main.recentUsers')}</p>
                        <p className="text-2xl font-bold text-white">{userCount.toLocaleString()}<span className="text-white/40 text-base font-normal ml-1">{t('main.users')}</span></p>
                    </div>
                    <div
                        onClick={() => navigate('/news')}
                        className="glass-card-info flex-1 p-5 cursor-pointer hover:bg-white/[0.07] transition text-left"
                    >
                        <p className="text-xs text-white/35 uppercase tracking-widest mb-2">{t('main.recentNews')}</p>
                        {recentNews ? (
                            <>
                                <p className="text-sm text-white/80 font-medium leading-snug mb-2 line-clamp-2">{recentNews.title}</p>
                                <span className="text-xs text-[#86ABD7] hover:underline">{t('main.viewMore')}</span>
                            </>
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

            {/* ── Community & Support ── */}
            <div className="w-full bg-[#070d1a] border-t border-white/5">
                <div className="flex flex-col sm:flex-row gap-12 pt-12 pb-16 px-4 md:px-8 max-w-5xl mx-auto text-white">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold mb-4">{t('main.discordLink')}</h2>
                        <a
                            href="https://discord.gg/8VkKJte5sz"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-2.5 px-6 rounded-full transition text-sm"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.975 14.975 0 0 0 1.293-2.1a.07.07 0 0 0-.038-.098a13.11 13.11 0 0 1-1.872-.892a.072.072 0 0 1-.007-.12a10.15 10.15 0 0 0 .372-.294a.074.074 0 0 1 .076-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .076.01c.12.098.246.198.373.294a.072.072 0 0 1-.006.12a12.98 12.98 0 0 1-1.873.892a.07.07 0 0 0-.037.099a14.992 14.992 0 0 0 1.293 2.1a.074.074 0 0 0 .084.028a19.963 19.963 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.057c.5-4.569-.838-8.54-3.549-12.267a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156c0-1.193.966-2.157 2.157-2.157c1.193 0 2.157.964 2.157 2.157c0 1.19-.964 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156c0-1.193.966-2.157 2.157-2.157c1.193 0 2.157.964 2.157 2.157c0 1.19-.964 2.156-2.157 2.156z"/>
                            </svg>
                            {t('main.joinDiscord')}
                        </a>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold mb-4">{t('main.buyMeCoffee')}</h2>
                        <a
                            href="https://buymeacoffee.com/4n5rud"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-white/8 border border-white/12 hover:bg-white/12 text-white font-semibold py-2.5 px-6 rounded-full transition text-sm"
                        >
                            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
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