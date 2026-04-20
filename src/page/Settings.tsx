import { useState } from 'react';
import Header from '../global/Header';
import Footer from '../global/Footer';
import { useAuthStore } from '../store/authStore';
import { deleteAccount } from '../api/userService';
import { useLanguage } from '../context/LanguageContext';
import lichessLogoImg  from '../assets/images/logo/lichess-logo.png';
import chesscomLogoImg from '../assets/images/logo/chesscom-logo.png';

const Settings = () => {
    const user = useAuthStore((state) => state.user);
    const { t, language, setLanguage } = useLanguage();
    const isKR = language === 'KR';

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            await deleteAccount();
            window.location.href = '/';
        } catch {
            setDeletingAccount(false);
            setShowDeleteConfirm(false);
        }
    };

    const platform = user?.platform ?? 'LICHESS';
    const platformLogo = platform === 'CHESSCOM' ? chesscomLogoImg : lichessLogoImg;
    const platformName = platform === 'CHESSCOM' ? 'Chess.com' : 'Lichess';
    const platformBg   = platform === 'CHESSCOM' ? 'bg-[#81b64c]' : 'bg-white';

    return (
        <div className="min-h-screen bg-[#070d1a] flex flex-col">
            <Header />

            <main className="flex-1 max-w-2xl w-full mx-auto px-4 md:px-6 py-12">

                {/* 페이지 제목 */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        {isKR ? '설정' : 'Settings'}
                    </h1>
                    <p className="text-white/35 text-sm mt-1">
                        {isKR ? '계정 및 앱 설정을 관리합니다' : 'Manage your account and app preferences'}
                    </p>
                </div>

                <div className="flex flex-col gap-8">

                    {/* ── 언어 설정 ── */}
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 px-1">
                            {isKR ? '언어' : 'Language'}
                        </h2>
                        <div className="bg-white/4 border border-white/8 rounded-xl overflow-hidden">
                            {(['KR', 'EN'] as const).map((lang, i) => {
                                const selected = language === lang;
                                const label = lang === 'KR' ? '한국어' : 'English';
                                const sub   = lang === 'KR' ? 'Korean' : '영어';
                                return (
                                    <button
                                        key={lang}
                                        onClick={() => setLanguage(lang)}
                                        className={`w-full flex items-center justify-between px-5 py-4 transition ${
                                            i === 0 ? '' : 'border-t border-white/6'
                                        } ${selected ? 'bg-white/6' : 'hover:bg-white/4'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-7 h-7 rounded-md bg-white/8 border border-white/12 flex items-center justify-center text-[10px] font-black text-white/50 flex-shrink-0">{lang}</span>
                                            <div className="text-left">
                                                <p className={`text-sm font-semibold ${selected ? 'text-white' : 'text-white/55'}`}>
                                                    {label}
                                                </p>
                                                <p className="text-white/25 text-xs">{sub}</p>
                                            </div>
                                        </div>
                                        {/* 체크 표시 */}
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${
                                            selected
                                                ? 'border-blue-400 bg-blue-400'
                                                : 'border-white/20'
                                        }`}>
                                            {selected && (
                                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                                    <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* ── 연결된 플랫폼 ── */}
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 px-1">
                            {isKR ? '연결된 계정' : 'Connected Account'}
                        </h2>
                        <div className="bg-white/4 border border-white/8 rounded-xl px-5 py-4 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${platformBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                <img src={platformLogo} alt={platformName} className="w-6 h-6 object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-semibold">{user?.username ?? '—'}</p>
                                <p className="text-white/35 text-xs">{platformName}</p>
                            </div>
                            <span className="flex-shrink-0 px-2.5 py-1 rounded-md bg-emerald-500/12 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
                                {isKR ? '연결됨' : 'Connected'}
                            </span>
                        </div>
                    </section>

                    {/* ── 계정 ── */}
                    <section>
                        <h2 className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 px-1">
                            {isKR ? '계정' : 'Account'}
                        </h2>
                        <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-red-400 font-semibold text-sm mb-1">
                                        {t('profile.deleteAccount')}
                                    </p>
                                    <p className="text-red-400/60 text-xs leading-relaxed">
                                        {t('profile.deleteAccountWarning')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex-shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition"
                                >
                                    {t('profile.deleteAccount')}
                                </button>
                            </div>
                        </div>
                    </section>

                </div>
            </main>

            {/* 회원 탈퇴 확인 다이얼로그 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
                    <div className="bg-[#0d1626] border border-white/15 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
                        <h3 className="text-xl font-bold text-red-400 mb-3">
                            {t('profile.deleteAccountConfirm')}
                        </h3>
                        <p className="text-white/60 text-sm mb-6 leading-relaxed">
                            {t('profile.deleteAccountWarning')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deletingAccount}
                                className="flex-1 px-4 py-2.5 bg-white/8 text-white/70 font-bold text-sm rounded-lg hover:bg-white/12 transition disabled:opacity-50"
                            >
                                {t('profile.deleteAccountNo')}
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deletingAccount}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {deletingAccount
                                    ? t('profile.deleteAccountDeleting')
                                    : t('profile.deleteAccountYes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default Settings;
