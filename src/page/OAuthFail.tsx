import { useNavigate } from 'react-router-dom';
import Header from '../global/Header';
import Footer from '../global/Footer';

/**
 * OAuth 로그인 실패 페이지
 * 백엔드에서 실패 시 여기로 리다이렉트됨
 */
export default function OAuthFail() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#0a1f33] to-[#0a1f33] overflow-x-hidden">
      <Header />
      
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] px-4 text-center">
        <div className="max-w-2xl">
          <div className="mb-8">
            <div className="text-6xl mb-6">⚠️</div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow mb-6 tracking-tight">
            <span className="text-red-400">로그인 실패</span>
          </h1>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 mb-8">
            <p className="text-[#86ABD7] text-xl font-semibold mb-4">로그인 중 문제가 발생했습니다.</p>
            <p className="text-[#BFD7ED]/80 text-base">
              다시 시도해주시거나, 백엔드 상태를 확인해주세요.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 bg-[#2F639D] hover:bg-[#1f4170] text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105"
            >
              홈으로 돌아가기
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold py-3 px-8 rounded-full shadow-lg transition border border-white/30"
            >
              이전 페이지
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
