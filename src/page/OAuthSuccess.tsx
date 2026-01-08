import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, type UserPrincipal } from '../api/authService';

/**
 * OAuth 로그인 성공 페이지
 * 백엔드 redirect → /oauth/success
 * 
 * 프로세스:
 * 1. getCurrentUser() 호출로 로그인 상태 확인 (GET /api/auth/me)
 * 2. 백엔드에서 HttpOnly 쿠키 기반으로 사용자 정보 반환
 * 3. 사용자 정보 저장 (필요시)
 * 4. 홈으로 리다이렉트
 */
export default function OAuthSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('로그인 인증 중...');
  const [user, setUser] = useState<UserPrincipal | null>(null);

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // 현재 인증된 사용자 정보 조회
        setStatus('사용자 정보 조회 중...');
        const userData = await getCurrentUser();
        
        if (!userData) {
          throw new Error('사용자 정보를 가져올 수 없습니다.');
        }
        
        console.log('로그인 성공:', userData);
        setUser(userData);
        
        setStatus('로그인 완료! 홈으로 이동합니다...');
        
        // 2초 후 홈으로 이동
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } catch (error) {
        console.error('로그인 확인 실패:', error);
        setStatus('로그인 확인 중 오류가 발생했습니다.');
        
        // 3초 후 실패 페이지로 이동
        setTimeout(() => {
          navigate('/oauth/fail', { replace: true });
        }, 3000);
      }
    };

    checkAndRedirect();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-[#0a1f33] to-[#1a3a52]">
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#86ABD7] border-t-[#2F639D] rounded-full animate-spin"></div>
        </div>
        <h1 className="text-3xl font-bold mb-4 text-white">로그인 중...</h1>
        <p className="text-[#86ABD7] text-lg">{status}</p>
        {user && <p className="text-[#86ABD7] text-sm mt-2">사용자: {user.username}</p>}
      </div>
    </div>
  );
}
