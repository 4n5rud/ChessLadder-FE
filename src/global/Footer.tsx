import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Footer = () => {
    const { t } = useLanguage();
    return (
        <footer className="w-full bg-white text-[#0a1f33]">
            <div className="py-8 md:py-12">
                <div className="max-w-6xl mx-auto px-3 md:px-4">
                    {/* 상단 - 링크 그룹 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                        {/* 빠른 링크 */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">{t('footer.quickLinks')}</h3>
                            <ul className="space-y-2">
                                <li>
                                    <Link to="/" className="text-gray-600 hover:text-[#0a1f33] transition">{t('header.home')}</Link>
                                </li>
                                <li>
                                    <Link to="/news" className="text-gray-600 hover:text-[#0a1f33] transition">{t('header.news')}</Link>
                                </li>
                                <li>
                                    <Link to="/ranking" className="text-gray-600 hover:text-[#0a1f33] transition">{t('header.ranking')}</Link>
                                </li>
                            </ul>
                        </div>

                        {/* 커뮤니티 */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">{t('footer.community')}</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a href="https://discord.gg/8VkKJte5sz" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#0a1f33] transition">Discord</a>
                                </li>
                                <li>
                                    <a href="mailto:contact@chessmatelink.com" className="text-gray-600 hover:text-[#0a1f33] transition">{t('footer.contact')}</a>
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
                        <p>{t('footer.copyright')}</p>
                        <p>{t('footer.poweredBy')}</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
