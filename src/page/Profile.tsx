import Header from "../global/Header";
import Footer from "../global/Footer";
import { useState, useEffect } from "react";
import type { UserPrincipal } from "../api/authService";
import { getCurrentUser } from "../api/authService";
import { getUploadUrl, completeUpload, getImageUrl } from "../api/imageService";
import type { UserImageType } from "../api/imageService";
import { getUserProfile, updateUserDescription, getUserStreak } from "../api/userService";
import type { ProfileResponse, StreakResponse, DailyStreakDto } from "../api/userService";

const Profile = () => {
    const [bannerImage, setBannerImage] = useState<string | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [user, setUser] = useState<UserPrincipal | null>(null);
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [description, setDescription] = useState<string>('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [loadingBanner, setLoadingBanner] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [savingDescription, setSavingDescription] = useState(false);
    
    // 스트릭 관련 상태
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([]);
    const [streak, setStreak] = useState<StreakResponse | null>(null);
    const [streakMap, setStreakMap] = useState<Map<string, DailyStreakDto>>(new Map());

    // 페이지 로드 시 사용자 정보 및 이미지 조회
    useEffect(() => {
        const fetchUserAndImages = async () => {
            try {
                const userData = await getCurrentUser();
                setUser(userData);
                
                // 프로필 정보 조회 (username, description, joinDate)
                const profileData = await getUserProfile();
                setProfile(profileData);
                setDescription(profileData.description);
                
                // 가입일부터 현재 년도까지의 년도 배열 생성
                if (profileData.joinDate) {
                    const joinYear = new Date(profileData.joinDate).getFullYear();
                    const currentYear = new Date().getFullYear();
                    const years: number[] = [];
                    for (let year = joinYear; year <= currentYear; year++) {
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
            } catch (error) {
                // 에러 처리
            }
        };
        fetchUserAndImages();
    }, []);

    // 년도 변경 시 스트릭 데이터 조회
    useEffect(() => {
        const fetchStreak = async () => {
            try {
                const streakData = await getUserStreak(selectedYear);
                setStreak(streakData);
                
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
        <div>
            <Header />
            
            {/* 배너 이미지 */}
            <div 
                className="w-full relative group"
                style={{
                    height: '400px',
                    backgroundImage: bannerImage ? `url(${bannerImage})` : `linear-gradient(135deg, #2F639D 0%, #86ABD7 100%)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                {/* 배너 변경 버튼 */}
                <label className="absolute bottom-4 right-4 cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload(e, 'BANNER')}
                        className="hidden"
                        disabled={loadingBanner}
                    />
                    <div className={`px-4 py-2 bg-black/70 hover:bg-black text-white font-semibold rounded-lg transition flex items-center gap-2 ${loadingBanner ? 'opacity-50 pointer-events-none' : ''}`}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        {loadingBanner ? '업로드 중...' : '배너 변경'}
                    </div>
                </label>
            </div>

            {/* 사용자 정보 섹션 */}
            <div className="bg-white">
                <div className="max-w-6xl mx-auto px-8 py-12 flex gap-12">
                    {/* 왼쪽: 체스 타입 버튼 5개 */}
                    <div className="flex flex-col gap-3">
                        <button className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-black text-black font-semibold rounded-lg hover:bg-gray-100 transition">
                            <img src="/src/assets/images/logo/game/classical.webp" alt="Classical" className="w-6 h-6" />
                            Classical
                        </button>
                        <button className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-black text-black font-semibold rounded-lg hover:bg-gray-100 transition">
                            <img src="/src/assets/images/logo/game/rapid.webp" alt="Rapid" className="w-6 h-6" />
                            Rapid
                        </button>
                        <button className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-black text-black font-semibold rounded-lg hover:bg-gray-100 transition">
                            <img src="/src/assets/images/logo/game/bullet.webp" alt="Bullet" className="w-6 h-6" />
                            Bullet
                        </button>
                        <button className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-black text-black font-semibold rounded-lg hover:bg-gray-100 transition">
                            <img src="/src/assets/images/logo/game/blitz.webp" alt="Blitz" className="w-6 h-6" />
                            Blitz
                        </button>
                        <button className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-black text-black font-semibold rounded-lg hover:bg-gray-100 transition">
                            <img src="/src/assets/images/logo/game/puzzle.webp" alt="Puzzle" className="w-6 h-6" />
                            Puzzle
                        </button>
                    </div>

                    {/* 오른쪽: 사용자 정보 */}
                    <div className="flex-1">
                        <div className="flex items-end gap-4 mb-8">
                            <img
                                src={profileImage || 'https://via.placeholder.com/128'}
                                alt="프로필 사진"
                                className="w-32 h-32 rounded-full border-4 border-[#2F639D] object-cover"
                            />
                            {/* 프로필 변경 버튼 */}
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={e => handleImageUpload(e, 'PROFILE')}
                                    className="hidden"
                                    disabled={loadingProfile}
                                />
                                <div className={`px-4 py-2 bg-white border-2 border-black text-black font-semibold rounded-lg transition flex items-center gap-2 ${loadingProfile ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-100'}`}>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                    </svg>
                                    {loadingProfile ? '업로드 중...' : '변경'}
                                </div>
                            </label>
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-800">{profile?.username || '-'}</h3>
                            
                            {/* 자기소개 섹션 */}
                            <div className="mt-6">
                                {isEditingDescription ? (
                                    <div className="flex flex-col gap-3">
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="자기소개를 입력하세요"
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F639D]"
                                            rows={4}
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleSaveDescription}
                                                disabled={savingDescription}
                                                className="px-4 py-2 bg-white border-2 border-black text-black font-semibold rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                                            >
                                                {savingDescription ? '저장 중...' : '저장'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingDescription(false);
                                                    setDescription(profile?.description || '');
                                                }}
                                                className="px-4 py-2 bg-white border-2 border-gray-400 text-black font-semibold rounded-lg hover:bg-gray-100 transition"
                                            >
                                                취소
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {description || '자기소개가 없습니다.'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setIsEditingDescription(true)}
                                            className="px-3 py-1 bg-white border-2 border-black text-black font-semibold rounded hover:bg-gray-100 transition text-sm"
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

            {/* 티어 섹션 */}
            <div className="bg-white border-t-2 border-gray-300">
                <div className="max-w-6xl mx-auto px-8 py-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">티어</h2>
                    <div className="flex gap-12 items-center">
                        <div>
                            <p className="text-gray-600 mb-2">현재 티어</p>
                            <p className="text-4xl font-bold text-[#2F639D]">Silver</p>
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-600 mb-2">다음 티어까지 남은 레이팅</p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div className="bg-[#2F639D] h-3 rounded-full" style={{ width: '65%' }}></div>
                                </div>
                                <span className="text-gray-700 font-semibold">1650 / 2000</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 기본 정보 섹션 */}
            <div className="bg-white border-t-2 border-gray-300">
                <div className="max-w-6xl mx-auto px-8 py-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">기본 정보</h2>
                    <div className="grid grid-cols-4 gap-6">
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <p className="text-gray-600 text-sm mb-2">총 게임 수</p>
                            <p className="text-3xl font-bold text-gray-800">245</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <p className="text-gray-600 text-sm mb-2">승률</p>
                            <p className="text-3xl font-bold text-gray-800">52.2%</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <p className="text-gray-600 text-sm mb-2">평균 레이팅</p>
                            <p className="text-3xl font-bold text-gray-800">1450</p>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <p className="text-gray-600 text-sm mb-2">플레이 시간</p>
                            <p className="text-3xl font-bold text-gray-800">48h</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 통계 정보 섹션 */}
            <div className="bg-white border-t-2 border-gray-300">
                <div className="max-w-6xl mx-auto px-8 py-12">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">통계 정보</h2>
                    <div className="grid grid-cols-2 gap-12">
                        <div>
                            <p className="text-gray-700 font-semibold mb-4">흑/백 승률</p>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-600">흑 (Black)</span>
                                        <span className="text-gray-800 font-semibold">55%</span>
                                    </div>
                                    <div className="bg-gray-200 rounded-full h-2">
                                        <div className="bg-gray-900 h-2 rounded-full" style={{ width: '55%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-600">백 (White)</span>
                                        <span className="text-gray-800 font-semibold">50%</span>
                                    </div>
                                    <div className="bg-gray-200 rounded-full h-2">
                                        <div className="bg-gray-400 h-2 rounded-full" style={{ width: '50%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-gray-700 font-semibold mb-4">첫 무브 통계</p>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-600">e4</span>
                                        <span className="text-gray-800 font-semibold">32%</span>
                                    </div>
                                    <div className="bg-gray-200 rounded-full h-2">
                                        <div className="bg-[#2F639D] h-2 rounded-full" style={{ width: '32%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-600">d4</span>
                                        <span className="text-gray-800 font-semibold">28%</span>
                                    </div>
                                    <div className="bg-gray-200 rounded-full h-2">
                                        <div className="bg-[#2F639D] h-2 rounded-full" style={{ width: '28%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-gray-600">기타</span>
                                        <span className="text-gray-800 font-semibold">40%</span>
                                    </div>
                                    <div className="bg-gray-200 rounded-full h-2">
                                        <div className="bg-[#2F639D] h-2 rounded-full" style={{ width: '40%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 스트릭 정보 섹션 */}
            <div className="bg-white border-t-2 border-gray-300">
                <div className="max-w-6xl mx-auto px-8 py-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-semibold text-gray-800">스트릭 정보</h2>
                        {/* 년도 선택 콤보박스 */}
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F639D]"
                        >
                            {availableYears.map((year) => (
                                <option key={year} value={year}>
                                    {year}년
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="bg-gray-50 p-8 rounded-lg">
                        <p className="text-gray-600 mb-4 text-sm font-semibold">{selectedYear}년 게임 활동</p>
                        <div className="pb-4">
                            {/* 월 레이블 */}
                            <div className="flex gap-0 mb-2 text-xs text-gray-500 font-semibold w-full">
                                {['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'].map((month, idx) => (
                                    <div key={month} className="flex-1 text-left">
                                        {month}
                                    </div>
                                ))}
                            </div>
                            <div className="flex w-full" style={{ gap: '1.2px' }}>
                                {/* 월별 주차 렌더링 */}
                                {(() => {
                                    const weeks: JSX.Element[] = [];
                                    const year = selectedYear;
                                    const firstDay = new Date(year, 0, 1);
                                    const lastDay = new Date(year, 11, 31);
                                    
                                    let currentDate = new Date(firstDay);
                                    
                                    let weekCount = 0;
                                    while (currentDate <= lastDay) {
                                        weeks.push(
                                            <div key={weekCount} className="flex flex-col flex-1" style={{ gap: '1.2px' }}>
                                                {Array.from({ length: 7 }).map((_, day) => {
                                                    const date = new Date(currentDate);
                                                    date.setDate(date.getDate() + day);
                                                    
                                                    const dateStr = date.toISOString().split('T')[0];
                                                    
                                                    // 현재 년도 범위 내에서만 표시
                                                    if (date < firstDay || date > lastDay) {
                                                        return <div key={dateStr} className="w-3.5 h-3.5"></div>;
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
                                                        'bg-gray-200', // 0: 활동 없음
                                                        'bg-green-200', // 1: 적음
                                                        'bg-green-400', // 2: 보통
                                                        'bg-green-600', // 3: 많음
                                                        'bg-green-800'  // 4: 매우 많음
                                                    ];
                                                    
                                                    return (
                                                        <div
                                                            key={dateStr}
                                                            className={`w-4.5 h-4.5 rounded border border-gray-400 cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 hover:ring-[#2F639D] hover:shadow-md ${colors[activity]}`}
                                                            title={`${dateStr}\n승리: ${dailyData?.win || 0} | 패배: ${dailyData?.lose || 0} | 무승부: ${dailyData?.draw || 0}\n총 경기: ${dailyData?.total || 0}`}
                                                        ></div>
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
                        <div className="flex gap-6 mt-6 text-xs text-gray-600 mb-8">
                            <span>덜함</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-sm bg-gray-200 border border-gray-300"></div>
                                <div className="w-3 h-3 rounded-sm bg-green-200 border border-gray-300"></div>
                                <div className="w-3 h-3 rounded-sm bg-green-400 border border-gray-300"></div>
                                <div className="w-3 h-3 rounded-sm bg-green-600 border border-gray-300"></div>
                                <div className="w-3 h-3 rounded-sm bg-green-800 border border-gray-300"></div>
                            </div>
                            <span>많음</span>
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
                            sortedDates.forEach((date, idx) => {
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
                                <div className="border-t pt-6 mt-6">
                                    <p className="text-gray-700 font-semibold mb-4">결산</p>
                                    <div className="grid grid-cols-6 gap-4">
                                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                                            <p className="text-gray-600 text-sm mb-1">총 게임</p>
                                            <p className="text-2xl font-bold text-gray-800">{totalGames}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                                            <p className="text-gray-600 text-sm mb-1">승리</p>
                                            <p className="text-2xl font-bold text-green-600">{totalWins}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                                            <p className="text-gray-600 text-sm mb-1">패배</p>
                                            <p className="text-2xl font-bold text-red-600">{totalLosses}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                                            <p className="text-gray-600 text-sm mb-1">무승부</p>
                                            <p className="text-2xl font-bold text-gray-600">{totalDraws}</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                                            <p className="text-gray-600 text-sm mb-1">승률</p>
                                            <p className="text-2xl font-bold text-[#2F639D]">{winRate}%</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                                            <p className="text-gray-600 text-sm mb-1">연속 플레이</p>
                                            <p className="text-2xl font-bold text-orange-600">{maxConsecutiveDays}일</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <Footer/>
        </div>
    );
}   

export default Profile;