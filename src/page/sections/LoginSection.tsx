import { useState } from 'react';
import { getOAuthUrl } from '../../api/oauthService';

/**
 * 로그인 섹션 - OAuth 로그인 버튼
 */
export function LoginSection() {
    const [isLoading, setIsLoading] = useState(false);

    const handleLichessLogin = async () => {
        try {
            setIsLoading(true);
            const res = await getOAuthUrl();
            console.log('OAuth 응답:', res);
            
            // 백엔드 응답 형식에 맞게 URL 추출
            const oauthUrl = res.oauthUrl || res.data?.oauthUrl;
            
            if (!oauthUrl) {
                console.error('응답 전체:', JSON.stringify(res, null, 2));
                throw new Error(`OAuth URL을 찾을 수 없습니다. 응답: ${JSON.stringify(res)}`);
            }
            
            console.log('리다이렉트 URL:', oauthUrl);
            window.location.href = oauthUrl;
        } catch (error) {
            console.error('OAuth URL 획득 실패:', error);
            alert('로그인 시도에 실패했습니다. 다시 시도해주세요.');
            setIsLoading(false);
        }
    };

    return (
        <button 
            onClick={handleLichessLogin}
            disabled={isLoading}
            className="mx-auto flex items-center gap-3 bg-white text-[#2F639D] font-bold py-3 px-7 rounded-full shadow-lg hover:bg-[#e6e6e6] transition text-lg fade-in-bottom-section disabled:opacity-50 disabled:cursor-not-allowed" 
            style={{animationDelay: '1.5s'}}
        >
            <img src="/src/assets/images/logo/lichess-logo.png" alt="Lichess Logo" className="w-8 h-8" />
            {isLoading ? '로그인 중...' : 'Lichess 계정으로 로그인하기'}
        </button>
    );
}
