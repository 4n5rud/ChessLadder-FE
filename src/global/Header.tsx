import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { UserPrincipal } from '../api/authService';
import { logout, isLoggedIn, getCurrentUser } from '../api/authService';
import knightLogo from '../assets/images/tier/knight.png';

const Header = () => {
    const navigate = useNavigate();
    const [isLogged, setIsLogged] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState<UserPrincipal | null>(null);

    // 로그인 상태 확인
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const loggedIn = await isLoggedIn();
                setIsLogged(loggedIn);
                if (loggedIn) {
                    const userData = await getCurrentUser();
                    setUser(userData);
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

    return (
        <header className="relative sticky border-b border-gray-300 pb-1 pt-1 pl-30 pr-30 mb-2 w-full bg-white flex items-center gap-2 h-14 min-h-0">
            <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition">
                <img src={knightLogo} alt="ChessLadder Logo" width="32" height="32"/>
                <h1 className="text-xl font-bold header-title text-[#2F639D]">ChessLadder</h1>
            </Link>

            <div className="items-center flex gap-20 ml-auto text-[#2F639D] font-semibold transition text-l">
                <Link to="/page1">홈</Link>
                <Link to="/page2">소식</Link>
                <Link to="/page3">랭킹</Link>
                {!isLoading && (
                    isLogged ? (
                        <div className="relative">
                            <button 
                                onClick={handleMenuToggle}
                                className="px-3 py-2 text-[#2F639D] hover:text-[#1f4170] transition"
                                title="메뉴"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                                </svg>
                            </button>
                            
                            {/* 드롭다운 메뉴 */}
                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <p className="text-sm text-gray-600">계정</p>
                                        <p className="font-semibold text-[#2F639D]">{user?.username || '사용자'}</p>
                                    </div>
                                    <button
                                        onClick={handleProfileClick}
                                        className="w-full text-left px-4 py-2 text-[#2F639D] hover:bg-gray-100 transition border-b border-gray-100"
                                    >
                                        내 프로필
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-[#2F639D] hover:bg-gray-100 transition"
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="px-4 py-2 bg-[#2F639D] text-white rounded hover:bg-[#1f4170] transition">
                            로그인
                        </button>
                    )
                )}
            </div>
        </header>
    )
}
export default Header;