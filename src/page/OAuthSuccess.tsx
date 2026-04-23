import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleOAuthSuccess } from '../api/authService';

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    // StrictMode 이중 실행 및 브라우저 재시도 방지
    if (hasRun.current) return;
    hasRun.current = true;

    const handleSuccess = async () => {
      try {
        const result = await handleOAuthSuccess();

        if (!result.success) {
          throw new Error('사용자 정보 조회 실패');
        }

        setIsLoading(false);

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
