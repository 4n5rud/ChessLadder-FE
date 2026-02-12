import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../api/authService';

/**
 * OAuth 로그인 성공 페이지
 * 백엔드 redirect → /oauth/success
 * 
 * 프로세스:
 * 1. getCurrentUser() 호출로 로그인 상태 확인 (GET /api/auth/me)
 * 2. 백엔드에서 HttpOnly 쿠키 기반으로 사용자 정보 반환
 * 3. 홈으로 리다이렉트 (UI 없이 즉시)
 */
export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // 현재 인증된 사용자 정보 조회
        const userData = await getCurrentUser();
        
        if (!userData) {
          throw new Error('사용자 정보를 가져올 수 없습니다.');
        }
        
        console.log('로그인 성공:', userData);
        
        //즉시 홈으로 이동
        navigate('/', { replace: true });
      } catch (error) {
        console.error('로그인 확인 실패:', error);
        
        // 즉시 실패 페이지로 이동
        navigate('/oauth/fail', { replace: true });
      }
    };

    checkAndRedirect();
  }, [navigate]);

  return null;
}
