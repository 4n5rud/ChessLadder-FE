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
    'main.loginWithLichess': 'Lichess 계정으로 로그인하기',
    'main.discordLink': '디스코드 링크',
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
    'ranking.unrated': '게임을 더 하여 레이팅을 얻어보세요!',
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
    'main.discordLink': 'Discord Link',
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
    'ranking.unrated': 'Play more games to get your rating!',
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
