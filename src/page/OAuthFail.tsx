import { useNavigate } from 'react-router-dom';

/**
 * OAuth 로그인 실패 페이지
 * 백엔드에서 실패 시 여기로 리다이렉트됨
 */
export default function OAuthFail() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4 text-red-600">로그인 실패</h1>
        <p className="text-gray-600 mb-8">로그인 중 문제가 발생했습니다.</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-[#2F639D] text-white font-bold py-3 px-8 rounded-lg hover:bg-[#1f4170] transition"
        >
          다시 로그인
        </button>
      </div>
    </div>
  );
}
