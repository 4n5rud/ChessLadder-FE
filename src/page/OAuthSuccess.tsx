import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuthSuccess } from '../api/authService';

/**
 * OAuth 로그인 성공 페이지
 * 명세서 Step 5: 토큰 저장 및 관리
 * 
 * 프로세스:
 * 1. handleOAuthSuccess() 호출
 * 2. GET /api/auth/me로 현재 사용자 정보 조회
 * 3. 상태 관리와 localStorage에 사용자 정보 저장
 * 4. 홈으로 리다이렉트
 */
export default function OAuthSuccess() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // Step 5: handleOAuthSuccess() 호출
        const result = await handleOAuthSuccess();
        
        if (!result.success) {
          throw new Error('사용자 정보 조회 실패');
        }
        
        setIsLoading(false);
        
        // 짧은 딜레이 후 홈으로 리다이렉트
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);
      } catch (err: any) {
        setError(err.message || '로그인 처리 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    handleSuccess();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">로그인 처리 중...</h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-red-600">오류</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/', { replace: true })}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return null;
}
