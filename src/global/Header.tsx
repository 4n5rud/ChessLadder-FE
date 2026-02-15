import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { UserPrincipal } from '../api/authService';
import { logout, isLoggedIn, getCurrentUser } from '../api/authService';
import { getUserProfile } from '../api/userService';
import { getOAuthUrl } from '../api/oauthService';
import { useLanguage, type Language } from '../context/LanguageContext';
import knightLogo from '../assets/images/tier/knight.png';
import lichessLogoImg from '../assets/images/logo/lichess-logo.png';

const Header = () => {
    const navigate = useNavigate();
    const { t, language, setLanguage } = useLanguage();
    const [isLogged, setIsLogged] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<UserPrincipal | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [bannerImage, setBannerImage] = useState<string | null>(null);

    // 로그인 상태 확인
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const loggedIn = await isLoggedIn();
                setIsLogged(loggedIn);
                if (loggedIn) {
                    const userData = await getCurrentUser();
                    setUser(userData);
                    
                    // 프로필을 조회하면서 이미지 가져오기
                    try {
                        const profileData = await getUserProfile();
                        if (profileData?.profile_image) {
                            setProfileImage(`${profileData.profile_image}?t=${Date.now()}`);
                        }
                        if (profileData?.banner_image) {
                            setBannerImage(`${profileData.banner_image}?t=${Date.now()}`);
                        }
                    } catch (error) {
                        // 프로필 이미지 로드 실패 (사용자 입장에서 로그 숨김)
                    }
                }
            } catch {
                setIsLogged(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkLoginStatus();
    }, []);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await logout();
            setIsLogged(false);
            setUser(null);
            setIsMenuOpen(false);
            window.location.href = '/';
        } catch (error) {
            alert('로그아웃 중 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };

    const handleLichessLogin = async () => {
        if (isLoginLoading) return;
        
        try {
            setIsLoginLoading(true);
            const res = await getOAuthUrl();
            
            const oauthUrl = res.data?.oauth_url || res.oauth_url || res.oauthUrl;
            
            if (!oauthUrl) {
                throw new Error(t('main.loginFailAlert'));
            }
            
            window.location.assign(oauthUrl);
            
            setTimeout(() => setIsLoginLoading(false), 5000);
            
        } catch (error: any) {
            alert(error.message || t('main.loginFailAlert'));
            setIsLoginLoading(false);
        }
    };

    const handleProfileClick = () => {
        setIsMenuOpen(false);
        navigate('/profile');
    };

    const handleMenuToggle = async () => {
        if (!isMenuOpen && isLogged) {
            // 메뉴를 열 때 최신 사용자 정보 다시 가져오기
            try {
                const currentUserData = await getCurrentUser();
                setUser(currentUserData);
                
                // 프로필을 조회하면서 이미지 가져오기
                try {
                    const profileData = await getUserProfile();
                    if (profileData?.profile_image) {
                        setProfileImage(`${profileData.profile_image}?t=${Date.now()}`);
                    }
                    if (profileData?.banner_image) {
                        setBannerImage(`${profileData.banner_image}?t=${Date.now()}`);
                    }
                } catch (error) {
                    // 프로필 이미지 로드 실패 (사용자 입장에서 로그 숨김)
                }
            } catch (error) {
                // 사용자 정보 갱신 실패 (사용자 입장에서 로그 숨김)
            }
        }
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        setIsMenuOpen(false);
    };

    return (
        <header className="relative sticky top-0 border-b border-gray-300 pb-1 pt-1 px-4 md:px-8 lg:px-30 w-full bg-white flex items-center gap-2 md:gap-8 h-14 min-h-0 z-50">
            <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition flex-shrink-0">
                <img src={knightLogo} alt="ChessLadder Logo" width="32" height="32"/>
                <h1 className="text-lg md:text-xl font-bold header-title text-[#2F639D] whitespace-nowrap">ChessLadder</h1>
            </Link>

            <div className="items-center flex-shrink-0 hidden md:flex gap-6 lg:gap-20 ml-auto text-[#2F639D] font-semibold transition text-sm md:text-base">
                <Link to="/page1" className="hover:text-[#1f4170] transition">{t('header.home')}</Link>
                <Link to="/news" className="hover:text-[#1f4170] transition">{t('header.news')}</Link>
                <Link to="/ranking" className="hover:text-[#1f4170] transition">{t('header.ranking')}</Link>
            </div>
            
            {/* 메뉴 버튼 (모바일과 데스크톱 공용) */}
            <div className="ml-auto flex items-center">
                {!isLoading && (
                    <div className="relative">
                        <button 
                            onClick={handleMenuToggle}
                            className="px-3 py-2 text-[#2F639D] hover:text-[#1f4170] transition"
                            title={t('header.menu')}
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                            </svg>
                        </button>
                        
                        {/* 드롭다운 메뉴 */}
                        {isMenuOpen && (
                            <div className="fixed top-14 right-4 md:right-6 w-72 md:w-80 rounded-lg shadow-xl border border-gray-200 z-[9999] overflow-hidden bg-white">
                                {isLogged ? (
                                    <>
                                        {/* 배너 배경 오버레이 (로그인 상태일 때만) */}
                                        <div 
                                            className="relative h-32 bg-gray-100"
                                            style={{
                                                backgroundImage: bannerImage ? `url(${bannerImage})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-black/40 pointer-events-none"></div>
                                            <div className="relative p-4 flex items-center gap-3 h-full">
                                                <div className="flex-shrink-0">
                                                    {profileImage ? (
                                                        <img 
                                                            src={profileImage} 
                                                            alt="Profile" 
                                                            className="w-16 h-16 rounded-full border-2 border-white object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="60" fill="%23999" text-anchor="middle" dy=".3em"%3E%3F%3C/text%3E%3C/svg%3E';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                                                            <span className="text-gray-600">?</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-bold text-lg drop-shadow">
                                                        {user?.user?.username || user?.username || t('profile.user')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="py-2 border-b border-gray-100">
                                            <button
                                                onClick={handleProfileClick}
                                                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition font-medium"
                                            >
                                                {t('header.myProfile')}
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition font-medium"
                                            >
                                                {t('header.logout')}
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="p-4 flex flex-col items-center gap-4 border-b border-gray-100">
                                        <p className="text-gray-500 text-sm text-center">{t('main.loginRequired')}</p>
                                        <button 
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                handleLichessLogin();
                                            }}
                                            disabled={isLoginLoading}
                                            className="flex items-center gap-2 bg-white text-black font-bold py-2 px-5 rounded-full shadow-md hover:bg-[#e6e6e6] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <img src={lichessLogoImg} alt="Lichess Logo" className="w-6 h-6" />
                                            {isLoginLoading ? t('profile.loading') : t('main.loginWithLichess')}
                                        </button>
                                    </div>
                                )}

                                {/* 네비게이션 (항상 표시) */}
                                <div className="py-2 border-b border-gray-100">
                                    <Link 
                                        to="/page1" 
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition font-medium"
                                    >
                                        {t('header.home')}
                                    </Link>
                                    <Link 
                                        to="/news" 
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition font-medium"
                                    >
                                        {t('header.news')}
                                    </Link>
                                    <Link 
                                        to="/ranking" 
                                        onClick={() => setIsMenuOpen(false)}
                                        className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition font-medium"
                                    >
                                        {t('header.ranking')}
                                    </Link>
                                </div>

                                {/* 언어 선택 (항상 표시) */}
                                <div className="p-4 bg-gray-50">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                        {t('header.changeLanguage')}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleLanguageChange('KR')}
                                            className={`flex-1 py-2.5 text-center text-sm font-bold rounded-lg transition ${
                                                language === 'KR' 
                                                    ? 'bg-[#2F639D] text-white shadow-md' 
                                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                        >
                                            한국어
                                        </button>
                                        <button
                                            onClick={() => handleLanguageChange('EN')}
                                            className={`flex-1 py-2.5 text-center text-sm font-bold rounded-lg transition ${
                                                language === 'EN' 
                                                    ? 'bg-[#2F639D] text-white shadow-md' 
                                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                        >
                                            English
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    )
}
export default Header;