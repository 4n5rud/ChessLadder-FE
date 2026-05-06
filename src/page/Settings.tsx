import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../global/Header';
import Footer from '../global/Footer';
import { useAuthStore } from '../store/authStore';
import {
  getUserProfile,
  updateUserDescription,
  deleteAccount,
} from '../api/userService';
import type { ProfileResponse } from '../api/userService';
import { logout } from '../api/oauthService';
import { useLanguage } from '../context/LanguageContext';
import { useSyncPolling } from '../hooks/useSyncPolling';
import lichessLogoImg  from '../assets/images/logo/lichess-logo.png';
import chesscomLogoImg from '../assets/images/logo/chesscom-logo.png';

const Settings = () => {
  const navigate = useNavigate();
  const user = useAuthStore(state => state.user);
  const { t, language, setLanguage } = useLanguage();
  const isKR = language === 'KR';

  // 프로필 데이터
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // 자기소개 편집
  const [description, setDescription] = useState('');
  const [savingDescription, setSavingDescription] = useState(false);
  const [saveResult, setSaveResult] = useState<'success' | 'fail' | null>(null);

  // 동기화 상태
  const { syncStatus, loading: loadingSync, refresh: handleRefreshSync } = useSyncPolling(
    profile?.platform as 'LICHESS' | 'CHESSCOM' | undefined,
  );

  // 계정 탈퇴 모달
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // 비로그인 → 홈으로
  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // 프로필 로드
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingProfile(true);
        const data = await getUserProfile();
        setProfile(data);
        setDescription(data.description ?? '');
      } catch {
        // ignore
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, []);


  const handleSaveDescription = async () => {
    setSavingDescription(true);
    setSaveResult(null);
    try {
      await updateUserDescription(description);
      const updated = await getUserProfile();
      setProfile(updated);
      setDescription(updated.description ?? '');
      setSaveResult('success');
    } catch {
      setSaveResult('fail');
    } finally {
      setSavingDescription(false);
      setTimeout(() => setSaveResult(null), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccount();
      await logout();
      useAuthStore.getState().clearUser();
      window.location.href = '/';
    } catch {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  const platformName = profile?.platform === 'CHESSCOM' ? 'Chess.com' : 'Lichess';
  const platformLogo = profile?.platform === 'CHESSCOM' ? chesscomLogoImg : lichessLogoImg;
  const platformBg   = profile?.platform === 'CHESSCOM' ? 'bg-[#81b64c]' : 'bg-white/15';

  const renderSyncStatusContent = () => {
    if (loadingSync && !syncStatus) {
      return (
        <div className="flex items-center gap-3 text-white/50 text-sm">
          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <span>{isKR ? '상태 확인 중...' : 'Checking status...'}</span>
        </div>
      );
    }

    if (!syncStatus) {
      return (
        <p className="text-white/30 text-sm">{isKR ? '상태 정보 없음' : 'No status info'}</p>
      );
    }

    const { status, totalFetched, errorMsg } = syncStatus;

    if (status === 'COMPLETED') {
      return (
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0" />
          <div>
            <p className="text-green-400 text-sm font-semibold">{t('profile.syncCompleted')}</p>
            {totalFetched > 0 && (
              <p className="text-white/40 text-xs mt-0.5">
                {isKR ? `총 ${totalFetched}게임` : `${totalFetched} total games`}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (status === 'IN_PROGRESS' || status === 'PENDING') {
      return (
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin flex-shrink-0" />
          <div>
            <p className="text-blue-400 text-sm font-semibold">
              {status === 'PENDING' ? t('profile.syncPending') : t('profile.syncInProgress')}
            </p>
            {totalFetched > 0 && (
              <p className="text-white/40 text-xs mt-0.5">
                {isKR ? `${totalFetched}게임 처리됨` : `${totalFetched} games processed`}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (status === 'TOKEN_EXPIRED') {
      return (
        <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-yellow-400 text-sm font-semibold">
            {isKR
              ? '플랫폼 토큰 만료 — 재로그인이 필요합니다'
              : 'Platform token expired — re-login required'}
          </p>
        </div>
      );
    }

    // FAILED
    return (
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm font-semibold">
            {t('profile.syncFailed')}{errorMsg ? ` — ${errorMsg}` : ''}
          </p>
        </div>
        <button
          onClick={handleRefreshSync}
          className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold rounded hover:bg-red-500/30 transition"
        >
          {isKR ? '다시 시도' : 'Retry'}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#070d1a] flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 md:px-6 py-12">

        {/* 페이지 제목 */}
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight">{t('settings.title')}</h1>
          <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full mt-2" />
        </div>

        <div className="flex flex-col gap-6">

          {/* ── 섹션 1: 프로필 설정 ── */}
          <section className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-5">{t('settings.profileSection')}</h2>

            <label className="flex flex-col gap-2">
              <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">
                {isKR ? '자기소개' : 'Bio'}
              </span>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('profile.enterDescription')}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition resize-none"
              />
            </label>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSaveDescription}
                disabled={savingDescription}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition disabled:opacity-50"
              >
                {savingDescription ? t('profile.saving') : t('profile.save')}
              </button>
              {saveResult === 'success' && (
                <span className="text-green-400 text-sm font-semibold">{t('settings.saveSuccess')}</span>
              )}
              {saveResult === 'fail' && (
                <span className="text-red-400 text-sm font-semibold">{t('settings.saveFail')}</span>
              )}
            </div>
          </section>

          {/* ── 섹션 2: 계정 정보 ── */}
          <section className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-5">{t('settings.accountInfo')}</h2>

            {loadingProfile ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-48" />
                <div className="h-4 bg-white/10 rounded w-36" />
                <div className="h-4 bg-white/10 rounded w-56" />
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Username (읽기전용) */}
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
                    {isKR ? '사용자명' : 'Username'}
                  </p>
                  <p className="text-white font-bold text-base">{profile?.username ?? '—'}</p>
                </div>

                {/* 연동 플랫폼 */}
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">
                    {isKR ? '연동 플랫폼' : 'Connected Platform'}
                  </p>
                  <div className="inline-flex items-center gap-2.5 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${platformBg}`}>
                      <img src={platformLogo} alt={platformName} className="w-4 h-4 object-contain" />
                    </div>
                    <span className="text-white font-semibold text-sm">{platformName}</span>
                  </div>
                </div>

                {/* ChessLadder 가입일 */}
                <div>
                  <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">
                    {isKR ? 'ChessLadder 가입일' : 'ChessLadder Joined'}
                  </p>
                  <p className="text-white/70 text-sm">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── 섹션 3: 데이터 동기화 ── */}
          <section className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{t('settings.syncSection')}</h2>
              <button
                onClick={handleRefreshSync}
                disabled={loadingSync}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/8 border border-white/10 text-white/60 hover:text-white text-xs font-semibold rounded-lg transition disabled:opacity-40"
              >
                <svg
                  className={`w-3.5 h-3.5 ${loadingSync ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('profile.syncRefresh')}
              </button>
            </div>

            {renderSyncStatusContent()}
          </section>

          {/* ── 섹션 4: 위험 영역 ── */}
          <section className="border border-red-500/30 bg-red-500/5 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-red-400 mb-2">{t('settings.dangerZone')}</h2>
            <p className="text-white/40 text-sm mb-5">
              {isKR
                ? '이 영역의 작업은 되돌릴 수 없습니다. 신중하게 진행하세요.'
                : 'Actions in this area are irreversible. Proceed carefully.'}
            </p>

            <div className="flex items-center justify-between gap-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
              <div>
                <p className="text-white font-semibold text-sm">{t('settings.deleteAccount')}</p>
                <p className="text-white/40 text-xs mt-0.5">{t('settings.deleteWarning')}</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition flex-shrink-0"
              >
                {t('settings.deleteAccount')}
              </button>
            </div>
          </section>

          {/* ── 언어 설정 (보너스) ── */}
          <section className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              {isKR ? '언어' : 'Language'}
            </h2>
            <div className="flex gap-3">
              {(['KR', 'EN'] as const).map(lang => {
                const selected = language === lang;
                const label = lang === 'KR' ? '한국어' : 'English';
                return (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition ${
                      selected
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

        </div>
      </main>

      {/* 계정 탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-[#0d1626] border border-white/15 rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-red-400">{t('settings.deleteConfirm')}</h3>
            </div>

            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              {isKR
                ? '계정과 모든 통계 데이터가 영구적으로 삭제됩니다.'
                : 'Your account and all statistics will be permanently deleted.'}
              {' '}
              {t('settings.deleteWarning')}.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                className="flex-1 px-4 py-2.5 bg-white/8 text-white/70 hover:text-white font-bold text-sm rounded-xl transition disabled:opacity-50"
              >
                {t('settings.deleteNo')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition disabled:opacity-50"
              >
                {deletingAccount
                  ? (isKR ? '삭제 중...' : 'Deleting...')
                  : t('settings.deleteYes')}
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
