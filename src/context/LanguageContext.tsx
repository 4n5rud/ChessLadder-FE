import React, { createContext, useContext, useState } from 'react';

export type Language = 'KR' | 'EN';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  KR: {
    // Header
    'header.home': '홈',
    'header.news': '소식',
    'header.ranking': '랭킹',
    'header.menu': '메뉴',
    'header.myProfile': '내 프로필',
    'header.logout': '로그아웃',
    'header.login': '로그인',
    'header.changeLanguage': '언어 변경',

    // Profile Page
    'profile.chessMateJoinDate': 'ChessLadder 가입',
    'profile.lichessJoinDate': 'Lichess 가입',
    'profile.dataRefresh': '데이터 갱신',
    'profile.refreshing': '갱신 중...',
    'profile.waitSeconds': '초 대기',
    'profile.description': '자기소개',
    'profile.noDescription': '자기소개가 없습니다.',
    'profile.edit': '수정',
    'profile.save': '저장',
    'profile.saving': '저장 중...',
    'profile.cancel': '취소',
    'profile.enterDescription': '자기소개를 입력하세요',
    'profile.saveSuccess': '자기소개가 저장되었습니다.',
    'profile.saveFail': '자기소개 저장에 실패했습니다.',
    'profile.gameStatistics': '게임 통계',
    'profile.totalGames': '전체 게임',
    'profile.ratedGames': '레이팅 게임',
    'profile.winRate': '승률',
    'profile.wins': '승리',
    'profile.losses': '패배',
    'profile.draws': '무승부',
    'profile.games': '게임',
    'profile.gameActivityRecord': '게임 활동 기록',
    'profile.activityStatus': '활동 현황',
    'profile.bannerImageEditTooltip': '배너 편집',
    'profile.bannerImageEdit': '편집',
    'profile.profileImageEditTooltip': '프로필 사진 변경',
    'profile.profileImageEdit': '변경',
    'profile.uploading': '업로드 중...',
    'profile.uploadSuccess': '이미지가 업로드되었습니다.',
    'profile.uploadFail': '이미지 업로드 실패',
    'profile.imageBannerUploadSuccess': '배너 이미지가 업로드되었습니다.',
    'profile.imageProfileUploadSuccess': '프로필 이미지가 업로드되었습니다.',
    'profile.refreshFail': '정보 갱신에 실패했습니다.',
    'profile.refreshSuccess': '정보가 갱신되었습니다.',
    'profile.lichessProfile': 'Lichess 프로필',
    'profile.user': 'User',
    'profile.loading': '로딩 중...',
    'profile.alreadyLoggedIn': '이미 로그인되었습니다',
    'profile.monthJan': '1월',
    'profile.monthFeb': '2월',
    'profile.monthMar': '3월',
    'profile.monthApr': '4월',
    'profile.monthMay': '5월',
    'profile.monthJun': '6월',
    'profile.monthJul': '7월',
    'profile.monthAug': '8월',
    'profile.monthSep': '9월',
    'profile.monthOct': '10월',
    'profile.monthNov': '11월',
    'profile.monthDec': '12월',

    // Profile Stats
    'profile.consecutiveDays': '연속 플레이',
    'profile.activeDays': '활동 일 수',
    'profile.totalPlayGames': '총 게임',
    'profile.days': '일',
    'profile.ratingProgress': '레이팅 진행',
    'profile.ratingHistory': '레이팅 히스토리',
    'profile.ratingProgression': '게임 활동에 따른 레이팅 진행 상황',
    'profile.tierMeasurementLeft': '티어 측정까지 레이팅게임',
    'profile.gamesLeft': '게임 남음',
    'profile.ratingGamesUncertain': '레이팅 게임',
    'profile.dataLoading': '데이터를 불러오는 중입니다...',
    'profile.noRatingData': '레이팅 데이터가 없습니다.',
    'profile.availableAfter': '초 후에 사용 가능합니다',
    'profile.fetchFromLichess': 'Lichess에서 최신 정보를 가져옵니다',
    'profile.ratingAdvance': '레이팅 진행',
    'profile.profilePicture': '프로필 사진',
    'profile.deleteAccount': '회원 탈퇴',
    'profile.deleteAccountConfirm': '정말로 계정을 삭제하시겠습니까?',
    'profile.deleteAccountWarning': '이 작업은 되돌릴 수 없습니다. 모든 데이터가 영구적으로 삭제됩니다.',
    'profile.deleteAccountYes': '예, 삭제합니다',
    'profile.deleteAccountNo': '아니오, 취소합니다',
    'profile.deleteAccountDeleting': '삭제 중...',
    'profile.deleteAccountSuccess': '계정이 삭제되었습니다.',
    'profile.deleteAccountFail': '계정 삭제에 실패했습니다.',
    'stats.totalGames': '전체 게임',
    'stats.ratedGames': '레이팅 게임',
    'stats.winRate': '승률',
    'stats.wins': '승리',
    'stats.losses': '패배',
    'stats.draws': '무승부',

    // Main Page
    'main.title': 'ChessLadder',
    'main.welcome': 'ChessLadder에 오신 것을 환영합니다',
    'main.tagline': '체스 레이팅의 새로운 기준',
    'main.loginWithLichess': 'Lichess 계정으로 로그인',
    'main.loginWithChesscom': 'Chess.com 계정으로 로그인',
    'main.discordLink': '디스코드',
    'main.discordDesc': '개발 소식과 커뮤니티에 참여하세요',
    'main.coffeeDesc': '서버 운영을 도와주세요 ☕',
    'main.aboutService': 'ChessLadder 소개',
    'main.aboutDescription': 'Lichess & Chess.com 플레이어를 위한 통합 레이팅 & 티어 서비스',
    'main.feature1Title': '티어 시스템',
    'main.feature1Desc': 'Pawn부터 King까지 6단계 티어로 당신의 실력을 한눈에 확인하세요.',
    'main.feature2Title': '상세 통계',
    'main.feature2Desc': '색깔별 승률, 첫 수 패턴, 월별 레이팅 추세를 분석해드립니다.',
    'main.feature3Title': '멀티 플랫폼',
    'main.feature3Desc': 'Lichess와 Chess.com 계정을 모두 지원합니다.',
    'main.loginRequired': '로그인이 필요합니다.',
    'main.loginFailAlert': '로그인 시도에 실패했습니다. 다시 시도해주세요.',
    'main.apiDescription': 'Chess Mate는 Lichess API를 사용하여 체스 데이터를 안전하게 처리합니다.',
    'main.recentUsers': '최근 등록된 유저',
    'main.users': '명',
    'main.recentNews': '최근 소식',
    'main.viewMore': '확인하러 가기 →',
    'main.tierSystem': 'ChessLadder 티어 시스템',
    'main.tierDescription': 'ChessLadder는 기존의 지루한 레이팅 시스템에서 벗어난 6가지의 티어 시스템을 제공해요',
    'main.stage': '단계',
    'main.ratingRange': '레이팅 범위',
    'main.joinDiscord': 'Discord 참여하기',
    'main.buyMeCoffee': '개발자에게 커피 한잔 사주기',
    'main.ratedGameDesc': 'ChessLadder의 모든 티어 및 통계 데이터는 레이팅 게임(Rated Game) 기록만을 기반으로 산출됩니다. 비공식 게임이나 일반 게임은 반영되지 않습니다.',
    'main.platformSupport': '현재 아래 두 플랫폼과 연동을 지원합니다.',

    // Footer
    'footer.betaTest': '현재 베타 테스트 중입니다',
    'footer.reportIssue': '문제점이 발견되면',
    'footer.discord': '디스코드',
    'footer.reportSuffix': '로 문의 바랍니다',
    'footer.quickLinks': '빠른 링크',
    'footer.community': '커뮤니티',
    'footer.contact': '문의하기',
    'footer.copyright': '© 2026 ChessLadder. All rights reserved.',
    'footer.poweredBy': 'Powered by Lichess API',

    // Common
    'common.ok': '확인',
    'common.cancel': '취소',
    'common.loading': '로딩 중...',
    'common.error': '오류',
    'common.success': '성공',
    'common.comingSoon': '아직 준비중입니다.',
    'common.ranking': '랭킹',
    'common.rankingDescription': '모든 플레이어의 레이팅 순위를 확인하세요',
    'common.yourRanking': '당신의 순위',
    'common.newsDescription': '최신 소식 및 공지사항을 확인하세요',
    'common.noData': '데이터가 없습니다',
    'common.articles': '기사',
    'ranking.loginPrompt': '로그인해서 내 랭킹을 확인해보세요!',
    'ranking.switchToLichess': 'Lichess 계정으로 로그인하면 이 랭킹에서 내 순위를 확인할 수 있어요.',
    'ranking.switchToChesscom': 'Chess.com 계정으로 로그인하면 이 랭킹에서 내 순위를 확인할 수 있어요.',
    'ranking.unrated': '게임을 더 하여 레이팅을 얻어보세요!',
    'ranking.notRated': '아직 레이팅을 얻지 못했습니다.',
    'ranking.playMoreGames': '더 많은 게임을 진행하여 정식 레이팅을 얻어보세요!',

    // UserProfile - 타인 프로필 페이지 추가 키
    'profile.streakDays': '일 연속',
    'profile.yearSuffix': '년',
    'profile.bestStreakYear': '{year}년 최대 연속',
    'profile.unitDay': '일',
    'profile.unitGame': '게임',
    'profile.ratingTrend': '레이팅 진행 추세',
    'profile.colorStats': '색깔별 게임 통계',
    'profile.firstMoveStats': '첫 수 통계',
    'profile.noData': '데이터가 없습니다.',

    // Sync
    'profile.syncStatus': '데이터 동기화',
    'profile.syncPending': '동기화 대기 중...',
    'profile.syncInProgress': '동기화 진행 중...',
    'profile.syncCompleted': '동기화 완료',
    'profile.syncFailed': '동기화 실패',
    'profile.syncRefresh': '새로고침',

    // Settings Page
    'settings.title': '설정',
    'settings.profileSection': '프로필 설정',
    'settings.accountInfo': '계정 정보',
    'settings.syncSection': '데이터 동기화',
    'settings.dangerZone': '위험 영역',
    'settings.deleteAccount': '계정 탈퇴',
    'settings.deleteConfirm': '정말로 계정을 삭제하시겠습니까?',
    'settings.deleteWarning': '이 작업은 되돌릴 수 없습니다',
    'settings.deleteYes': '예, 삭제합니다',
    'settings.deleteNo': '취소',
    'settings.saveSuccess': '저장되었습니다',
    'settings.saveFail': '저장 실패',
  },
  EN: {
    // Header
    'header.home': 'Home',
    'header.news': 'News',
    'header.ranking': 'Ranking',
    'header.menu': 'Menu',
    'header.myProfile': 'My Profile',
    'header.logout': 'Logout',
    'header.login': 'Login',
    'header.changeLanguage': 'Change Language',

    // Profile Page
    'profile.chessMateJoinDate': 'ChessLadder Join Date',
    'profile.lichessJoinDate': 'Lichess Join Date',
    'profile.dataRefresh': 'Refresh Data',
    'profile.refreshing': 'Refreshing...',
    'profile.waitSeconds': 's Waiting',
    'profile.description': 'Description',
    'profile.noDescription': 'No description available.',
    'profile.edit': 'Edit',
    'profile.save': 'Save',
    'profile.saving': 'Saving...',
    'profile.cancel': 'Cancel',
    'profile.enterDescription': 'Enter your description',
    'profile.saveSuccess': 'Description saved successfully.',
    'profile.saveFail': 'Failed to save description.',
    'profile.gameStatistics': 'Game Statistics',
    'profile.totalGames': 'Total Games',
    'profile.ratedGames': 'Rated Games',
    'profile.winRate': 'Win Rate',
    'profile.wins': 'Wins',
    'profile.losses': 'Losses',
    'profile.draws': 'Draws',
    'profile.games': 'Games',
    'profile.gameActivityRecord': 'Game Activity Record',
    'profile.activityStatus': 'Activity Status',
    'profile.bannerImageEditTooltip': 'Edit Banner',
    'profile.bannerImageEdit': 'Edit',
    'profile.profileImageEditTooltip': 'Change Profile Picture',
    'profile.profileImageEdit': 'Change',
    'profile.uploading': 'Uploading...',
    'profile.uploadSuccess': 'Image uploaded successfully.',
    'profile.uploadFail': 'Image upload failed.',
    'profile.imageBannerUploadSuccess': 'Banner image uploaded successfully.',
    'profile.imageProfileUploadSuccess': 'Profile image uploaded successfully.',
    'profile.refreshFail': 'Failed to refresh information.',
    'profile.refreshSuccess': 'Information refreshed.',
    'profile.lichessProfile': 'Lichess Profile',
    'profile.user': 'User',
    'profile.loading': 'Loading...',
    'profile.alreadyLoggedIn': 'Already logged in',
    'profile.monthJan': 'Jan',
    'profile.monthFeb': 'Feb',
    'profile.monthMar': 'Mar',
    'profile.monthApr': 'Apr',
    'profile.monthMay': 'May',
    'profile.monthJun': 'Jun',
    'profile.monthJul': 'Jul',
    'profile.monthAug': 'Aug',
    'profile.monthSep': 'Sep',
    'profile.monthOct': 'Oct',
    'profile.monthNov': 'Nov',
    'profile.monthDec': 'Dec',

    // Profile Stats
    'profile.consecutiveDays': 'Consecutive Days',
    'profile.activeDays': 'Active Days',
    'profile.totalPlayGames': 'Total Games',
    'profile.days': 'days',
    'profile.ratingProgress': 'Rating Progress',
    'profile.ratingHistory': 'Rating History',
    'profile.ratingProgression': 'Rating Progression by Game Activity',
    'profile.tierMeasurementLeft': 'Rated games until tier measurement',
    'profile.gamesLeft': 'games left',
    'profile.ratingGamesUncertain': 'Rated Games',
    'profile.dataLoading': 'Loading data...',
    'profile.noRatingData': 'No rating data available.',
    'profile.availableAfter': 's until available',
    'profile.fetchFromLichess': 'Fetch latest information from Lichess',
    'profile.ratingAdvance': 'Rating Advance',
    'profile.profilePicture': 'Profile Picture',
    'profile.deleteAccount': 'Delete Account',
    'profile.deleteAccountConfirm': 'Are you sure you want to delete your account?',
    'profile.deleteAccountWarning': 'This action cannot be undone. All data will be permanently deleted.',
    'profile.deleteAccountYes': 'Yes, Delete',
    'profile.deleteAccountNo': 'No, Cancel',
    'profile.deleteAccountDeleting': 'Deleting...',
    'profile.deleteAccountSuccess': 'Account deleted successfully.',
    'profile.deleteAccountFail': 'Failed to delete account.',
    'stats.totalGames': 'Total Games',
    'stats.ratedGames': 'Rated Games',
    'stats.winRate': 'Win Rate',
    'stats.wins': 'Wins',
    'stats.losses': 'Losses',
    'stats.draws': 'Draws',

    // Main Page
    'main.title': 'ChessLadder',
    'main.welcome': 'Welcome to ChessLadder',
    'main.tagline': 'A New Standard for Chess Ratings',
    'main.loginWithLichess': 'Login with Lichess Account',
    'main.loginWithChesscom': 'Login with Chess.com Account',
    'main.discordLink': 'Discord',
    'main.discordDesc': 'Join the community and stay updated',
    'main.coffeeDesc': 'Help keep the server running ☕',
    'main.aboutService': 'About ChessLadder',
    'main.aboutDescription': 'Unified rating & tier service for Lichess & Chess.com players',
    'main.feature1Title': 'Tier System',
    'main.feature1Desc': 'Track your skill with 6 tiers from Pawn to King.',
    'main.feature2Title': 'Detailed Stats',
    'main.feature2Desc': 'Analyze win rates by color, opening patterns, and monthly rating trends.',
    'main.feature3Title': 'Multi-Platform',
    'main.feature3Desc': 'Supports both Lichess and Chess.com accounts.',
    'main.loginRequired': 'Login is required.',
    'main.loginFailAlert': 'Login attempt failed. Please try again.',
    'main.apiDescription': 'Chess Mate safely handles chess data using the Lichess API.',
    'main.recentUsers': 'Recently Registered Users',
    'main.users': 'users',
    'main.recentNews': 'Recent News',
    'main.viewMore': 'View More →',
    'main.tierSystem': 'ChessLadder Tier System',
    'main.tierDescription': 'ChessLadder provides 6 different tier systems beyond the traditional boring rating system',
    'main.stage': 'Stage',
    'main.ratingRange': 'Rating Range',
    'main.joinDiscord': 'Join Discord',
    'main.buyMeCoffee': 'Buy Developer a Coffee',
    'main.ratedGameDesc': 'All tier and stats data on ChessLadder is calculated based on Rated Game records only. Casual or unrated games are not reflected.',
    'main.platformSupport': 'We currently support integration with the following two platforms.',

    // Footer
    'footer.betaTest': 'Currently in Beta Test',
    'footer.reportIssue': 'If you find any issues, please',
    'footer.discord': 'Discord',
    'footer.reportSuffix': 'to report it',
    'footer.quickLinks': 'Quick Links',
    'footer.community': 'Community',
    'footer.contact': 'Contact Us',
    'footer.copyright': '© 2026 ChessLadder. All rights reserved.',
    'footer.poweredBy': 'Powered by Lichess API',

    // Common
    'common.ok': 'OK',
    'common.cancel': 'Cancel',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.comingSoon': 'Coming soon.',
    'common.ranking': 'Ranking',
    'common.rankingDescription': 'See the rating rankings of all players',
    'common.yourRanking': 'YOUR RANKING',
    'common.newsDescription': 'Latest news and announcements',
    'common.noData': 'No data available',
    'common.articles': 'Articles',
    'ranking.loginPrompt': 'Log in to check your ranking!',
    'ranking.switchToLichess': 'Log in with your Lichess account to see your rank on this leaderboard.',
    'ranking.switchToChesscom': 'Log in with your Chess.com account to see your rank on this leaderboard.',
    'ranking.unrated': 'Play more games to get your rating!',
    'ranking.notRated': 'You haven\'t gotten a rating yet.',
    'ranking.playMoreGames': 'Play more games to unlock your official rating!',

    // UserProfile - public profile page additional keys
    'profile.streakDays': 'day streak',
    'profile.yearSuffix': '',
    'profile.bestStreakYear': 'Best Streak {year}',
    'profile.unitDay': 'days',
    'profile.unitGame': 'games',
    'profile.ratingTrend': 'Rating Progress Trend',
    'profile.colorStats': 'Color Game Statistics',
    'profile.firstMoveStats': 'First Move Statistics',
    'profile.noData': 'No data available.',

    // Sync
    'profile.syncStatus': 'Data Sync',
    'profile.syncPending': 'Sync pending...',
    'profile.syncInProgress': 'Syncing...',
    'profile.syncCompleted': 'Sync completed',
    'profile.syncFailed': 'Sync failed',
    'profile.syncRefresh': 'Refresh',

    // Settings Page
    'settings.title': 'Settings',
    'settings.profileSection': 'Profile Settings',
    'settings.accountInfo': 'Account Info',
    'settings.syncSection': 'Data Sync',
    'settings.dangerZone': 'Danger Zone',
    'settings.deleteAccount': 'Delete Account',
    'settings.deleteConfirm': 'Are you sure you want to delete your account?',
    'settings.deleteWarning': 'This cannot be undone',
    'settings.deleteYes': 'Yes, Delete',
    'settings.deleteNo': 'Cancel',
    'settings.saveSuccess': 'Saved',
    'settings.saveFail': 'Save failed',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // localStorage에서 언어 설정 읽기
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'KR';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['KR'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
