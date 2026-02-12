import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { UserPrincipal } from '../api/authService';
import { logout, isLoggedIn, getCurrentUser } from '../api/authService';
import { getImageUrl } from '../api/imageService';
import { useLanguage, type Language } from '../context/LanguageContext';
import knightLogo from '../assets/images/tier/knight.png';

const Header = () => {
    const navigate = useNavigate();
    const { t, language, setLanguage } = useLanguage();
    const [isLogged, setIsLogged] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
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
                    
                    // 프로필과 배너 이미지 가져오기
                    try {
                        const profileUrl = await getImageUrl('PROFILE');
                        const profileUrlWithTimestamp = `${profileUrl}?t=${Date.now()}`;
                        setProfileImage(profileUrlWithTimestamp);
                        
                        const bannerUrl = await getImageUrl('BANNER');
                        const bannerUrlWithTimestamp = `${bannerUrl}?t=${Date.now()}`;
                        setBannerImage(bannerUrlWithTimestamp);
                    } catch (error) {
                        console.warn('[Header] Failed to load images:', error);
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
            navigate('/');
        } catch (error) {
            console.error('로그아웃 실패:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
            setIsLoading(false);
        }
    };

    const handleProfileClick = () => {
        setIsMenuOpen(false);
        navigate('/profile');
    };

    const handleMenuToggle = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
        setIsMenuOpen(false);
    };

    return (
        <header className="relative sticky top-0 border-b border-gray-300 pb-1 pt-1 pl-30 pr-30 w-full bg-white flex items-center gap-2 h-14 min-h-0 z-50">
            <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
                <img src={knightLogo} alt="ChessLadder Logo" width="32" height="32"/>
                <h1 className="text-xl font-bold header-title text-[#2F639D]">ChessLadder</h1>
            </Link>

            <div className="items-center flex gap-20 ml-auto text-[#2F639D] font-semibold transition text-l">
                <Link to="/page1">{t('header.home')}</Link>
                <Link to="/page2">{t('header.news')}</Link>
                <Link to="/page3">{t('header.ranking')}</Link>
                
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
                            <div className="fixed top-14 right-6 w-80 rounded-lg shadow-xl border border-gray-200 z-[9999] overflow-hidden bg-white">
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
                                                    <img 
                                                        src={profileImage || ''} 
                                                        alt="Profile" 
                                                        className="w-16 h-16 rounded-full border-2 border-white object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3Ctext x="50" y="50" font-size="60" fill="%23999" text-anchor="middle" dy=".3em"%3E%3F%3C/text%3E%3C/svg%3E';
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-white font-bold text-lg drop-shadow">
                                                        {user?.username || t('profile.user')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="py-2">
                                            <button
                                                onClick={handleProfileClick}
                                                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition border-b border-gray-100 font-medium"
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
                                    <div className="p-4 text-center border-b border-gray-100">
                                        <p className="text-gray-500 text-sm">{t('main.loginRequired')}</p>
                                    </div>
                                )}

                                {/* 언어 선택 (항상 표시) */}
                                <div className="p-4 bg-gray-50 border-t border-gray-100">
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