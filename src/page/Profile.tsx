import Header from "../global/Header";
import Footer from "../global/Footer";
import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "../api/authService";
import { getUploadUrl, completeUpload, getImageUrl } from "../api/imageService";
import type { UserImageType } from "../api/imageService";
import { getUserProfile, updateUserDescription, getUserStreak, getUserPerf, forceRefreshStats } from "../api/userService";
import type { ProfileResponse, DailyStreakDto, UserPerfResponse } from "../api/userService";
import { useRatingHistory } from "../api/queries";
import RatingHistoryChart from "../components/RatingHistoryChart";
import { TierSection } from "../components/TierSection";
import { GameTypeButtons } from "../components/GameTypeButtons";
import lichessLogoImg from "../assets/images/logo/lichess-logo.png";
import "./Profile.css";

const Profile = () => {
    const [bannerImage, setBannerImage] = useState<string | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [description, setDescription] = useState<string>('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [loadingBanner, setLoadingBanner] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [savingDescription, setSavingDescription] = useState(false);
    
    // 게임 타입 관련 상태
    const [selectedGameType, setSelectedGameType] = useState<string>('RAPID');
    const gameTypes = ['BULLET', 'BLITZ', 'RAPID', 'CLASSICAL'];
    
    // 게임 타입 표시 이름 매핑
    const gameTypeDisplayNames: { [key: string]: string } = {
        'BULLET': 'Bullet',
        'BLITZ': 'Blitz',
        'RAPID': 'Rapid',
        'CLASSICAL': 'Classical'
    };
    
    // 티어별 색상 정의
    const tierColorScheme: { [key: string]: { mainColor: string; lightBg: string; darkBg: string; borderColor: string; lightText: string; darkText: string } } = {
        'PAWN': { 
            mainColor: '#aecdb1',
            lightBg: '#f0f8f3',
            darkBg: '#dce8e0',
            borderColor: '#aecdb1',
            lightText: '#5a7a68',
            darkText: '#2d4037'
        },
        'KNIGHT': { 
            mainColor: '#87abd6',
            lightBg: '#f0f5fb',
            darkBg: '#d8e5f0',
            borderColor: '#87abd6',
            lightText: '#3d6a96',
            darkText: '#1e3a52'
        },
        'BISHOP': { 
            mainColor: '#ae97d7',
            lightBg: '#f5f1fb',
            darkBg: '#e5d8f0',
            borderColor: '#ae97d7',
            lightText: '#6b4fa5',
            darkText: '#38245a'
        },
        'ROOK': { 
            mainColor: '#e7ada8',
            lightBg: '#fdf4f2',
            darkBg: '#f0dcd8',
            borderColor: '#e7ada8',
            lightText: '#a5544a',
            darkText: '#5a2a22'
        },
        'QUEEN': { 
            mainColor: '#edae6c',
            lightBg: '#fef9f2',
            darkBg: '#f5e0d4',
            borderColor: '#edae6c',
            lightText: '#b87a36',
            darkText: '#6a431a'
        },
        'KING': { 
            mainColor: '#edae6c',
            lightBg: '#fef9f2',
            darkBg: '#f5e0d4',
            borderColor: '#edae6c',
            lightText: '#b87a36',
            darkText: '#6a431a'
        }
    };
    
    // 티어별 프로모션 임계값 정의
    const promotionThresholds: { [key: string]: number } = {
        'PAWN': 400,
        'KNIGHT': 901,
        'BISHOP': 1201,
        'ROOK': 1501,
        'QUEEN': 1801,
        'KING': 2101
    };
    
    // 숫자 서브티어를 로마자로 변환
    const convertSubTierToRoman = (subTier: string): string => {
        const romanMap: { [key: string]: string } = {
            '1': 'I',
            '2': 'II',
            '3': 'III',
            '4': 'IV',
            '5': 'V'
        };
        return romanMap[subTier] || subTier;
    };
    
    // rating으로 tier 계산
    const getTierFromRating = (rating: number): string => {
        const tiers = Object.entries(promotionThresholds).sort(([, a], [, b]) => b - a);
        for (const [tier, minRating] of tiers) {
            if (rating >= minRating) {
                return tier;
            }
        }
        return 'PAWN';
    };
    
    // 스트릭 관련 상태
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [streakMap, setStreakMap] = useState<Map<string, DailyStreakDto>>(new Map());
    
    // 레이팅 히스토리 관련 상태
    const [ratingHistory, setRatingHistory] = useState<any[]>([]);
    
    // 티어 관련 상태
    const [userPerf, setUserPerf] = useState<UserPerfResponse>({
        rating: 0,
        gamesPlayed: 0,
        prov: true,
        all: 0, rated: 0, wins: 0, losses: 0, draws: 0,
        tour: 0, berserk: 0, opAvg: 0, seconds: 0, disconnects: 0,
        highestRating: 0, lowestRating: 0,
        maxStreak: 0, maxLossStreak: 0,
        uncertain: true
    });
    const [loadingPerf, setLoadingPerf] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
    const [remainingTime, setRemainingTime] = useState(0);
    const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5분 (밀리초)

    // 남은 시간 업데이트 (1초마다)
    useEffect(() => {
        if (!lastRefreshTime) return;
        
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastRefreshTime;
            const remaining = Math.max(0, REFRESH_COOLDOWN - elapsed);
            setRemainingTime(remaining);
            
            if (remaining === 0) {
                clearInterval(interval);
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [lastRefreshTime]);
    useEffect(() => {
        const fetchUserAndImages = async () => {
            try {
                await getCurrentUser();
                
                // 프로필 정보 조회
                const profileData = await getUserProfile();
                console.log('[Profile] Received profileData:', profileData);
                console.log('[Profile] Profile Keys:', Object.keys(profileData || {}));
                setProfile(profileData);
                setDescription(profileData?.description || '');
                
                // lichessCreatedAt부터 현재 년도까지의 년도 배열 생성
                if (profileData?.lichessCreatedAt) {
                    const lichessYear = new Date(profileData.lichessCreatedAt).getFullYear();
                    const currentYear = new Date().getFullYear();
                    const years: number[] = [];
                    for (let year = lichessYear; year <= currentYear; year++) {
                        years.push(year);
                    }
                    setAvailableYears(years);
                    setSelectedYear(currentYear);
                }
                
                // 프로필 이미지 조회
                const profileUrl = await getImageUrl('PROFILE');
                const profileUrlWithTimestamp = `${profileUrl}?t=${Date.now()}`;
                setProfileImage(profileUrlWithTimestamp);
                
                // 배너 이미지 조회
                const bannerUrl = await getImageUrl('BANNER');
                const bannerUrlWithTimestamp = `${bannerUrl}?t=${Date.now()}`;
                setBannerImage(bannerUrlWithTimestamp);
            } catch (error) {
                console.error('Failed to fetch user data:', error);
            }
        };
        fetchUserAndImages();
    }, []);

    // QueryClient 인스턴스 접근
    const queryClient = useQueryClient();

    // 게임 타입 변경 시 레이팅 히스토리와 티어 정보 조회
    const { data: ratingHistoryData, isLoading: isLoadingRatingHistoryQuery } = useRatingHistory(
        profile?.lichessId || '',
        selectedGameType
    );

    // ratingHistoryData가 업데이트되면 ratingHistory 상태 동기화
    useEffect(() => {
        if (ratingHistoryData) {
            setRatingHistory(ratingHistoryData);
        }
    }, [ratingHistoryData]);

    useEffect(() => {
        const fetchGameTypeData = async () => {
            setLoadingPerf(true);
            try {
                const perfData = await getUserPerf(selectedGameType);
                console.log('📊 perf 데이터 받음:', perfData);
                setUserPerf(perfData);
            } catch (error) {
                console.error('Failed to fetch perf data:', error);
                // 에러 시 기본 uncertain 상태
                setUserPerf({
                    rating: 0,
                    gamesPlayed: 0,
                    prov: true,
                    all: 0, rated: 0, wins: 0, losses: 0, draws: 0,
                    tour: 0, berserk: 0, opAvg: 0, seconds: 0, disconnects: 0,
                    highestRating: 0, lowestRating: 0,
                    maxStreak: 0, maxLossStreak: 0,
                    uncertain: true
                });
            } finally {
                setLoadingPerf(false);
            }
        };
        
        fetchGameTypeData();
    }, [selectedGameType]);

    // 년도 변경 시 스트릭 데이터 조회
    useEffect(() => {
        const fetchStreak = async () => {
            try {
                const streakData = await getUserStreak(selectedYear);
                console.log('[Profile] streakData:', streakData);
                
                if (!streakData || !streakData.dailyStreakDto) {
                    console.warn('[Profile] No streak data or dailyStreakDto is undefined');
                    setStreakMap(new Map());
                    return;
                }
                
                const map = new Map<string, DailyStreakDto>();
                if (Array.isArray(streakData.dailyStreakDto)) {
                    streakData.dailyStreakDto.forEach(daily => {
                        map.set(daily.date, daily);
                    });
                }
                setStreakMap(map);
            } catch (error) {
                console.error('Failed to fetch streak data:', error);
                setStreakMap(new Map());
            }
        };
        
        if (selectedYear) {
            fetchStreak();
        }
    }, [selectedYear]);

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: UserImageType
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (type === 'BANNER') setLoadingBanner(true);
        if (type === 'PROFILE') setLoadingProfile(true);
        
        try {
            const result = await getUploadUrl(type, file.type);
            const { uploadUrl, contentType } = result;
            
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': contentType,
                },
            });
            
            if (!uploadResponse.ok) {
                throw new Error(`Upload failed: ${uploadResponse.status}`);
            }
            
            await completeUpload(type);
            
            const imageUrl = await getImageUrl(type);
            const imageUrlWithTimestamp = `${imageUrl}?t=${Date.now()}`;
            
            if (type === 'BANNER') setBannerImage(imageUrlWithTimestamp);
            if (type === 'PROFILE') setProfileImage(imageUrlWithTimestamp);
            
            alert(`${type === 'BANNER' ? '배너' : '프로필'} 이미지가 업로드되었습니다.`);
        } catch (error) {
            alert(`이미지 업로드 실패: ${error}`);
        } finally {
            if (type === 'BANNER') setLoadingBanner(false);
            if (type === 'PROFILE') setLoadingProfile(false);
        }
    };

    const handleSaveDescription = async () => {
        setSavingDescription(true);
        try {
            await updateUserDescription(description);
            setIsEditingDescription(false);
            alert('자기소개가 저장되었습니다.');
        } catch (error) {
            alert('자기소개 저장에 실패했습니다.');
        } finally {
            setSavingDescription(false);
        }
    };

    const handleForceRefresh = async () => {
        // 쿨타임 체크
        if (lastRefreshTime && Date.now() - lastRefreshTime < REFRESH_COOLDOWN) {
            const remaining = Math.ceil((REFRESH_COOLDOWN - (Date.now() - lastRefreshTime)) / 1000);
            alert(`${remaining}초 후에 다시 시도해주세요.`);
            return;
        }

        setRefreshing(true);
        try {
            await forceRefreshStats();
            // 갱신 후 현재 게임 타입의 데이터 다시 로드
            const perfData = await getUserPerf(selectedGameType);
            setUserPerf(perfData);
            
            // 캐시된 레이팅 히스토리 즉시 갱신
            queryClient.invalidateQueries({ queryKey: ['ratingHistory'] });
            
            setLastRefreshTime(Date.now());
            setRemainingTime(REFRESH_COOLDOWN);
            alert('정보가 갱신되었습니다.');
        } catch (error) {
            console.error('강제 갱신 실패:', error);
            alert('정보 갱신에 실패했습니다.');
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="profile-page" style={{
            backgroundColor: userPerf
                ? userPerf.uncertain 
                    ? '#f3f4f6'
                    : tierColorScheme[getTierFromRating(userPerf.rating)].lightBg
                : tierColorScheme['KING'].lightBg
        }}>
            <Header />
            
            {/* 배너 이미지 */}
            <div 
                className="w-full relative group banner-section"
                style={bannerImage ? {
                    height: '380px',
                    backgroundImage: `url(${bannerImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {
                    height: '380px',
                    backgroundColor: userPerf 
                        ? userPerf.uncertain 
                            ? '#e5e7eb'
                            : tierColorScheme[getTierFromRating(userPerf.rating)].mainColor
                        : tierColorScheme['KING'].mainColor,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <label className="absolute bottom-4 right-6 cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload(e, 'BANNER')}
                        className="hidden"
                        disabled={loadingBanner}
                    />
                    <div className={`px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 font-bold rounded-lg text-sm transition hover:bg-white/100 shadow-lg flex items-center gap-2 ${loadingBanner ? 'opacity-50 pointer-events-none' : ''}`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        {loadingBanner ? '업로드 중...' : '편집'}
                    </div>
                </label>
            </div>

            {/* 프로필 섹션 */}
            <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-10 mb-8">
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg card-section card-hover">
                    <div className="flex gap-8 items-start">
                        {/* 프로필 이미지 */}
                        <div className="flex flex-col items-center gap-4 flex-shrink-0">
                            <div className="relative group">
                                <img
                                    src={profileImage || 'https://via.placeholder.com/140'}
                                    alt="프로필 사진"
                                    className="w-36 h-36 rounded-2xl border-4 object-cover shadow-lg profile-image profile-image-hover"
                                    style={{
                                        borderColor: userPerf 
                                            ? userPerf.uncertain
                                                ? '#9ca3af'
                                                : tierColorScheme[getTierFromRating(userPerf.rating)]?.mainColor || tierColorScheme['KING'].mainColor
                                            : tierColorScheme['KING'].mainColor
                                    }}
                                />
                                <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 rounded-2xl transition cursor-pointer group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleImageUpload(e, 'PROFILE')}
                                        className="hidden"
                                        disabled={loadingProfile}
                                    />
                                    <div className={`px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-700 font-bold text-xs rounded-lg transition shadow-md ${loadingProfile ? 'opacity-50' : 'opacity-0 group-hover:opacity-100'}`}>
                                        {loadingProfile ? '중...' : '변경'}
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* 프로필 정보 */}
                        <div className="flex-1">
                            <h1 className="text-4xl font-black text-gray-900 mb-2">
                                {profile?.username || 'User'}
                            </h1>
                            <div className="text-xs font-normal uppercase tracking-wider mb-6 flex gap-4">
                                <p className="text-gray-500 opacity-60">
                                    ChessLadder 가입: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR') : '-'}
                                </p>
                                <p className="text-gray-500 opacity-60">
                                    Lichess 가입: {profile?.lichessCreatedAt ? new Date(profile.lichessCreatedAt).toLocaleDateString('ko-KR') : '-'}
                                </p>
                            </div>

                            {/* Lichess 프로필 이동 버튼 + 강제 갱신 버튼 */}
                            <div className="mb-6 flex gap-2">
                                {profile?.lichessId && (
                                    <a
                                        href={`https://lichess.org/@/${profile.lichessId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center w-10 h-10 bg-white border-2 border-black rounded-lg hover:shadow-lg transition hover:scale-105"
                                    >
                                        <img
                                            src={lichessLogoImg}
                                            alt="Lichess"
                                            className="w-6 h-6 object-contain"
                                        />
                                    </a>
                                )}
                                <button
                                    onClick={handleForceRefresh}
                                    disabled={refreshing || remainingTime > 0}
                                    className="inline-flex items-center justify-center px-4 py-2 bg-white border-2 border-black rounded-lg hover:shadow-lg transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                                    title={remainingTime > 0 ? `${Math.ceil(remainingTime / 1000)}초 후에 사용 가능합니다` : 'Lichess에서 최신 정보를 가져옵니다'}
                                >
                                    {refreshing ? '갱신 중...' : remainingTime > 0 ? `${Math.ceil(remainingTime / 1000)}초 대기` : '데이터 갱신'}
                                </button>
                            </div>
                            
                            {/* 자기소개 섹션 */}
                            <div>
                                {isEditingDescription ? (
                                    <div className="flex flex-col gap-3">
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="자기소개를 입력하세요"
                                            className="w-full p-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white"
                                            style={{
                                                borderColor: userPerf 
                                                    ? userPerf.uncertain
                                                        ? '#9ca3af'
                                                        : tierColorScheme[getTierFromRating(userPerf.rating)]?.mainColor || tierColorScheme['KING'].mainColor
                                                    : tierColorScheme['KING'].mainColor
                                            }}
                                            rows={3}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveDescription}
                                                disabled={savingDescription}
                                                className="px-4 py-2 text-white font-bold text-sm rounded-lg hover:shadow-lg transition disabled:opacity-50"
                                                style={{
                                                    backgroundColor: userPerf 
                                                        ? userPerf.uncertain
                                                            ? '#9ca3af'
                                                            : tierColorScheme[getTierFromRating(userPerf.rating)]?.mainColor || tierColorScheme['KING'].mainColor
                                                        : tierColorScheme['KING'].mainColor
                                                }}
                                            >
                                                {savingDescription ? '저장 중...' : '저장'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingDescription(false);
                                                    setDescription(profile?.description || '');
                                                }}
                                                className="px-4 py-2 bg-gray-200 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-300 transition"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <p className="text-gray-700 text-sm leading-relaxed p-4 rounded-lg border-2"
                                                style={{
                                                    backgroundColor: userPerf 
                                                        ? userPerf.uncertain
                                                            ? '#f3f4f6'
                                                            : tierColorScheme[getTierFromRating(userPerf.rating)]?.lightBg || tierColorScheme['KING'].lightBg
                                                        : tierColorScheme['KING'].lightBg,
                                                    borderColor: userPerf 
                                                        ? userPerf.uncertain
                                                            ? '#9ca3af'
                                                            : tierColorScheme[getTierFromRating(userPerf.rating)]?.mainColor || tierColorScheme['KING'].mainColor
                                                        : tierColorScheme['KING'].mainColor
                                                }}
                                            >
                                                {description || '자기소개가 없습니다.'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsEditingDescription(true)}
                                            className="px-3 py-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm border-2 rounded transition flex-shrink-0"
                                            style={{
                                                borderColor: userPerf 
                                                    ? userPerf.uncertain
                                                        ? '#9ca3af'
                                                        : tierColorScheme[getTierFromRating(userPerf.rating)]?.mainColor || tierColorScheme['KING'].mainColor
                                                    : tierColorScheme['KING'].mainColor
                                            }}
                                        >
                                            수정
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 게임 통계 섹션 */}
            {profile && (
                <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">게임 통계</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
                            <p className="text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">전체 게임</p>
                            <p className="text-4xl font-black text-gray-800">{profile.allGames}</p>
                            <p className="text-xs text-gray-600 mt-2">게임</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
                            <p className="text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">레이팅 게임</p>
                            <p className="text-4xl font-black text-gray-800">{profile.ratedGames}</p>
                            <p className="text-xs text-gray-600 mt-2">게임</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
                            <p className="text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">승률</p>
                            <p className="text-4xl font-black text-gray-800">
                                {profile.allGames > 0 ? ((profile.wins / profile.allGames) * 100).toFixed(1) : '0.0'}%
                            </p>
                            <p className="text-xs text-gray-600 mt-2">{profile.wins}승</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
                            <p className="text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">승리</p>
                            <p className="text-4xl font-black text-green-600">{profile.wins}</p>
                            <p className="text-xs text-gray-600 mt-2">게임</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
                            <p className="text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">패배</p>
                            <p className="text-4xl font-black text-red-600">{profile.losses}</p>
                            <p className="text-xs text-gray-600 mt-2">게임</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm">
                            <p className="text-gray-700 text-xs font-semibold mb-2 uppercase tracking-wide">무승부</p>
                            <p className="text-4xl font-black text-gray-600">{profile.draws}</p>
                            <p className="text-xs text-gray-600 mt-2">게임</p>
                        </div>
                    </div>
                </div>
            )}

            {/* 플레이 활동 섹션 - 게임타입 바로 하단 */}
            <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 text-animate">게임 활동 기록</h2>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:border-blue-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                    >
                        {availableYears.map((year) => (
                            <option key={year} value={year}>
                                {year}년
                            </option>
                        ))}
                    </select>
                </div>
                
                <div className={`rounded-lg p-8 shadow-lg card-section card-hover overflow-x-auto ${
                    userPerf?.uncertain ? 'bg-gray-100 border-2 border-gray-300' : 'bg-blue-50 border-2 border-blue-200'
                }`}>
                    <p className="text-gray-700 text-sm font-bold uppercase tracking-wider mb-6 text-animate">{selectedYear}년 활동 현황</p>
                    <div className="pb-6 min-w-full">
                        <div className="flex gap-0 mb-3 text-xs text-gray-600 font-bold uppercase w-full px-1">
                            {['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'].map((month) => (
                                <div key={month} className="flex-1 text-center">
                                    {month}
                                </div>
                            ))}
                        </div>
                        <div className="flex w-full" style={{ gap: '1px' }}>
                            {(() => {
                                const weeks: ReactElement[] = [];
                                const year = selectedYear;
                                const firstDay = new Date(year, 0, 1);
                                const lastDay = new Date(year, 11, 31);
                                
                                let currentDate = new Date(firstDay);
                                
                                let weekCount = 0;
                                while (currentDate <= lastDay) {
                                    weeks.push(
                                        <div key={weekCount} className="flex flex-col flex-1" style={{ gap: '1px' }}>
                                            {Array.from({ length: 7 }).map((_, day) => {
                                                const date = new Date(currentDate);
                                                date.setDate(date.getDate() + day);
                                                
                                                const dateStr = date.toISOString().split('T')[0];
                                                
                                                if (date < firstDay || date > lastDay) {
                                                    return <div key={dateStr} className="w-4 h-4"></div>;
                                                }
                                                
                                                const dailyData = streakMap.get(dateStr);
                                                
                                                let activity = 0;
                                                if (dailyData) {
                                                    const total = dailyData.total;
                                                    if (total === 0) activity = 0;
                                                    else if (total <= 2) activity = 1;
                                                    else if (total <= 5) activity = 2;
                                                    else if (total <= 8) activity = 3;
                                                    else activity = 4;
                                                }
                                                
                                                const colors = userPerf?.uncertain ? [
                                                    'bg-gray-300 border-gray-400',
                                                    'bg-gray-400 border-gray-500',
                                                    'bg-gray-500 border-gray-600',
                                                    'bg-gray-600 border-gray-700',
                                                    'bg-gray-700 border-gray-800'
                                                ] : [
                                                    'bg-gray-200 border-gray-300',
                                                    'bg-blue-300 border-blue-400',
                                                    'bg-blue-500 border-blue-600',
                                                    'bg-blue-700 border-blue-800',
                                                    'bg-indigo-900 border-indigo-950'
                                                ];
                                                
                                                return (
                                                    <div
                                                        key={dateStr}
                                                        className={`w-4 h-4 rounded-sm border ${colors[activity]} cursor-help transition hover:ring-2 hover:ring-offset-1 ${userPerf?.uncertain ? 'hover:ring-gray-400' : 'hover:ring-blue-400'}`}
                                                        title={dailyData ? `${dateStr} • ${dailyData.total}게임: ${dailyData.win}승 ${dailyData.lose}패 ${dailyData.draw}무\n마지막 레이팅: ${dailyData.lastRating}` : '데이터 없음'}
                                                    />
                                                );
                                            })}
                                        </div>
                                    );
                                    
                                    currentDate.setDate(currentDate.getDate() + 7);
                                    weekCount++;
                                }
                                
                                return weeks;
                            })()}
                        </div>
                    </div>
                </div>

                {/* 년도별 통계 */}
                <div className="mt-6">
                    {(() => {
                        let totalGames = 0;
                        let totalWins = 0;
                        let totalLoses = 0;
                        let totalDraws = 0;
                        let activeDays = 0;

                        streakMap.forEach((daily) => {
                            totalGames += daily.total;
                            totalWins += daily.win;
                            totalLoses += daily.lose;
                            totalDraws += daily.draw;
                            if (daily.total > 0) activeDays++;
                        });

                        // 연속 플레이 일수 계산
                        const year = selectedYear;
                        const firstDay = new Date(year, 0, 1);
                        const lastDay = new Date(year, 11, 31);
                        
                        let maxStreak = 0;
                        let currentStreak = 0;
                        let tempDate = new Date(firstDay);

                        while (tempDate <= lastDay) {
                            const dateStr = tempDate.toISOString().split('T')[0];
                            const dailyData = streakMap.get(dateStr);
                            
                            if (dailyData && dailyData.total > 0) {
                                currentStreak++;
                                maxStreak = Math.max(maxStreak, currentStreak);
                            } else {
                                currentStreak = 0;
                            }
                            
                            tempDate.setDate(tempDate.getDate() + 1);
                        }

                        const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0.0';

                        return (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-6 border-2 border-blue-400 shadow-md hover:shadow-lg transition transform hover:scale-105">
                                    <div className="text-center">
                                        <p className="text-gray-700 text-xs font-semibold mb-3 uppercase tracking-wide">연속 플레이</p>
                                        <p className="text-5xl font-black text-blue-700 leading-none mb-1">{maxStreak}</p>
                                        <p className="text-xs text-gray-600 font-medium">일</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
                                    <div className="text-center">
                                        <p className="text-gray-700 text-xs font-semibold mb-3 uppercase tracking-wide">활동 일 수</p>
                                        <p className="text-4xl font-black text-gray-800 leading-none mb-1">{activeDays}</p>
                                        <p className="text-xs text-gray-600 font-medium">일</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
                                    <div className="text-center">
                                        <p className="text-gray-700 text-xs font-semibold mb-3 uppercase tracking-wide">총 게임</p>
                                        <p className="text-4xl font-black text-gray-800 leading-none mb-1">{totalGames}</p>
                                        <p className="text-xs text-gray-600 font-medium">게임</p>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-6 border border-gray-300">
                                    <div className="text-center">
                                        <p className="text-gray-700 text-xs font-semibold mb-3 uppercase tracking-wide">승률</p>
                                        <p className="text-4xl font-black text-gray-800 leading-none mb-1">{winRate}%</p>
                                        <p className="text-xs text-gray-600 font-medium">{totalWins}승 {totalLoses}패</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* 게임 타입 선택 버튼 - 플레이 활동 바로 하단 */}
            <GameTypeButtons 
                gameTypes={gameTypes}
                selectedGameType={selectedGameType}
                gameTypeDisplayNames={gameTypeDisplayNames}
                onGameTypeChange={setSelectedGameType}
            />

            {/* 티어 섹션 */}
            <TierSection 
                userPerf={userPerf}
                loadingPerf={loadingPerf}
                tierColorScheme={tierColorScheme}
                promotionThresholds={promotionThresholds}
                convertSubTierToRoman={convertSubTierToRoman}
            />

            {/* 레이팅 히스토리 섹션 */}
            <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-animate">레이팅 진행</h2>
                
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg card-section card-hover">
                    {isLoadingRatingHistoryQuery ? (
                        <div className="flex items-center justify-center h-80">
                            <p className="text-gray-500 text-sm">데이터를 불러오는 중입니다...</p>
                        </div>
                    ) : ratingHistory.length > 0 ? (
                        <RatingHistoryChart ratingHistory={ratingHistory} gameType={gameTypeDisplayNames[selectedGameType]} />
                    ) : (
                        <div className="flex items-center justify-center h-80">
                            <p className="text-gray-500 text-sm">{gameTypeDisplayNames[selectedGameType]} 레이팅 데이터가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer/>
        </div>
    );
}   

export default Profile;
