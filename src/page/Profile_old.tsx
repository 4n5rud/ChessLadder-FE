import Header from "../global/Header";
import Footer from "../global/Footer";
import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { getCurrentUser } from "../api/authService";
import { getUploadUrl, completeUpload, getImageUrl } from "../api/imageService";
import type { UserImageType } from "../api/imageService";
import { getUserProfile, updateUserDescription, getUserStreak, getUserTier } from "../api/userService";
import type { ProfileResponse, DailyStreakDto, UserTierDto } from "../api/userService";
import { getRatingHistory } from "../api/lichessService";
import RatingHistoryChart from "../components/RatingHistoryChart";
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
    
    // 티어별 색상 정의 (이미지 기반 추출 색상)
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
        'PAWN': 800,
        'KNIGHT': 1200,
        'BISHOP': 1600,
        'ROOK': 2000,
        'QUEEN': 2400,
        'KING': 3000
    };
    
    // 현재 레이팅의 프로모션까지 남은 레이팅 계산
    const calculatePromotionProgress = (rating: number, currentTier: string): { nextTierThreshold: number; remainingRating: number; percentage: number; currentThreshold: number } => {
        const tiers = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'];
        const currentTierIndex = tiers.indexOf(currentTier);
        
        // 현재 티어의 임계값
        const currentThreshold = promotionThresholds[currentTier] || 0;
        
        // 다음 티어의 임계값 (KING이면 현재값 그대로)
        const nextTierIndex = Math.min(currentTierIndex + 1, tiers.length - 1);
        const nextTierThreshold = promotionThresholds[tiers[nextTierIndex]];
        
        // 이전 티어의 임계값 (PAWN이면 0)
        const prevTierIndex = Math.max(currentTierIndex - 1, 0);
        const prevTierThreshold = currentTierIndex === 0 ? 0 : promotionThresholds[tiers[prevTierIndex]];
        
        // 현재 티어 내에서의 진행도
        const tierRange = currentThreshold - prevTierThreshold;
        const ratingInCurrentTier = rating - prevTierThreshold;
        const percentage = tierRange > 0 ? Math.min(Math.max((ratingInCurrentTier / tierRange) * 100, 0), 100) : 100;
        
        // 프로모션까지 남은 레이팅
        const remainingRating = Math.max(nextTierThreshold - rating, 0);
        
        return { nextTierThreshold, remainingRating, percentage, currentThreshold };
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
    
    // 스트릭 관련 상태
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [streakMap, setStreakMap] = useState<Map<string, DailyStreakDto>>(new Map());
    
    // 레이팅 히스토리 관련 상태
    const [ratingHistory, setRatingHistory] = useState<any[]>([]);
    const [loadingRatingHistory, setLoadingRatingHistory] = useState(false);
    
    // 티어 관련 상태
    const [userTier, setUserTier] = useState<UserTierDto | null>(null);
    const [loadingTier, setLoadingTier] = useState(false);

    // 페이지 로드 시 사용자 정보 및 이미지 조회
    useEffect(() => {
        const fetchUserAndImages = async () => {
            try {
                await getCurrentUser();
                
                // 프로필 정보 조회
                const profileData = await getUserProfile();
                setProfile(profileData);
                setDescription(profileData.description);
                
                // lichessCreatedAt부터 현재 년도까지의 년도 배열 생성
                if (profileData.lichessCreatedAt) {
                    const lichessYear = new Date(profileData.lichessCreatedAt).getFullYear();
                    const currentYear = new Date().getFullYear();
                    const years: number[] = [];
                    for (let year = lichessYear; year <= currentYear; year++) {
                        years.push(year);
                    }
                    setAvailableYears(years);
                    setSelectedYear(currentYear); // 현재 년도로 초기값 설정
                }
                
                // 프로필 이미지 조회
                const profileUrl = await getImageUrl('PROFILE');
                const profileUrlWithTimestamp = `${profileUrl}?t=${Date.now()}`;
                setProfileImage(profileUrlWithTimestamp);
                
                // 배너 이미지 조회
                const bannerUrl = await getImageUrl('BANNER');
                const bannerUrlWithTimestamp = `${bannerUrl}?t=${Date.now()}`;
                setBannerImage(bannerUrlWithTimestamp);
                
                // 현재 티어 정보 조회 (TODO: 백엔드에서 getUserTier API 제공 필요)
                // setLoadingTier(true);
                // try {
                //     const tierData = await getUserTier();
                //     setUserTier(tierData);
                // } catch (error) {
                //     console.error('Failed to fetch tier data:', error);
                // } finally {
                //     setLoadingTier(false);
                // }
            } catch (error) {
                // 에러 처리
            }
        };
        fetchUserAndImages();
    }, []);

    // 게임 타입 변경 시 레이팅 히스토리와 티어 정보 조회
    useEffect(() => {
        const fetchGameTypeData = async () => {
            // 게임 타입에 해당하는 tier 정보 조회
            setLoadingTier(true);
            try {
                const tierData = await getUserTier(selectedGameType);
                setUserTier(tierData);
            } catch (error) {
                console.error('Failed to fetch tier data:', error);
                setUserTier(null);
            } finally {
                setLoadingTier(false);
            }
            
            // 레이팅 히스토리 조회
            if (!profile?.lichessId) return;
            
            setLoadingRatingHistory(true);
            try {
                const history = await getRatingHistory(profile.lichessId, selectedGameType);
                setRatingHistory(history);
            } catch (error) {
                console.error('Failed to fetch rating history:', error);
                setRatingHistory([]);
            } finally {
                setLoadingRatingHistory(false);
            }
        };
        
        fetchGameTypeData();
    }, [selectedGameType, profile?.lichessId]);

    // 년도 변경 시 스트릭 데이터 조회
    useEffect(() => {
        const fetchStreak = async () => {
            try {
                const streakData = await getUserStreak(selectedYear);
                
                // 날짜를 key로 하는 Map 생성 (빠른 조회)
                const map = new Map<string, DailyStreakDto>();
                streakData.dailyStreakDto.forEach(daily => {
                    map.set(daily.date, daily);
                });
                setStreakMap(map);
            } catch (error) {
                // 에러 처리
            }
        };
        
        if (selectedYear) {
            fetchStreak();
        }
    }, [selectedYear]);

    /**
     * 이미지 업로드 핸들러 (공통)
     * 1. getUploadUrl으로 Presigned URL 요청
     * 2. R2에 PUT 요청하여 파일 업로드
     * 3. completeUpload로 서버에 완료 통보
     * 4. getImageUrl로 CDN URL 조회 및 화면 갱신
     */
    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: UserImageType
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (type === 'BANNER') setLoadingBanner(true);
        if (type === 'PROFILE') setLoadingProfile(true);
        
        try {
            // 1️⃣ 업로드 URL 요청 (Presigned URL과 contentType을 함께 받음)
            const result = await getUploadUrl(type, file.type);
            const { uploadUrl, contentType } = result;
            
            // 2️⃣ Cloudflare R2에 PUT 요청으로 파일 업로드 (Presigned URL 생성 시 사용한 contentType 사용)
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': contentType,
                },
            });
            
            if (!uploadResponse.ok) {
                let errorMsg = '';
                if (uploadResponse.status === 403) {
                    errorMsg = 'CORS 오류 또는 Presigned URL 만료. Cloudflare R2 CORS 설정 확인 필요.';
                } else if (uploadResponse.status === 400) {
                    errorMsg = '잘못된 요청. Presigned URL 형식 확인 필요.';
                } else if (uploadResponse.status === 404) {
                    errorMsg = 'R2 버킷 또는 경로를 찾을 수 없음.';
                } else {
                    errorMsg = `R2 업로드 실패 (${uploadResponse.status}: ${uploadResponse.statusText})`;
                }
                throw new Error(errorMsg);
            }
            
            // 3️⃣ 서버에 업로드 완료 통보 (DB에 이미지 경로 저장)
            await completeUpload(type);
            
            // 4️⃣ 새로운 이미지 URL 조회 (캐시 방지를 위해 타임스탬프 추가)
            const imageUrl = await getImageUrl(type);
            const imageUrlWithTimestamp = `${imageUrl}?t=${Date.now()}`;
            
            if (type === 'BANNER') setBannerImage(imageUrlWithTimestamp);
            if (type === 'PROFILE') setProfileImage(imageUrlWithTimestamp);
            
            alert(`${type === 'BANNER' ? '배너' : '프로필'} 이미지가 업로드되었습니다.`);
        } catch (error) {
            // 에러 메시지 생성
            let errorMessage = '';
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                // CORS 또는 네트워크 에러
                errorMessage = 'CORS 정책 또는 네트워크 오류.\n\nCloudflare R2 CORS 설정 필요:\n[{\n  "AllowedOrigins": ["http://localhost:5173"],\n  "AllowedMethods": ["GET", "PUT", "POST"],\n  "AllowedHeaders": ["*"]\n}]';
            } else if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage = String(error);
            }
            
            alert(`이미지 업로드 실패:\n${errorMessage}`);
        } finally {
            if (type === 'BANNER') setLoadingBanner(false);
            if (type === 'PROFILE') setLoadingProfile(false);
        }
    };

    /**
     * 자기소개 저장 핸들러
     */
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

    return (
        <div className="profile-page" style={{
            backgroundColor: userTier?.tierResult?.mainTier 
                ? tierColorScheme[userTier.tierResult.mainTier].lightBg
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
                    backgroundColor: userTier?.tierResult?.mainTier 
                        ? tierColorScheme[userTier.tierResult.mainTier].mainColor
                        : tierColorScheme['KING'].mainColor,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* 배너 변경 버튼 */}
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
                                        borderColor: userTier?.tierResult?.mainTier 
                                            ? tierColorScheme[userTier.tierResult.mainTier]?.mainColor || tierColorScheme['KING'].mainColor
                                            : tierColorScheme['KING'].mainColor
                                    }}
                                />
                                {/* 프로필 변경 버튼 */}
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
                            <div className="text-sm font-bold uppercase tracking-wider mb-6 flex flex-col gap-1">
                                <p className="text-blue-600">
                                    ChessMate 가입: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR') : '-'}
                                </p>
                                <p className="text-amber-600">
                                    Lichess 가입: {profile?.lichessCreatedAt ? new Date(profile.lichessCreatedAt).toLocaleDateString('ko-KR') : '-'}
                                </p>
                            </div>

                            {/* Lichess 프로필 이동 버튼 */}
                            {profile?.lichessId && (
                                <div className="mb-6">
                                    <a
                                        href={`https://lichess.org/api/user/${profile.lichessId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold text-sm rounded-lg hover:shadow-lg transition hover:scale-105"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
                                        </svg>
                                        Lichess 프로필 보기
                                    </a>
                                </div>
                            )}
                            
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
                                                borderColor: userTier?.tierResult?.mainTier 
                                                    ? tierColorScheme[userTier.tierResult.mainTier]?.mainColor || tierColorScheme['KING'].mainColor
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
                                                    backgroundColor: userTier?.tierResult?.mainTier 
                                                        ? tierColorScheme[userTier.tierResult.mainTier]?.mainColor || tierColorScheme['KING'].mainColor
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
                                                    backgroundColor: userTier?.tierResult?.mainTier 
                                                        ? tierColorScheme[userTier.tierResult.mainTier]?.lightBg || tierColorScheme['KING'].lightBg
                                                        : tierColorScheme['KING'].lightBg,
                                                    borderColor: userTier?.tierResult?.mainTier 
                                                        ? tierColorScheme[userTier.tierResult.mainTier]?.mainColor || tierColorScheme['KING'].mainColor
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
                                                borderColor: userTier?.tierResult?.mainTier 
                                                    ? tierColorScheme[userTier.tierResult.mainTier]?.mainColor || tierColorScheme['KING'].mainColor
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

            {/* 게임 타입 선택 버튼 - 프로필 바로 하단 */}
            <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                <div className="flex flex-wrap gap-3 button-group">
                    {gameTypes.map((type) => {
                        const gameTypeColors: { [key: string]: { btn: string; activeBg: string; activeBorder: string; text: string } } = {
                            'BULLET': { btn: 'border-orange-200 text-orange-700 hover:bg-orange-50', activeBg: 'bg-orange-500', activeBorder: 'border-orange-500', text: 'text-white' },
                            'BLITZ': { btn: 'border-yellow-200 text-yellow-700 hover:bg-yellow-50', activeBg: 'bg-yellow-500', activeBorder: 'border-yellow-500', text: 'text-white' },
                            'RAPID': { btn: 'border-green-200 text-green-700 hover:bg-green-50', activeBg: 'bg-green-500', activeBorder: 'border-green-500', text: 'text-white' },
                            'CLASSICAL': { btn: 'border-blue-200 text-blue-700 hover:bg-blue-50', activeBg: 'bg-blue-500', activeBorder: 'border-blue-500', text: 'text-white' }
                        };
                        
                        const colors = gameTypeColors[type] || gameTypeColors['BULLET'];
                        const isActive = selectedGameType === type;
                        
                        const gameImageMap: { [key: string]: string } = {
                            'BULLET': 'bullet.webp',
                            'BLITZ': 'blitz.webp',
                            'RAPID': 'rapid.webp',
                            'CLASSICAL': 'classical.webp'
                        };
                        
                        return (
                            <button
                                key={type}
                                onClick={() => setSelectedGameType(type)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all duration-200 border-2 ${
                                    isActive
                                        ? `${colors.activeBg} ${colors.activeBorder} ${colors.text} shadow-lg transform scale-105`
                                        : `border-gray-300 text-gray-700 bg-white hover:bg-gray-50`
                                }`}
                            >
                                <img
                                    src={new URL(`../assets/images/logo/game/${gameImageMap[type]}`, import.meta.url).href}
                                    alt={type}
                                    className="w-5 h-5 object-contain"
                                />
                                {gameTypeDisplayNames[type]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 플레이 활동 섹션 - 게임타입 바로 하단 */}
            <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 text-animate">플레이 활동</h2>
                    {/* 년도 선택 */}
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
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 shadow-lg card-section card-hover overflow-x-auto">
                    <p className="text-gray-700 text-sm font-bold uppercase tracking-wider mb-6 text-animate">{selectedYear}년 활동 현황</p>
                    <div className="pb-6 min-w-full">
                        {/* 월 레이블 */}
                        <div className="flex gap-0 mb-3 text-xs text-gray-600 font-bold uppercase w-full px-1">
                            {['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'].map((month) => (
                                <div key={month} className="flex-1 text-center">
                                    {month}
                                </div>
                            ))}
                        </div>
                        <div className="flex w-full" style={{ gap: '1px' }}>
                            {/* 월별 주차 렌더링 */}
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
                                                
                                                // 현재 년도 범위 내에서만 표시
                                                if (date < firstDay || date > lastDay) {
                                                    return <div key={dateStr} className="w-4 h-4"></div>;
                                                }
                                                
                                                const dailyData = streakMap.get(dateStr);
            <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-animate">티어 {gameTypeDisplayNames[selectedGameType]}</h2>
                {loadingTier ? (
                    <div className="flex items-center justify-center py-12 bg-white border border-gray-200 rounded-lg">
                        <p className="text-gray-500 text-sm">티어 정보를 불러오는 중...</p>
                    </div>
                ) : userTier && userTier.tierResult && userTier.tierResult.mainTier ? (
                    (() => {
                        const mainTier = userTier.tierResult.mainTier;
                        const tierColorClasses: { [key: string]: { bg: string; border: string; text: string; accent: string } } = {
                            'PAWN': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', accent: 'bg-amber-100' },
                            'KNIGHT': { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-700', accent: 'bg-gray-100' },
                            'BISHOP': { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700', accent: 'bg-yellow-100' },
                            'ROOK': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', accent: 'bg-red-100' },
                            'QUEEN': { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-700', accent: 'bg-pink-100' },
                            'KING': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-700', accent: 'bg-blue-100' }
                        };
                        
                        const tierColor = tierColorClasses[mainTier] || tierColorClasses['PAWN'];
                        
                        return (
                            <div className={`${tierColor.bg} border-2 ${tierColor.border} rounded-xl p-8 card-section card-hover shadow-lg`}>
                                <div className="flex items-center gap-8">
                                    {/* 티어 이미지 - 색상 배경 */}
                                    <div className={`flex-shrink-0 w-32 h-32 rounded-xl flex items-center justify-center shadow-lg`} style={{backgroundColor: tierColorScheme[mainTier]?.mainColor}}>
                                        <img
                                            src={(() => {
                                                const tierNameMap: { [key: string]: string } = {
                                                    'PAWN': 'pawn.png',
                                                    'KNIGHT': 'knight.png',
                                                    'BISHOP': 'vishop.png',
                                                    'ROOK': 'rook.png',
                                                    'QUEEN': 'queen.png',
                                                    'KING': 'king.png'
                                                };
                                                const fileName = tierNameMap[mainTier] || 'pawn.png';
                                                return new URL(`../assets/images/tier/${fileName}`, import.meta.url).href;
                                            })()}
                                            alt={mainTier}
                                            className="w-24 h-24 object-contain drop-shadow-lg"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    
                                    {/* 티어 정보 */}
                                    <div className="flex-1">
                                        <p className={`${tierColor.text} text-xs font-bold uppercase tracking-widest mb-2`}>현재 티어</p>
                                        <div className="flex items-baseline gap-4 mb-6">
                                            <p className={`text-7xl font-black ${tierColor.text}`}>
                                                {mainTier.charAt(0) + mainTier.slice(1).toLowerCase()}
                                            </p>
                                            {userTier.tierResult.subTier && (
                                                <p className={`text-4xl font-bold ${tierColor.text} opacity-70`}>{convertSubTierToRoman(userTier.tierResult.subTier)}</p>
                                            )}
                                        </div>
                                        
                                        <div className={`${tierColor.accent} rounded-lg p-4 inline-block`}>
                                            <p className={`${tierColor.text} text-xs font-bold uppercase tracking-wider mb-1`}>현재 레이팅</p>
                                            <p className={`text-lg font-black ${tierColor.text}`}>{userTier.rating}</p>
                                        </div>
                                        
                                        {/* 프로모션 프로그래스 */}
                                        {(() => {
                                            const { remainingRating, percentage } = calculatePromotionProgress(userTier.rating, mainTier);
                                            const nextTiers = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'];
                                            const currentIndex = nextTiers.indexOf(mainTier);
                                            const nextTier = currentIndex < nextTiers.length - 1 ? nextTiers[currentIndex + 1] : 'KING';
                                            
                                            return (
                                                <div className="mt-6">
                                                    <p className={`${tierColor.text} text-xs font-bold uppercase tracking-wider mb-2`}>다음 프로모션까지</p>
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex-1">
                                                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                                <div 
                                                                    className="h-full transition-all duration-500 rounded-full" 
                                                                    style={{
                                                                        width: `${percentage}%`,
                                                                        backgroundColor: tierColorScheme[mainTier]?.mainColor
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-shrink-0 text-right">
                                                            <p className={`${tierColor.text} text-sm font-black`}>{remainingRating}</p>
                                                            <p className={`${tierColor.text} text-xs opacity-70`}>{nextTier}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    <div className="flex items-center justify-center py-12 bg-white border border-gray-200 rounded-lg">
                        <p className="text-gray-500 text-sm">티어 정보를 불러올 수 없습니다.</p>
                    </div>
                )}
            </div>

            {/* 레이팅 히스토리 섹션 */}
            <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-animate">레이팅 진행</h2>
                
                {/* 게임 타입 선택 버튼 */}
                <div className="mb-8 flex flex-wrap gap-3 button-group">
                    {gameTypes.map((type) => {
                        const gameTypeColors: { [key: string]: { btn: string; activeBg: string; activeBorder: string; text: string } } = {
                            'BULLET': { btn: 'border-orange-200 text-orange-700 hover:bg-orange-50', activeBg: 'bg-orange-500', activeBorder: 'border-orange-500', text: 'text-white' },
                            'BLITZ': { btn: 'border-yellow-200 text-yellow-700 hover:bg-yellow-50', activeBg: 'bg-yellow-500', activeBorder: 'border-yellow-500', text: 'text-white' },
                            'RAPID': { btn: 'border-green-200 text-green-700 hover:bg-green-50', activeBg: 'bg-green-500', activeBorder: 'border-green-500', text: 'text-white' },
                            'CLASSICAL': { btn: 'border-blue-200 text-blue-700 hover:bg-blue-50', activeBg: 'bg-blue-500', activeBorder: 'border-blue-500', text: 'text-white' }
                        };
                        
                        const colors = gameTypeColors[type] || gameTypeColors['BULLET'];
                        const isActive = selectedGameType === type;
                        
                        const gameImageMap: { [key: string]: string } = {
                            'BULLET': 'bullet.webp',
                            'BLITZ': 'blitz.webp',
                            'RAPID': 'rapid.webp',
                            'CLASSICAL': 'classical.webp'
                        };
                        
                        return (
                            <button
                                key={type}
                                onClick={() => setSelectedGameType(type)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all duration-200 border-2 ${
                                    isActive
                                        ? `${colors.activeBg} ${colors.activeBorder} ${colors.text} shadow-lg transform scale-105`
                                        : `border-gray-300 text-gray-700 bg-white hover:bg-gray-50`
                                }`}
                            >
                                <img
                                    src={new URL(`../assets/images/logo/game/${gameImageMap[type]}`, import.meta.url).href}
                                    alt={type}
                                    className="w-5 h-5 object-contain"
                                />
                                {gameTypeDisplayNames[type]}
                            </button>
                        );
                    })}
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-lg card-section card-hover">
                    {loadingRatingHistory ? (
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
            {/* 플레이 활동 섹션 */}
            <div className="max-w-6xl mx-auto px-6 mb-12 section-spacing">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 text-animate">플레이 활동</h2>
                    {/* 년도 선택 */}
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
                
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-8 shadow-lg card-section card-hover overflow-x-auto">
                    <p className="text-gray-700 text-sm font-bold uppercase tracking-wider mb-6 text-animate">{selectedYear}년 활동 현황</p>
                    <div className="pb-6 min-w-full">
                        {/* 월 레이블 */}
                        <div className="flex gap-0 mb-3 text-xs text-gray-600 font-bold uppercase w-full px-1">
                            {['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'].map((month) => (
                                <div key={month} className="flex-1 text-center">
                                    {month}
                                </div>
                            ))}
                        </div>
                        <div className="flex w-full" style={{ gap: '1px' }}>
                            {/* 월별 주차 렌더링 */}
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
                                                
                                                // 현재 년도 범위 내에서만 표시
                                                if (date < firstDay || date > lastDay) {
                                                    return <div key={dateStr} className="w-4 h-4"></div>;
                                                }
                                                
                                                const dailyData = streakMap.get(dateStr);
                                                
                                                // 게임 수에 따라 색상 결정 (0~4 단계)
                                                let activity = 0;
                                                if (dailyData) {
                                                    const total = dailyData.total;
                                                    if (total === 0) activity = 0;
                                                    else if (total <= 2) activity = 1;
                                                    else if (total <= 5) activity = 2;
                                                    else if (total <= 8) activity = 3;
                                                    else activity = 4;
                                                }
                                                
                                                const colors = [
                                                    'bg-gray-200 border-gray-300',  // 0: 활동 없음
                                                    'bg-blue-300 border-blue-400',  // 1: 적음
                                                    'bg-blue-500 border-blue-600',  // 2: 보통
                                                    'bg-blue-700 border-blue-800',  // 3: 많음
                                                    'bg-indigo-900 border-indigo-950'   // 4: 매우 많음
                                                ];
                                                
                                                return (
                                                    <div
                                                        key={dateStr}
                                                        className={`w-4 h-4 rounded-sm cursor-pointer transition hover:opacity-70 ${colors[activity]} border activity-cell group relative`}
                                                        title={`${dateStr}\n승리: ${dailyData?.win || 0} | 패배: ${dailyData?.lose || 0} | 무승부: ${dailyData?.draw || 0}`}
                                                    >
                                                        {/* 
                                                            TODO: 백엔드에서 DailyStreakDto에 tier, subTier 정보 추가 시 여기에 마크 표시
                                                            예: {dailyData?.tierChanged && <div className="absolute inset-0 border-2 border-yellow-400"></div>}
                                                        */}
                                                    </div>
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
                    
                    {/* 범례 */}
                    <div className="border-t border-blue-300 pt-6 flex gap-6 text-xs text-gray-700 font-medium">
                        <span className="font-bold uppercase">활동:</span>
                        <div className="flex gap-2 items-center">
                            <div className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300"></div>
                            <span>없음</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="w-3 h-3 rounded-sm bg-blue-300 border border-blue-400"></div>
                            <span>적음</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="w-3 h-3 rounded-sm bg-blue-500 border border-blue-600"></div>
                            <span>보통</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="w-3 h-3 rounded-sm bg-blue-700 border border-blue-800"></div>
                            <span>많음</span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="w-3 h-3 rounded-sm bg-indigo-900 border border-indigo-950"></div>
                            <span>매우 많음</span>
                        </div>
                    </div>
                    
                    {/* 결산 정보 */}
                    {(() => {
                        let totalGames = 0;
                        let totalWins = 0;
                        let totalLosses = 0;
                        let totalDraws = 0;
                        let consecutiveDays = 0;
                        let maxConsecutiveDays = 0;
                        
                        // 스트릭 데이터에서 통계 계산
                        const sortedDates = Array.from(streakMap.keys()).sort();
                        sortedDates.forEach((date) => {
                            const daily = streakMap.get(date)!;
                            totalGames += daily.total;
                            totalWins += daily.win;
                            totalLosses += daily.lose;
                            totalDraws += daily.draw;
                            
                            // 연속 플레이 일수 계산
                            if (daily.total > 0) {
                                consecutiveDays++;
                                maxConsecutiveDays = Math.max(maxConsecutiveDays, consecutiveDays);
                            } else {
                                consecutiveDays = 0;
                            }
                        });
                        
                        const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : '0.0';
                        
                        return (
                            <div className="border-t border-gray-200 pt-6 mt-6">
                                <p className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-6">연간 결산</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <p className="text-gray-600 text-xs font-medium uppercase tracking-wider mb-2">총 게임</p>
                                        <p className="text-2xl font-bold text-gray-900">{totalGames}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <p className="text-gray-600 text-xs font-medium uppercase tracking-wider mb-2">승리</p>
                                        <p className="text-2xl font-bold text-gray-900">{totalWins}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <p className="text-gray-600 text-xs font-medium uppercase tracking-wider mb-2">패배</p>
                                        <p className="text-2xl font-bold text-gray-900">{totalLosses}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <p className="text-gray-600 text-xs font-medium uppercase tracking-wider mb-2">무승부</p>
                                        <p className="text-2xl font-bold text-gray-900">{totalDraws}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <p className="text-gray-600 text-xs font-medium uppercase tracking-wider mb-2">승률</p>
                                        <p className="text-2xl font-bold text-gray-900">{winRate}%</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                                        <p className="text-gray-600 text-xs font-medium uppercase tracking-wider mb-2">연속</p>
                                        <p className="text-2xl font-bold text-gray-900">{maxConsecutiveDays}일</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            <Footer/>
        </div>
    );
}   

export default Profile;