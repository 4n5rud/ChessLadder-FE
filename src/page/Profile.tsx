import Header from "../global/Header";
import Footer from "../global/Footer";
import { useState, useEffect, useRef } from "react";
import type { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toPng } from 'html-to-image';
import { initializeAuth } from "../api/authService";
import { useAuthStore } from "../store/authStore";
import { getUploadUrl, completeUpload, validateImageFile, validateImageDimensions } from "../api/imageService";
import type { UserImageType } from "../api/imageService";
import { getUserProfile, updateUserDescription, getUserStreak, getUserPerf, forceRefreshStats, deleteAccount, getColorStats, getFirstMoveStats, getLichessSummary, getChesscomSummary, getRatingHistory } from "../api/userService";
import type { ProfileResponse, DailyStreakDto, UserPerfResponse, ColorStatsResponse, FirstMoveResponse, RatingHistoryResponse } from "../api/userService";
import { useLanguage } from "../context/LanguageContext";
import MonthlyRatingHistoryChart from "../components/MonthlyRatingHistoryChart";
import { TierSection } from "../components/TierSection";
import ProfileCard from "../components/ProfileCard";
import { GameTypeButtons } from "../components/GameTypeButtons";
import ColorStatsChart from "../components/ColorStatsChart";
import FirstMoveStatsChart from "../components/FirstMoveStatsChart";
import GameStatsDisplay from "../components/GameStatsDisplay";
import lichessLogoImg from "../assets/images/logo/lichess-logo.png";
import "./Profile.css";

const Profile = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [bannerImage, setBannerImage] = useState<string | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [description, setDescription] = useState<string>('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [loadingBanner, setLoadingBanner] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [savingDescription, setSavingDescription] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingAccount, setDeletingAccount] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [showError, setShowError] = useState(false);
    
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
    
    // 티어별 색상 — 티어 정체성을 은은하게 표현
    const tierColorScheme: { [key: string]: { mainColor: string; lightBg: string; darkBg: string; borderColor: string; lightText: string; darkText: string } } = {
        'PAWN':   { mainColor: 'rgba(150,155,165,0.75)', lightBg: 'rgba(150,155,165,0.06)', darkBg: 'rgba(150,155,165,0.10)', borderColor: 'rgba(150,155,165,0.20)', lightText: 'rgba(180,185,195,0.65)', darkText: 'rgba(200,205,215,1)' },
        'KNIGHT': { mainColor: 'rgba(80,160,100,0.80)',  lightBg: 'rgba(80,160,100,0.06)',  darkBg: 'rgba(80,160,100,0.11)',  borderColor: 'rgba(80,160,100,0.22)',  lightText: 'rgba(100,180,120,0.65)', darkText: 'rgba(130,210,150,1)'  },
        'BISHOP': { mainColor: 'rgba(60,145,195,0.80)',  lightBg: 'rgba(60,145,195,0.06)',  darkBg: 'rgba(60,145,195,0.11)',  borderColor: 'rgba(60,145,195,0.22)',  lightText: 'rgba(80,165,215,0.65)', darkText: 'rgba(110,190,240,1)'  },
        'ROOK':   { mainColor: 'rgba(47,99,157,0.90)',   lightBg: 'rgba(47,99,157,0.07)',   darkBg: 'rgba(47,99,157,0.13)',   borderColor: 'rgba(47,99,157,0.27)',   lightText: 'rgba(74,130,200,0.65)', darkText: 'rgba(100,160,230,1)'  },
        'QUEEN':  { mainColor: 'rgba(130,75,185,0.80)',  lightBg: 'rgba(130,75,185,0.06)',  darkBg: 'rgba(130,75,185,0.11)',  borderColor: 'rgba(130,75,185,0.23)',  lightText: 'rgba(155,100,210,0.65)', darkText: 'rgba(185,135,240,1)' },
        'KING':   { mainColor: 'rgba(195,155,55,0.82)',  lightBg: 'rgba(195,155,55,0.07)',  darkBg: 'rgba(195,155,55,0.11)',  borderColor: 'rgba(195,155,55,0.23)',  lightText: 'rgba(210,170,80,0.65)', darkText: 'rgba(235,195,100,1)'  },
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
    const [ratingHistoryResponse, setRatingHistoryResponse] = useState<RatingHistoryResponse | null>(null);
    const [loadingRatingHistory, setLoadingRatingHistory] = useState(false);
    
    // 티어 관련 상태
    const [userPerf, setUserPerf] = useState<UserPerfResponse | null>(null);
    const [loadingPerf, setLoadingPerf] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
    const [remainingTime, setRemainingTime] = useState(0);
    const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5분 (300초) 제한

    // 색깔별 게임 통계 관련 상태
    const [colorStats, setColorStats] = useState<ColorStatsResponse | null>(null);
    const [loadingColorStats, setLoadingColorStats] = useState(false);

    // 첫 수 통계 관련 상태
    const [firstMoveStats, setFirstMoveStats] = useState<FirstMoveResponse | null>(null);
    const [loadingFirstMoveStats, setLoadingFirstMoveStats] = useState(false);

    // 데이터 로드 완료 플래그 (로딩 전: ? 표시)
    const [summaryLoaded, setSummaryLoaded] = useState(false);
    const [streakLoaded, setStreakLoaded] = useState(false);

    const cardRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // 미리보기가 열릴 때 스크롤
    useEffect(() => {
        if (showPreview && previewRef.current) {
            previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [showPreview]);

    // 에러 메시지 자동 사라짐
    useEffect(() => {
        if (showError) {
            const timer = setTimeout(() => {
                setShowError(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [showError]);

    const handleExportCard = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);
        try {
            // 레이더나 다른 요소가 렌더링될 시간을 줌
            await new Promise(resolve => setTimeout(resolve, 800));
            const dataUrl = await toPng(cardRef.current, { 
                cacheBust: true,
                pixelRatio: 2,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left',
                    opacity: '1',
                    visibility: 'visible'
                }
            });
            const link = document.createElement('a');
            link.download = `chess-ladder-${profile?.username || 'user'}-card.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            // 카드 추출 실패 (사용자에게 표시 안 함)
        } finally {
            setIsExporting(false);
        }
    };

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

    // 인증 체크: 로그인이 안 되어 있으면 홈으로 리다이렉트
    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchUserAndImages = async () => {
            try {
                // 먼저 인증 상태 초기화 (store 업데이트)
                await initializeAuth();

                // 프로필 정보 조회
                const profileData = await getUserProfile();

                // 이미지 강제 갱신을 위해 타임스탬프 추가
                if (profileData) {
                    const timestamp = Date.now();
                    if (profileData.profileImageUrl) {
                        profileData.profileImageUrl = `${profileData.profileImageUrl}?t=${timestamp}`;
                        profileData.profile_image = profileData.profileImageUrl;
                    }
                    if (profileData.bannerImageUrl) {
                        profileData.bannerImageUrl = `${profileData.bannerImageUrl}?t=${timestamp}`;
                        profileData.banner_image = profileData.bannerImageUrl;
                    }
                }

                // 요약 통계 병합
                let summary: Partial<ProfileResponse> = {};
                try {
                    if (profileData?.platform === 'CHESSCOM') {
                        summary = await getChesscomSummary();
                    } else {
                        summary = await getLichessSummary();
                    }
                } catch (_) {
                    // 요약 통계 조회 실패 시 기본값 사용
                }

                const mergedProfile: ProfileResponse = { ...profileData, ...summary };

                // 프로필 데이터 수신
                setProfile(mergedProfile);
                setDescription(mergedProfile?.description || '');
                setSummaryLoaded(true);

                // 년도 배열 생성
                const currentYear = new Date().getFullYear();
                const buildYears = (startYear: number) => {
                    const years: number[] = [];
                    for (let y = startYear; y <= currentYear; y++) years.push(y);
                    return years;
                };

                // platformJoinedAt 기반 연도 범위 설정 (성공적으로 받아온 경우)
                const startYear = profileData?.platformJoinedAt
                    ? new Date(profileData.platformJoinedAt).getFullYear()
                    : currentYear - 2; // 없으면 기본 3년
                setAvailableYears(buildYears(startYear));
                setSelectedYear(currentYear);

                // 프로필과 배너 이미지를 profileData에서 직접 가져오기
                if (profileData?.profileImageUrl) {
                    setProfileImage(profileData.profileImageUrl);
                }
                if (profileData?.bannerImageUrl) {
                    setBannerImage(profileData.bannerImageUrl);
                }
            } catch (error) {
                // 사용자 데이터 조회 실패
            }
        };
        fetchUserAndImages();
    }, []);

    // QueryClient 인스턴스 접근
    const queryClient = useQueryClient();

    useEffect(() => {
        // platform이 결정된 이후에만 호출
        if (!profile?.platform) return;

        const fetchGameTypeData = async () => {
            setLoadingPerf(true);
            setLoadingColorStats(true);
            setLoadingFirstMoveStats(true);
            setLoadingRatingHistory(true);
            try {
                const [perfData, colorData, firstMoveData, ratingHistData] = await Promise.all([
                    getUserPerf(selectedGameType),
                    getColorStats(selectedGameType),
                    getFirstMoveStats(selectedGameType),
                    getRatingHistory(selectedGameType)
                ]);
                // API 응답에서 data가 빈 배열이면 null 반환됨
                setUserPerf(perfData);
                setColorStats(colorData);
                setFirstMoveStats(firstMoveData);
                setRatingHistoryResponse(ratingHistData && ratingHistData.data.length > 0 ? ratingHistData : null);
            } catch (error) {
                setUserPerf(null);
                setColorStats(null);
                setFirstMoveStats(null);
                setRatingHistoryResponse(null);
            } finally {
                setLoadingPerf(false);
                setLoadingColorStats(false);
                setLoadingFirstMoveStats(false);
                setLoadingRatingHistory(false);
            }
        };

        fetchGameTypeData();
    }, [selectedGameType, profile?.platform]);

    // 년도 변경 시 스트릭 데이터 조회 (profile.platform 이 결정된 이후에만 실행)
    useEffect(() => {
        const fetchStreak = async () => {
            try {
                const streakData = await getUserStreak(selectedYear, profile?.platform);
                if (!streakData) {
                    setStreakMap(new Map());
                    return;
                }

                // 선택된 연도의 days 찾기
                const selectedYearData = streakData.years?.find(y => y.year === selectedYear);
                const days = selectedYearData?.days ?? [];

                const map = new Map<string, DailyStreakDto>();
                if (Array.isArray(days)) {
                    days.forEach((daily: DailyStreakDto) => {
                        map.set(daily.date, daily);
                    });
                }
                setStreakMap(map);
                setStreakLoaded(true);
            } catch (error) {
                setStreakMap(new Map());
                setStreakLoaded(true);
            }
        };

        setStreakLoaded(false);
        if (selectedYear && profile?.platform) {
            fetchStreak();
        }
    }, [selectedYear, profile?.platform]);

    const handleImageUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
        type: UserImageType
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'BANNER') setLoadingBanner(true);
        if (type === 'PROFILE') setLoadingProfile(true);

        try {
            // 유효성 검사 1: 기본 검사 (크기, 형식)
            const basicError = validateImageFile(file);
            if (basicError) {
                setErrorMessage(basicError.message);
                setShowError(true);
                if (type === 'BANNER') setLoadingBanner(false);
                if (type === 'PROFILE') setLoadingProfile(false);
                return;
            }

            // 유효성 검사 2: 해상도 검사
            const dimensionError = await validateImageDimensions(file);
            if (dimensionError) {
                setErrorMessage(dimensionError.message);
                setShowError(true);
                if (type === 'BANNER') setLoadingBanner(false);
                if (type === 'PROFILE') setLoadingProfile(false);
                return;
            }

            // 1. Presigned URL 취득
            const result = await getUploadUrl(type, file.type);
            const { uploadUrl, contentType } = result;

            // 2. Cloudflare R2에 파일 직접 업로드
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': contentType,
                },
            });

            if (!uploadResponse.ok) {
                throw new Error(`업로드 실패: ${uploadResponse.status}`);
            }

            // 3. 백엔드에 업로드 완료 알림 (DB에 저장)
            await completeUpload(type);

            // 업로드 완료 후 프로필 데이터 재조회
            const updatedProfile = await getUserProfile();

            // 이미지 강제 갱신을 위해 타임스탬프 추가
            if (updatedProfile) {
                const timestamp = Date.now();
                if (updatedProfile.profileImageUrl) {
                    updatedProfile.profileImageUrl = `${updatedProfile.profileImageUrl}?t=${timestamp}`;
                    updatedProfile.profile_image = updatedProfile.profileImageUrl;
                }
                if (updatedProfile.bannerImageUrl) {
                    updatedProfile.bannerImageUrl = `${updatedProfile.bannerImageUrl}?t=${timestamp}`;
                    updatedProfile.banner_image = updatedProfile.bannerImageUrl;
                }
            }

            setProfile(updatedProfile);

            if (updatedProfile?.profileImageUrl) {
                setProfileImage(updatedProfile.profileImageUrl);
            }
            if (updatedProfile?.bannerImageUrl) {
                setBannerImage(updatedProfile.bannerImageUrl);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.';
            setErrorMessage(errorMsg);
            setShowError(true);
        } finally {
            if (type === 'BANNER') setLoadingBanner(false);
            if (type === 'PROFILE') setLoadingProfile(false);
        }
    };

    const handleSaveDescription = async () => {
        setSavingDescription(true);
        try {
            await updateUserDescription(description);

            // 자기소개 업데이트 후 프로필 데이터 재조회
            const updatedProfile = await getUserProfile();

            // 이미지 타임스탬프 유지 또는 갱신
            if (updatedProfile) {
                const timestamp = Date.now();
                if (updatedProfile.profileImageUrl) {
                    updatedProfile.profileImageUrl = `${updatedProfile.profileImageUrl}?t=${timestamp}`;
                    updatedProfile.profile_image = updatedProfile.profileImageUrl;
                }
                if (updatedProfile.bannerImageUrl) {
                    updatedProfile.bannerImageUrl = `${updatedProfile.bannerImageUrl}?t=${timestamp}`;
                    updatedProfile.banner_image = updatedProfile.bannerImageUrl;
                }
            }

            setProfile(updatedProfile);
            setDescription(updatedProfile?.description || '');

            setIsEditingDescription(false);
        } catch (error) {
            // 에러 처리 (사용자에게 표시 안 함)
        } finally {
            setSavingDescription(false);
        }
    };

    const handleForceRefresh = async () => {
        // 쿨타임 체크
        if (lastRefreshTime && Date.now() - lastRefreshTime < REFRESH_COOLDOWN) {
            const remaining = Math.ceil((REFRESH_COOLDOWN - (Date.now() - lastRefreshTime)) / 1000);
            alert(`${remaining}초 동안 다시 갱신할 수 없습니다. (5분 제한)`);
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
        } catch (error) {
            // 강제 갱신 실패 (사용자에게 표시 안 함)
        } finally {
            setRefreshing(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeletingAccount(true);
        try {
            await deleteAccount();
            // 삭제 후 메인 페이지로 리다이렉트
            window.location.href = '/';
        } catch (error) {
            // 계정 삭제 실패 (사용자에게 표시 안 함)
        } finally {
            setDeletingAccount(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070d1a]">
            <Header />

            {/* 에러 토스트 메시지 */}
            {showError && errorMessage && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-red-500/90 backdrop-blur-sm border border-red-400/30 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md">
                        <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">{errorMessage}</span>
                    </div>
                </div>
            )}

            {/* 배너 이미지 */}
            <div
                className="w-full relative group banner-section z-0"
                style={bannerImage ? {
                    height: window.innerWidth < 768 ? '400px' : '650px',
                    backgroundImage: `url(${bannerImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                } : {
                    height: window.innerWidth < 768 ? '400px' : '650px',
                    backgroundImage: userPerf
                        ? userPerf.uncertain
                            ? 'none'
                            : `linear-gradient(135deg, ${tierColorScheme[getTierFromRating(userPerf.rating)].darkBg}, rgba(7,13,26,0.95))`
                        : `linear-gradient(135deg, ${tierColorScheme['KING'].darkBg}, rgba(7,13,26,0.95))`,
                    backgroundColor: userPerf
                        ? userPerf.uncertain
                            ? '#1a1a24'
                            : 'transparent'
                        : 'transparent',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <label className="absolute bottom-2 right-3 md:bottom-4 md:right-6 cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload(e, 'BANNER')}
                        className="hidden"
                        disabled={loadingBanner}
                    />
                    <div className={`px-3 py-2 md:px-4 md:py-2 bg-white/90 backdrop-blur-sm text-gray-700 font-bold rounded-lg text-xs md:text-sm transition hover:bg-white/100 shadow-lg flex items-center gap-2 ${loadingBanner ? 'opacity-50 pointer-events-none' : ''}`}>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        {loadingBanner ? t('profile.uploading') : t('profile.bannerImageEdit')}
                    </div>
                </label>
            </div>

            {/* 프로필 섹션 */}
            <div className="max-w-6xl mx-auto px-3 md:px-6 -mt-14 md:-mt-24 relative z-10 mb-8">
                <div className="bg-[#070d1a]/95 border border-white/20 rounded-2xl p-4 md:p-8 card-section card-hover backdrop-blur-md">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start md:items-start">
                        {/* 프로필 이미지 */}
                        <div className="flex flex-col items-center gap-4 flex-shrink-0 w-full md:w-auto">
                            <div className="relative group">
                                <img
                                    src={profileImage || 'https://via.placeholder.com/140'}
                                    alt="프로필 사진"
                                    className="w-24 h-24 md:w-36 md:h-36 rounded-2xl border-4 object-cover shadow-lg profile-image profile-image-hover"
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
                                        {loadingProfile ? t('profile.uploading').substring(0, 2) : t('profile.profileImageEdit')}
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* 프로필 정보 */}
                        <div className="flex-1 w-full md:w-auto">
                            <h1 className="text-2xl md:text-4xl font-black text-white mb-2">
                                {profile?.username || 'User'}
                            </h1>
                            <div className="text-[10px] md:text-xs font-normal uppercase tracking-wider mb-6 flex flex-col md:flex-row gap-2 md:gap-4">
                                <p className="text-white/40 whitespace-nowrap">
                                    {language === 'KR' ? '체스래더 가입일' : 'ChessLadder Joined'}: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
                                </p>
                                <p className="text-white/40 whitespace-nowrap">
                                    {t('profile.lichessJoinDate')}: {profile?.lichessCreatedAt ? new Date(profile.lichessCreatedAt).toLocaleDateString() : '-'}
                                </p>
                            </div>

                            {/* Lichess 프로필 이동 버튼 + 강제 갱신 버튼 */}
                            <div className="mb-6 flex flex-col items-start gap-4">
                                <div className="flex gap-2 flex-wrap">
                                    {profile?.platform !== 'CHESSCOM' && profile?.lichessId && (
                                        <a
                                            href={`https://lichess.org/@/${profile.lichessId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center w-10 h-10 bg-white/10 border border-white/20 rounded-lg hover:shadow-lg transition hover:scale-105"
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
                                        className="inline-flex items-center justify-center px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg hover:shadow-lg transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                                        title={remainingTime > 0 ? `${Math.ceil(remainingTime / 1000)}${t('profile.availableAfter')}` : t('profile.fetchFromLichess')}
                                    >
                                        {refreshing ? t('profile.refreshing') : remainingTime > 0 ? `${Math.ceil(remainingTime / 1000)}${t('profile.waitSeconds')}` : t('profile.dataRefresh')}
                                    </button>
                                    <div className="flex relative">
                                        <button
                                            onClick={handleExportCard}
                                            disabled={isExporting || !profile || !userPerf}
                                            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-2 border-transparent rounded-l-lg hover:shadow-lg transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                                        >
                                            {isExporting ? '...' : (language === 'KR' ? '프로필 카드 추출' : 'Export Profile Card')}
                                        </button>
                                        <button
                                            onClick={() => setShowPreview(!showPreview)}
                                            className={`inline-flex items-center justify-center w-10 py-2 border-2 border-transparent rounded-r-lg transition hover:shadow-lg ${showPreview ? 'bg-indigo-700 text-white' : 'bg-indigo-500 text-white'}`}
                                            title={language === 'KR' ? '미리보기 토글' : 'Toggle Preview'}
                                        >
                                            <svg 
                                                className={`w-4 h-4 transition-transform duration-300 ${showPreview ? 'rotate-180' : ''}`} 
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* 추출용 숨겨진 카드 (미리보기가 닫혀있어도 추출 제어 가능하게) - 이동됨 */}

                                {/* 드롭다운 형식의 미리보기 섹션 */}
                                {showPreview && (
                                    <div 
                                        ref={previewRef}
                                        className="w-full max-w-[750px] bg-[#0d1626] rounded-[32px] p-8 border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 z-50 overflow-hidden"
                                    >
                                        <div className="flex flex-col gap-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h2 className="text-xl font-black text-white mb-1">{language === 'KR' ? '프로필 카드 미리보기' : 'Profile Card Preview'}</h2>
                                                    <p className="text-xs text-white/40 font-medium">
                                                        {language === 'KR' 
                                                            ? `현재 선택된 [${selectedGameType.toUpperCase()}] 타입 기준 미리보기입니다.` 
                                                            : `Preview for the currently selected [${selectedGameType.toUpperCase()}] type.`}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex justify-center bg-white/3 p-8 rounded-[24px] border border-white/8 overflow-x-auto shadow-inner">
                                                <div style={{ width: '595px', height: '637px' }}>
                                                    {profile && userPerf && (
                                                        <ProfileCard
                                                            profile={profile}
                                                            userPerf={userPerf}
                                                            ratingHistory={[]}
                                                            streakMap={streakMap}
                                                            selectedYear={selectedYear}
                                                            gameType={selectedGameType}
                                                            promotionThresholds={promotionThresholds}
                                                            convertSubTierToRoman={convertSubTierToRoman}
                                                            // 미리보기 용이므로 Ref는 연결하지 않음 (추출은 숨겨진 카드로 수행)
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* 자기소개 섹션 */}
                            <div>
                                {isEditingDescription ? (
                                    <div className="flex flex-col gap-3">
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder={t('profile.enterDescription')}
                                            className="w-full p-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 bg-white/5 text-white placeholder-white/30"
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
                                                {savingDescription ? t('profile.saving') : t('profile.save')}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingDescription(false);
                                                    setDescription(profile?.description || '');
                                                }}
                                                className="px-4 py-2 bg-white/10 text-white/70 font-bold text-sm rounded-lg hover:bg-white/15 transition"
                                            >
                                                {t('profile.cancel')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <p className="text-white/70 text-sm leading-relaxed p-4 rounded-lg border bg-white/5 border-white/10"
                                            >
                                                {description || t('profile.noDescription')}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsEditingDescription(true)}
                                            className="px-3 py-1.5 text-white/70 hover:text-white font-medium text-sm border-2 rounded transition flex-shrink-0"
                                            style={{
                                                borderColor: userPerf 
                                                    ? userPerf.uncertain
                                                        ? '#9ca3af'
                                                        : tierColorScheme[getTierFromRating(userPerf.rating)]?.mainColor || tierColorScheme['KING'].mainColor
                                                    : tierColorScheme['KING'].mainColor
                                            }}
                                        >
                                            {t('profile.edit')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 게임 통계 (프로필 섹션 하단) */}
                    <GameStatsDisplay profile={profile} userPerf={userPerf} summaryLoaded={summaryLoaded} />
                </div>
            </div>

            {/* 플레이 활동 섹션 */}
            <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white text-animate">{t('profile.gameActivityRecord')}</h2>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-4 py-2 bg-white/5 border border-white/15 rounded-lg text-white text-sm font-medium focus:outline-none transition"
                    >
                        {availableYears.map((year) => (
                            <option key={year} value={year}>
                                {year}{language === 'KR' ? '년' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="rounded-lg p-4 md:p-8 card-section card-hover overflow-x-auto bg-white/4 border border-white/8">
                    <p className="text-white/60 text-sm font-bold uppercase tracking-wider mb-6 text-animate">{selectedYear}{language === 'KR' ? '년' : ''} {t('profile.activityStatus')}</p>
                    <div className="pb-6 min-w-full">
                        <div className="flex gap-0 mb-3 text-xs text-white/60 font-bold uppercase w-full px-1">
                            {['profile.monthJan', 'profile.monthFeb', 'profile.monthMar', 'profile.monthApr', 'profile.monthMay', 'profile.monthJun', 'profile.monthJul', 'profile.monthAug', 'profile.monthSep', 'profile.monthOct', 'profile.monthNov', 'profile.monthDec'].map((monthKey) => (
                                <div key={monthKey} className="flex-1 text-center">
                                    {t(monthKey)}
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
                                                    const total = dailyData.total ?? 0;
                                                    if (total === 0) activity = 0;
                                                    else if (total <= 2) activity = 1;
                                                    else if (total <= 5) activity = 2;
                                                    else if (total <= 8) activity = 3;
                                                    else activity = 4;
                                                }

                                                // 어두운 배경에 자연스럽게 녹아드는 색상
                                                const colorStyles = [
                                                    'rgba(255,255,255,0.06)',  // 0: 없음
                                                    'rgba(47,99,157,0.30)',    // 1: 1-2게임
                                                    'rgba(47,99,157,0.52)',    // 2: 3-5게임
                                                    'rgba(47,99,157,0.74)',    // 3: 6-8게임
                                                    'rgba(47,99,157,0.95)',    // 4: 9+게임
                                                ];
                                                const borderStyles = [
                                                    'rgba(255,255,255,0.08)',
                                                    'rgba(47,99,157,0.40)',
                                                    'rgba(47,99,157,0.65)',
                                                    'rgba(47,99,157,0.88)',
                                                    'rgba(74,143,212,0.90)',
                                                ];

                                                return (
                                                    <div
                                                        key={dateStr}
                                                        style={{
                                                            backgroundColor: colorStyles[activity],
                                                            borderColor: borderStyles[activity],
                                                        }}
                                                        className="w-4 h-4 rounded-sm border cursor-help transition hover:brightness-125"
                                                        title={dailyData ? `${dateStr} • ${dailyData.total}게임: ${dailyData.win}승 ${dailyData.lose}패 ${dailyData.draw}무` : '데이터 없음'}
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
                            totalGames += daily.total ?? 0;
                            totalWins += daily.win ?? 0;
                            totalLoses += daily.lose ?? 0;
                            totalDraws += daily.draw ?? 0;
                            if ((daily.total ?? 0) > 0) activeDays++;
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

                        const winRate = totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) : null;

                        const streakTier = userPerf && !userPerf.uncertain ? getTierFromRating(userPerf.rating) : 'PAWN';
                        const stc = tierColorScheme[streakTier];

                        return (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Max Streak — tier 색상으로 강조 */}
                                <div
                                    className="rounded-lg p-6 border transition hover:brightness-110"
                                    style={{ backgroundColor: stc.darkBg, borderColor: stc.borderColor }}
                                >
                                    <div className="text-center">
                                        <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: stc.lightText }}>{t('profile.consecutiveDays')}</p>
                                        <p className="text-5xl font-black leading-none mb-1" style={{ color: stc.darkText }}>{streakLoaded ? maxStreak : '?'}</p>
                                        <p className="text-xs text-white/40 font-medium">일</p>
                                    </div>
                                </div>
                                {/* Active Days */}
                                <div
                                    className="rounded-lg p-6 border"
                                    style={{ backgroundColor: stc.lightBg, borderColor: stc.borderColor }}
                                >
                                    <div className="text-center">
                                        <p className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">{t('profile.activeDays')}</p>
                                        <p className="text-4xl font-black text-white leading-none mb-1">{streakLoaded ? activeDays : '?'}</p>
                                        <p className="text-xs text-white/40 font-medium">일</p>
                                    </div>
                                </div>
                                {/* Total Games */}
                                <div
                                    className="rounded-lg p-6 border"
                                    style={{ backgroundColor: stc.lightBg, borderColor: stc.borderColor }}
                                >
                                    <div className="text-center">
                                        <p className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">{t('profile.totalPlayGames')}</p>
                                        <p className="text-4xl font-black text-white leading-none mb-1">{streakLoaded ? totalGames : '?'}</p>
                                        <p className="text-xs text-white/40 font-medium">게임</p>
                                    </div>
                                </div>
                                {/* Win Rate */}
                                <div
                                    className="rounded-lg p-6 border"
                                    style={{ backgroundColor: stc.lightBg, borderColor: stc.borderColor }}
                                >
                                    <div className="text-center">
                                        <p className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">{t('profile.winRate')}</p>
                                        <p className="text-4xl font-black text-white leading-none mb-1">
                                            {streakLoaded ? (winRate !== null ? `${winRate}%` : '0.0%') : '?'}
                                        </p>
                                        <p className="text-xs text-white/40 font-medium">
                                            {streakLoaded ? `${totalWins}승 ${totalLoses}패` : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* 게임 타입 선택 버튼 */}
            <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8">
                <GameTypeButtons
                    gameTypes={gameTypes}
                    selectedGameType={selectedGameType}
                    gameTypeDisplayNames={gameTypeDisplayNames}
                    onGameTypeChange={setSelectedGameType}
                />
            </div>

            {/* 티어 섹션 */}
            <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
                <TierSection
                    userPerf={userPerf}
                    loadingPerf={loadingPerf}
                    tierColorScheme={tierColorScheme}
                    promotionThresholds={promotionThresholds}
                    convertSubTierToRoman={convertSubTierToRoman}
                    platform={profile?.platform as 'LICHESS' | 'CHESSCOM' | undefined}
                />
            </div>

            {/* 레이팅 히스토리 섹션 */}
            <div className="max-w-6xl mx-auto px-3 md:px-6 mb-8 section-spacing">
                <div className="flex flex-col gap-1 mb-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-animate">{language === 'KR' ? '레이팅 진행 추세' : 'Rating Progress Trend'}</h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-transparent rounded-full"></div>
                </div>
                <div className="bg-white/4 border border-white/8 rounded-lg p-8 card-section card-hover">
                    {loadingRatingHistory ? (
                        <div className="flex items-center justify-center h-80">
                            <p className="text-white/40 text-sm">{t('profile.dataLoading')}</p>
                        </div>
                    ) : ratingHistoryResponse && ratingHistoryResponse.data.length > 0 ? (
                        <div className="h-[450px]">
                            <MonthlyRatingHistoryChart
                                ratingHistory={ratingHistoryResponse}
                                tierThresholds={promotionThresholds}
                                isLoading={loadingRatingHistory}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-80">
                            <p className="text-white/40 text-sm">{gameTypeDisplayNames[selectedGameType]} {t('profile.noRatingData')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 색깔별 게임 통계 섹션 */}
            <div className="max-w-6xl mx-auto px-6 mb-12 section-spacing">
                <div className="flex flex-col gap-1 mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-animate">{language === 'KR' ? '색깔별 게임 통계' : 'Color Game Statistics'}</h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-transparent rounded-full"></div>
                </div>
                {colorStats ? (
                    <ColorStatsChart data={colorStats} isLoading={loadingColorStats} />
                ) : (
                    <div className="bg-gradient-to-br from-[#0d1626]/80 to-[#070d1a]/50 border border-white/10 rounded-2xl p-8">
                        <p className="text-white/40 text-center h-96 flex items-center justify-center">{language === 'KR' ? '데이터가 없습니다.' : 'No data available'}</p>
                    </div>
                )}
            </div>

            {/* 첫 수 통계 섹션 */}
            <div className="max-w-6xl mx-auto px-6 mb-12 section-spacing">
                <div className="flex flex-col gap-1 mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-white text-animate">{language === 'KR' ? '첫 수 통계' : 'First Move Statistics'}</h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-transparent rounded-full"></div>
                </div>
                {firstMoveStats ? (
                    <FirstMoveStatsChart data={firstMoveStats} isLoading={loadingFirstMoveStats} />
                ) : (
                    <div className="bg-gradient-to-br from-[#0d1626]/80 to-[#070d1a]/50 border border-white/10 rounded-2xl p-8">
                        <p className="text-white/40 text-center h-96 flex items-center justify-center">{language === 'KR' ? '데이터가 없습니다.' : 'No data available'}</p>
                    </div>
                )}
            </div>

            {/* Hidden export card placed outside the zoom wrapper so it renders at 1:1 for html-to-image */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0, pointerEvents: 'none', opacity: 1 }}>
                {profile && userPerf && (
                    <ProfileCard
                        profile={profile}
                        userPerf={userPerf}
                        ratingHistory={[]}
                        streakMap={streakMap}
                        selectedYear={selectedYear}
                        gameType={selectedGameType}
                        promotionThresholds={promotionThresholds}
                        convertSubTierToRoman={convertSubTierToRoman}
                        cardRef={cardRef}
                    />
                )}
            </div>

            {/* 회원 탈퇴 섹션 */}
            <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-red-400 mb-1">{t('profile.deleteAccount')}</h3>
                            <p className="text-sm text-red-400/80">{t('profile.deleteAccountWarning')}</p>
                        </div>
                        <button
                            onClick={() => {
                                setShowDeleteConfirm(true);
                            }}
                            className="px-4 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition hover:shadow-lg flex-shrink-0"
                        >
                            {t('profile.deleteAccount')}
                        </button>
                    </div>
                </div>
            </div>

            {/* 회원 탈퇴 확인 다이얼로그 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#0d1626] border border-white/15 rounded-lg p-8 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-xl font-bold text-red-400 mb-4">{t('profile.deleteAccountConfirm')}</h3>
                        <p className="text-white/70 text-sm mb-6">{t('profile.deleteAccountWarning')}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                }}
                                disabled={deletingAccount}
                                className="flex-1 px-4 py-2 bg-white/10 text-white/70 font-bold text-sm rounded-lg hover:bg-white/15 transition disabled:opacity-50"
                            >
                                {t('profile.deleteAccountNo')}
                            </button>
                            <button
                                onClick={() => {
                                    handleDeleteAccount();
                                }}
                                disabled={deletingAccount}
                                className="flex-1 px-4 py-2 bg-red-600 text-white font-bold text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                            >
                                {deletingAccount ? t('profile.deleteAccountDeleting') : t('profile.deleteAccountYes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer/>
        </div>
    );
};   

export default Profile;
