import Header from "../global/Header";
import Footer from "../global/Footer";
import { useState, useEffect } from "react";
import type { UserPrincipal } from "../api/authService";
import { getCurrentUser } from "../api/authService";
import { getUploadUrl, completeUpload, getImageUrl } from "../api/imageService";
import type { UserImageType } from "../api/imageService";

const Profile = () => {
    const [bannerImage, setBannerImage] = useState<string | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [user, setUser] = useState<UserPrincipal | null>(null);
    const [loadingBanner, setLoadingBanner] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);

    // 페이지 로드 시 사용자 정보 및 이미지 조회
    useEffect(() => {
        const fetchUserAndImages = async () => {
            try {
                const userData = await getCurrentUser();
                setUser(userData);
                
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

    return (
        <div>
            <Header />
            
            {/* 배너 이미지 */}
            <div 
                className="w-full h-80 relative group"
                style={{
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
                    <div className={`px-4 py-2 bg-white/90 hover:bg-white text-[#2F639D] font-semibold rounded-lg transition flex items-center gap-2 ${loadingBanner ? 'opacity-50 pointer-events-none' : ''}`}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                        </svg>
                        {loadingBanner ? '업로드 중...' : '배너 변경'}
                    </div>
                </label>
                
                {/* 프로필 사진 변경 버튼 */}
                <label className="absolute bottom-4 left-4 cursor-pointer">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleImageUpload(e, 'PROFILE')}
                        className="hidden"
                        disabled={loadingProfile}
                    />
                    <div className={`px-4 py-2 bg-white/90 hover:bg-white text-[#2F639D] font-semibold rounded-lg transition flex items-center gap-2 ${loadingProfile ? 'opacity-50 pointer-events-none' : ''}`}>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2a5 5 0 0 1 5 5v1a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5zm0 14c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z"/>
                        </svg>
                        {loadingProfile ? '업로드 중...' : '프로필 변경'}
                    </div>
                </label>
            </div>

            {/* 사용자 정보 섹션 */}
            <div className="bg-white">
                <div className="max-w-6xl mx-auto px-8 py-12 flex gap-12">
                    {/* 왼쪽: 체스 타입 버튼 4개 */}
                    <div className="flex flex-col gap-3">
                        <button className="px-6 py-3 bg-[#2F639D] text-white font-semibold rounded-lg hover:bg-[#1e3d5e] transition">
                            Classical
                        </button>
                        <button className="px-6 py-3 bg-[#2F639D] text-white font-semibold rounded-lg hover:bg-[#1e3d5e] transition">
                            Rapid
                        </button>
                        <button className="px-6 py-3 bg-[#2F639D] text-white font-semibold rounded-lg hover:bg-[#1e3d5e] transition">
                            Bullet
                        </button>
                        <button className="px-6 py-3 bg-[#2F639D] text-white font-semibold rounded-lg hover:bg-[#1e3d5e] transition">
                            Blitz
                        </button>
                    </div>

                    {/* 오른쪽: 사용자 정보 */}
                    <div className="flex-1">
                        <img
                            src={profileImage || 'https://via.placeholder.com/128'}
                            alt="프로필 사진"
                            className="w-32 h-32 rounded-full border-4 border-[#2F639D] mb-6 object-cover"
                        />
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-800">{user?.username || '-'}</h3>
                            <p className="text-gray-600">{user?.email || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer/>
        </div>
    );
}   

export default Profile;