import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { logout, getCurrentUser, initializeAuth } from '../api/authService';
import { getUserCard, type UserCardResponse } from '../api/userService';
import { getOAuthUrl, getChesscomOAuthUrl } from '../api/oauthService';
import { useLanguage, type Language } from '../context/LanguageContext';
import { useAuthStore } from '../store/authStore';
import UserSearchBar from '../components/UserSearchBar';
import knightLogo from '../assets/images/tier/knight.png';
import lichessLogoImg from '../assets/images/logo/lichess-logo.png';
import chesscomLogoImg from '../assets/images/logo/chesscom-logo.png';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, language, setLanguage } = useLanguage();
    const [isLogged, setIsLogged] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [isChesscomLoginLoading, setIsChesscomLoginLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cardInfo, setCardInfo] = useState<UserCardResponse | null>(null);
    const storeUser = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);

    const isProfileRoute = location.pathname === '/profile' || location.pathname.startsWith('/profile/');
    const queryPlatform = new URLSearchParams(location.search).get('platform');
    const headerSearchPlatform: 'LICHESS' | 'CHESSCOM' =
        queryPlatform?.toUpperCase() === 'CHESSCOM'
            ? 'CHESSCOM'
            : (storeUser?.platform === 'CHESSCOM' ? 'CHESSCOM' : 'LICHESS');

    const loadCard = async () => {
        try {
            const card = await getUserCard();
            if (card) setCardInfo(card);
        } catch {
            // 무시
        }
    };

    // 로그인 상태 확인
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const userData = await initializeAuth();
                if (userData) {
                    setIsLogged(true);
                    useAuthStore.getState().setUser(userData);
                    await loadCard();
                } else {
                    setIsLogged(false);
                    setCardInfo(null);
                    useAuthStore.getState().clearUser();
                }
            } catch {
                setIsLogged(false);
                setCardInfo(null);
                useAuthStore.getState().clearUser();
            } finally {
                setIsLoading(false);
            }
        };
        checkLoginStatus();
    }, []);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            // logout()은 명세서 Step 8 구현
            const success = await logout();
            setIsLogged(false);
            setUser(null);
            setIsMenuOpen(false);
            if (success) {
                window.location.href = '/';
            }
        } catch (error) {
            // 로그아웃 중 오류 (사용자에게 표시 안 함)
            setIsLoading(false);
        }
    };

    const handleLichessLogin = async () => {
        if (isLoginLoading) return;
        try {
            setIsLoginLoading(true);
            const result = await getOAuthUrl();
            if (!result.success || !result.oauth_url) throw new Error(t('main.loginFailAlert'));
            sessionStorage.setItem('oauth_platform', 'LICHESS');
            window.location.href = result.oauth_url;
        } catch (error: any) {
            setIsLoginLoading(false);
        }
    };

    const handleChesscomLogin = async () => {
        if (isChesscomLoginLoading) return;
        try {
            setIsChesscomLoginLoading(true);
            const result = await getChesscomOAuthUrl();
            if (!result.success || !result.oauth_url) throw new Error(t('main.loginFailAlert'));
            sessionStorage.setItem('oauth_platform', 'CHESSCOM');
            window.location.href = result.oauth_url;
        } catch (error: any) {
            setIsChesscomLoginLoading(false);
        }
    };

    const handleProfileClick = () => {
        setIsMenuOpen(false);
        navigate('/profile');
    };

    const handleMenuToggle = async () => {
        if (!isMenuOpen && isLogged) {
            try {
                await getCurrentUser();
                await loadCard();
            } catch {
                // 무시
            }
        }
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        setIsMenuOpen(false);
    };

    return (
        <header className="relative sticky top-0 border-b border-white/8 pb-1 pt-1 px-4 md:px-8 lg:px-30 w-full bg-[#070d1a] flex items-center gap-2 md:gap-8 h-14 min-h-0 z-50">
            <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition flex-shrink-0">
                <img src={knightLogo} alt="ChessLadder Logo" width="32" height="32"/>
                <h1 className="text-lg md:text-xl font-bold header-title text-white whitespace-nowrap">ChessLadder</h1>
            </Link>

            {isProfileRoute && (
                <div className="flex-1 min-w-0 max-w-md">
                    <UserSearchBar defaultPlatform={headerSearchPlatform} />
                </div>
            )}

            {/* 메뉴 버튼 (모바일과 데스크톱 공용) */}
            <div className="ml-auto flex items-center">
                <div className="relative">
                    <button 
                        onClick={handleMenuToggle}
                        className="px-3 py-2 text-white/60 hover:text-white transition"
                        title={t('header.menu')}
                        disabled={isLoading}
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                        </svg>
                    </button>
                    
                    {/* 드롭다운 메뉴 */}
                    {isMenuOpen && (
                        <div className="fixed top-14 right-4 md:right-6 w-72 md:w-80 rounded-lg shadow-2xl border border-white/10 z-[9999] overflow-hidden bg-[#0d1626]">
                            {isLoading ? (
                                <div className="p-4 flex flex-col items-center justify-center min-h-40">
                                    <div className="w-10 h-10 border-4 border-[#2F639D] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-white/40 mt-3 text-sm">{t('common.loading')}</p>
                                </div>
                            ) : (
                                <>
                                    {isLogged ? (
                                        <>
                                            {/* 배너 + 유저 정보 */}
                                            <div
                                                className="relative h-32 bg-[#0a1120]"
                                                style={{
                                                    backgroundImage: cardInfo?.bannerImageUrl ? `url(${cardInfo.bannerImageUrl})` : 'none',
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                                                <div className="relative p-4 flex items-center gap-3 h-full">
                                                    {/* 프로필 이미지 */}
                                                    <div className="flex-shrink-0">
                                                        {cardInfo?.profileImageUrl ? (
                                                            <img
                                                                src={cardInfo.profileImageUrl}
                                                                alt="Profile"
                                                                className="w-14 h-14 rounded-xl border-2 border-white/30 object-cover shadow-lg"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-14 h-14 rounded-xl border-2 border-white/20 bg-white/10 flex items-center justify-center">
                                                                <span className="text-white/40 text-xl">♟</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {/* 유저 이름 + 플랫폼 배지 */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white font-bold text-base drop-shadow truncate mb-1.5">
                                                            {cardInfo?.username || t('profile.user')}
                                                        </p>
                                                        {cardInfo?.platform === 'CHESSCOM' ? (
                                                            <div className="inline-flex items-center gap-1.5 bg-[#81B64C] rounded-full px-2.5 py-1 shadow-sm">
                                                                <img src={chesscomLogoImg} alt="Chess.com" className="w-3.5 h-3.5 object-contain rounded-sm" />
                                                                <span className="text-white text-[11px] font-bold leading-none">Chess.com</span>
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 shadow-sm">
                                                                <img src={lichessLogoImg} alt="Lichess" className="w-3.5 h-3.5 object-contain" />
                                                                <span className="text-black text-[11px] font-bold leading-none">Lichess</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="py-2 border-b border-white/8">
                                                <button
                                                    onClick={handleProfileClick}
                                                    className="w-full text-left px-4 py-3 text-white/75 hover:bg-white/8 transition font-medium"
                                                >
                                                    {t('header.myProfile')}
                                                </button>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-3 text-white/75 hover:bg-white/8 transition font-medium"
                                                >
                                                    {t('header.logout')}
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-4 flex flex-col items-center gap-3 border-b border-white/8">
                                            <p className="text-white/40 text-sm text-center">{t('main.loginRequired')}</p>
                                            {/* Lichess 로그인 */}
                                            <button
                                                onClick={() => { setIsMenuOpen(false); handleLichessLogin(); }}
                                                disabled={isLoginLoading}
                                                className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold py-2 px-5 rounded-full shadow-md hover:bg-[#e6e6e6] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <img src={lichessLogoImg} alt="Lichess Logo" className="w-6 h-6" />
                                                {isLoginLoading ? t('profile.loading') : t('main.loginWithLichess')}
                                            </button>
                                            {/* Chess.com 로그인 */}
                                            <button
                                                onClick={() => { setIsMenuOpen(false); handleChesscomLogin(); }}
                                                disabled={isChesscomLoginLoading}
                                                className="w-full flex items-center justify-center gap-2 bg-[#81B64C] text-white font-bold py-2 px-5 rounded-full shadow-md hover:bg-[#6a9e3a] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <img src={chesscomLogoImg} alt="Chess.com Logo" className="w-7 h-7 object-contain" />
                                                {isChesscomLoginLoading ? t('profile.loading') : t('main.loginWithChesscom')}
                                            </button>
                                        </div>
                                    )}

                                    {/* 네비게이션 (항상 표시) */}
                                    <div className="py-2 border-b border-white/8">
                                        <Link
                                            to="/"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block w-full text-left px-4 py-3 text-white/75 hover:bg-white/8 transition font-medium"
                                        >
                                            {t('header.home')}
                                        </Link>
                                        <Link
                                            to="/news"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block w-full text-left px-4 py-3 text-white/75 hover:bg-white/8 transition font-medium"
                                        >
                                            {t('header.news')}
                                        </Link>
                                        <Link
                                            to="/ranking"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block w-full text-left px-4 py-3 text-white/75 hover:bg-white/8 transition font-medium"
                                        >
                                            {t('header.ranking')}
                                        </Link>
                                    </div>

                                    {/* 언어 선택 (항상 표시) */}
                                    <div className="p-4 bg-[#060c18] border-t border-white/8">
                                        <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
                                            {t('header.changeLanguage')}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleLanguageChange('KR')}
                                                className={`flex-1 py-2.5 text-center text-sm font-bold rounded-lg transition ${
                                                    language === 'KR'
                                                        ? 'bg-[#2F639D] text-white'
                                                        : 'bg-white/8 text-white/60 hover:bg-white/12 border border-white/15'
                                                }`}
                                            >
                                                한국어
                                            </button>
                                            <button
                                                onClick={() => handleLanguageChange('EN')}
                                                className={`flex-1 py-2.5 text-center text-sm font-bold rounded-lg transition ${
                                                    language === 'EN'
                                                        ? 'bg-[#2F639D] text-white'
                                                        : 'bg-white/8 text-white/60 hover:bg-white/12 border border-white/15'
                                                }`}
                                            >
                                                English
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
export default Header;