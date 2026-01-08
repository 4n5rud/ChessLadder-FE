import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="w-full bg-white text-[#0a1f33] py-12">
            <div className="max-w-6xl mx-auto px-4">
                {/* 상단 - 링크 그룹 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* 빠른 링크 */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">빠른 링크</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" className="text-gray-600 hover:text-[#0a1f33] transition">홈</Link>
                            </li>
                            <li>
                                <Link to="/page2" className="text-gray-600 hover:text-[#0a1f33] transition">소식</Link>
                            </li>
                            <li>
                                <Link to="/page3" className="text-gray-600 hover:text-[#0a1f33] transition">랭킹</Link>
                            </li>
                        </ul>
                    </div>

                    {/* 커뮤니티 */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">커뮤니티</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="https://discord.gg/chessmatelink" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#0a1f33] transition">Discord</a>
                            </li>
                            <li>
                                <a href="mailto:contact@chessmatelink.com" className="text-gray-600 hover:text-[#0a1f33] transition">문의하기</a>
                            </li>
                        </ul>
                    </div>

                    {/* 기타 */}
                    {/* <div>
                        <h3 className="text-lg font-bold mb-4">정보</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-600 hover:text-[#0a1f33] transition">개인정보처리방침</a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 hover:text-[#0a1f33] transition">이용약관</a>
                            </li>
                        </ul>
                    </div> */}
                </div>

                {/* 구분선 */}
                <hr className="border-gray-300 mb-8" />

                {/* 하단 - 저작권 정보 */}
                <div className="flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
                    <p>&copy; 2026 ChessMate. All rights reserved.</p>
                    <p>Powered by Lichess API</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
