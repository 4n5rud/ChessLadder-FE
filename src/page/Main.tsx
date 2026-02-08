
import Header from '../global/Header';
import Footer from '../global/Footer';
import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getOAuthUrl } from '../api/oauthService';
import pawnImg from '../assets/images/tier/pawn.png';
import knightImg from '../assets/images/tier/knight.png';
import bishopImg from '../assets/images/tier/vishop.png';
import rookImg from '../assets/images/tier/rook.png';
import queenImg from '../assets/images/tier/queen.png';
import kingImg from '../assets/images/tier/king.png';

interface TierData {
    name: string;
    range: string;
    icon: string;
    color: string;
    levels: { level: string; min: number; max: number | string }[];
}

function Main() {
    const [isLoading, setIsLoading] = useState(false);
    const [userCount, setUserCount] = useState<number>(0);
    const [selectedTier, setSelectedTier] = useState<string | null>('KNIGHT');

    // 티어 데이터
    const tierData: TierData[] = [
        {
            name: 'PAWN',
            range: '400~900',
            icon: pawnImg,
            color: 'from-[#C0A060] to-[#A0805F]',
            levels: [
                {level: 'V', min: 400, max: 500},
                {level: 'IV', min: 501, max: 600},
                {level: 'III', min: 601, max: 700},
                {level: 'II', min: 701, max: 800},
                {level: 'I', min: 801, max: 900},
            ]
        },
        {
            name: 'KNIGHT',
            range: '901~1200',
            icon: knightImg,
            color: 'from-[#7CA0D0] to-[#5C80B0]',
            levels: [
                {level: 'V', min: 901, max: 960},
                {level: 'IV', min: 961, max: 1020},
                {level: 'III', min: 1021, max: 1080},
                {level: 'II', min: 1081, max: 1140},
                {level: 'I', min: 1141, max: 1200},
            ]
        },
        {
            name: 'BISHOP',
            range: '1201~1500',
            icon: bishopImg,
            color: 'from-[#BFA7D2] to-[#9F87B2]',
            levels: [
                {level: 'V', min: 1201, max: 1260},
                {level: 'IV', min: 1261, max: 1320},
                {level: 'III', min: 1321, max: 1380},
                {level: 'II', min: 1381, max: 1440},
                {level: 'I', min: 1441, max: 1500},
            ]
        },
        {
            name: 'ROOK',
            range: '1501~1800',
            icon: rookImg,
            color: 'from-[#E6B7C2] to-[#C697A2]',
            levels: [
                {level: 'V', min: 1501, max: 1560},
                {level: 'IV', min: 1561, max: 1620},
                {level: 'III', min: 1621, max: 1680},
                {level: 'II', min: 1681, max: 1740},
                {level: 'I', min: 1741, max: 1800},
            ]
        },
        {
            name: 'QUEEN',
            range: '1801~2100',
            icon: queenImg,
            color: 'from-[#F5D06F] to-[#D5B04F]',
            levels: [
                {level: 'V', min: 1801, max: 1860},
                {level: 'IV', min: 1861, max: 1920},
                {level: 'III', min: 1921, max: 1980},
                {level: 'II', min: 1981, max: 2040},
                {level: 'I', min: 2041, max: 2100},
            ]
        },
        {
            name: 'KING',
            range: '2101~2700+',
            icon: kingImg,
            color: 'from-[#F7E08C] to-[#D7C06C]',
            levels: [
                {level: 'V', min: 2101, max: 2220},
                {level: 'IV', min: 2221, max: 2340},
                {level: 'III', min: 2341, max: 2460},
                {level: 'II', min: 2461, max: 2580},
                {level: 'I', min: 2581, max: '2700+'},
            ]
        },
    ];

    // 로그인 버튼 클릭 핸들러
    const handleLichessLogin = async () => {
        try {
            setIsLoading(true);
            const res = await getOAuthUrl();
            console.log('OAuth 응답:', res);
            
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

    // 사용자 수 조회
    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/user/count', {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`HTTP 오류: ${response.status}`);
                }

                const data = await response.json();
                console.log('사용자 수 API 응답:', data);
                
                const userCountValue = data.count !== undefined ? data.count : (data.data?.count || 0);
                console.log('추출된 count:', userCountValue);
                
                setUserCount(userCountValue);
            } catch (err) {
                console.error('사용자 수 조회 오류:', err);
                setUserCount(0);
            }
        };

        fetchUserCount();
    }, []);
    return(
        <div className="relative min-h-screen overflow-x-hidden">
            
            <Header/>

            <main className="flex flex-col items-center justify-center pt-60 px-4 text-center">
                <h1 className="md:text-5xl font-extrabold text-white drop-shadow mb-4 tracking-tight">
                    <span className="text-9xl text-[#2F639D] fade-in-title">ChessLadder</span>
                </h1>
                <h2 className="text-4xl md:text-2xl text-[#86ABD7] font-bold mb-10 fade-in-subtitle">
                    체스 레이팅의 새로운 기준
                </h2>

                <div className="flex flex-row items-end justify-center gap-6 mb-10">
                    {[
                        {src: pawnImg, label: 'Pawn'},
                        {src: knightImg, label: 'Knight'},
                        {src: bishopImg, label: 'Bishop'},
                        {src: rookImg, label: 'Rook'},
                        {src: queenImg, label: 'Queen'},
                        {src: kingImg, label: 'King'},
                    ].map(({src, label}, index) => (
                        <div key={label} className="flex flex-col items-center group tier-item" style={{animationDelay: `${1 + index * 0.1}s`}}>
                            <div className="bg-white/80 rounded-xl shadow-lg aspect-square w-20 h-20 md:w-22 md:h-22 flex items-center justify-center transition-transform group-hover:-translate-y-2 group-hover:scale-105 border-2 border-[#86ABD7]">
                                <img
                                    src={src}
                                    alt={label}
                                    className="w-16 h-16 md:w-16 md:h-16 object-contain"
                                />
                            </div>
                            <span className="mt-2 text-xs md:text-sm text-[#BFD7ED] font-semibold tracking-wide group-hover:text-[#86ABD7] transition">{label}</span>
                        </div>
                    ))}
                </div>

                {/* 로그인 버튼 */}
                <button 
                    onClick={handleLichessLogin}
                    disabled={isLoading}
                    className="mx-auto flex items-center gap-3 bg-white text-black font-bold py-3 px-7 rounded-full shadow-lg hover:bg-[#e6e6e6] transition text-lg fade-in-bottom-section disabled:opacity-50 disabled:cursor-not-allowed" 
                    style={{animationDelay: '1.5s'}}
                >
                    <img src="/src/assets/images/logo/lichess-logo.png" alt="Lichess Logo" className="w-8 h-8" />
                    {isLoading ? '로그인 중...' : 'Lichess 계정으로 로그인하기'}
                </button>

                <div className="fade-in-bottom-section" style={{animationDelay: '1.5s'}}>
                    <p className="mt-6 text-sm text-black/80">Chess Mate는 Lichess API를 사용하여 체스 데이터를 안전하게 처리합니다.</p>
                </div>

                {/* 사용자 수 & 업데이트 뉴스 */}
                <div className="pt-20 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl mx-auto fade-in-bottom-section" style={{animationDelay: '1.5s'}}>
                    {/* 사용자 수 */}
                    <div className="bg-white/80 rounded-xl shadow p-3">
                        <div className="text-center">
                            <h2 className="text-xl font-bold mt-5">최근 등록된 유저 <span className="text-[#2F639D]">{userCount}+명</span></h2>
                        </div>
                    </div>
                    
                    {/* 업데이트 뉴스 */}
                    <div className="bg-white/80 rounded-xl shadow p-3">
                        <div className="text-center">
                            <h2 className="text-xl font-bold mb-2">최근 소식 <span className="text-[#2F639D]"></span></h2>
                            <a href="#" className="inline-block mt-2 text-[#2F639D] font-semibold hover:underline text-sm">확인하러 가기 →</a>
                        </div>
                    </div>
                </div>
            </main>

            <Outlet />
            
            {/* 티어 시스템 섹션 */}
            <div className="w-full" style={{background: 'linear-gradient(to bottom, transparent 0%, #0a1f33 10%, #0a1f33 100%)'}}>
                <div className="flex flex-col pt-100 pb-20 px-4 max-w-6xl mx-auto text-white">
                    <h2 className="text-4xl font-bold mb-4">ChessLadder 티어 시스템</h2>
                    <p className="text-lg mb-8 text-white/90 font-semibold">ChessLadder는 기존의 지루한 레이팅 시스템에서 벗어난 6가지의 티어 시스템 을 제공해요</p>
                    
                    {/* Tier icons - Button Style */}
                    <div className="flex flex-row justify-between gap-4 mb-12 w-full flex-wrap">
                        {tierData.map(tier => (
                            <div 
                                key={tier.name} 
                                className="flex flex-col items-center cursor-pointer group flex-1 min-w-[100px]"
                                onClick={() => setSelectedTier(selectedTier === tier.name ? null : tier.name)}
                            >
                                <div className={`aspect-square w-full max-w-24 rounded-xl shadow-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105 border-2 ${selectedTier === tier.name ? 'border-white ring-2 ring-white' : 'border-white/30'}`} style={{background: `linear-gradient(135deg, ${tier.color.split(' ').slice(1).join(' ')})`}}>
                                    <img src={tier.icon} alt={tier.name} className="w-12 h-16" />
                                </div>
                                <span className="text-sm font-semibold group-hover:text-yellow-300 text-center">{tier.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Selected Tier Details */}
                    {selectedTier && (
                        <div className={`rounded-lg p-8 backdrop-blur-sm ${
                            selectedTier === 'PAWN' ? 'bg-[#A7F3D0]/20' :
                            selectedTier === 'KNIGHT' ? 'bg-[#93C5FD]/20' :
                            selectedTier === 'BISHOP' ? 'bg-[#C4B5FD]/20' :
                            selectedTier === 'ROOK' ? 'bg-[#FBCFE8]/20' :
                            selectedTier === 'QUEEN' ? 'bg-[#FED7AA]/20' :
                            selectedTier === 'KING' ? 'bg-[#FDE68A]/20' :
                            'bg-white/10'
                        }`}>
                            {tierData.find(t => t.name === selectedTier) && (
                                <>
                                    <div className="flex items-center gap-4 mb-6">
                                        <img src={tierData.find(t => t.name === selectedTier)?.icon} alt={selectedTier} className="w-12 h-16" />
                                        <div>
                                            <h3 className="text-3xl font-bold">{selectedTier}</h3>
                                            <p className="text-lg text-white/80">{tierData.find(t => t.name === selectedTier)?.range}</p>
                                        </div>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/30">
                                                <th className="pb-2 font-semibold">단계</th>
                                                <th className="pb-2 font-semibold">레이팅 범위</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tierData.find(t => t.name === selectedTier)?.levels.map(lv => (
                                                <tr key={lv.level} className="border-b border-white/10 hover:bg-white/5">
                                                    <td className="py-2 font-semibold">{lv.level}</td>
                                                    <td className="py-2">{lv.min} ~ {lv.max}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* 플레이 스타일 분석 섹션 */}
            <div className="w-full bg-[#0a1f33]">
                <div className="flex flex-col pt-20 pb-20 px-4 max-w-6xl mx-auto text-white">
                    <h2 className="text-4xl font-bold mb-8">사용자의 플레이 스타일 분석</h2>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 flex justify-center px">
                            <div className="bg-white/10 rounded-lg p-8 backdrop-blur-sm w-full h-64 flex items-center justify-center">
                            </div>
                        </div>
                        
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-4">당신의 체스 실력을 분석하세요</h3>
                            <p className="text-lg text-white/90 mb-6">
                                설명 내용이 들어갈 영역입니다.
                            </p>
                        </div>
                    </div>      
                </div>
            </div>

            {/* 커뮤니티 섹션 - Discord */}
            <div className="w-full bg-[#0a1f33]">
                <div className="flex flex-col pt-5 pb-20 px-4 max-w-6xl mx-auto text-white">
                    <h2 className="text-4xl font-bold mb-4">디스코드 링크</h2>
                    <a 
                        href="https://discord.gg/9NeVdmYewQ" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105 w-fit"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.975 14.975 0 0 0 1.293-2.1a.07.07 0 0 0-.038-.098a13.11 13.11 0 0 1-1.872-.892a.072.072 0 0 1-.007-.12a10.15 10.15 0 0 0 .372-.294a.074.074 0 0 1 .076-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .076.01c.12.098.246.198.373.294a.072.072 0 0 1-.006.12a12.98 12.98 0 0 1-1.873.892a.07.07 0 0 0-.037.099a14.992 14.992 0 0 0 1.293 2.1a.074.074 0 0 0 .084.028a19.963 19.963 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.057c.5-4.569-.838-8.54-3.549-12.267a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156c0-1.193.966-2.157 2.157-2.157c1.193 0 2.157.964 2.157 2.157c0 1.19-.964 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156c0-1.193.966-2.157 2.157-2.157c1.193 0 2.157.964 2.157 2.157c0 1.19-.964 2.156-2.157 2.156z"/>
                        </svg>
                        Discord 참여하기
                    </a>
                </div>
            </div>

            {/* 기부 섹션 */}
            <div className="w-full bg-[#0a1f33]">
                <div className="flex flex-col pt-5 pb-20 px-4 max-w-6xl mx-auto text-white">
                    <h2 className="text-4xl font-bold mb-4">개발자에게 커피 한잔 사주기</h2>
                    <a 
                        href="https://www.buymeacoffee.com/chessmate" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-[#86ABD7] hover:bg-[#6a99c4] text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105 w-fit"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                        </svg>
                        Buy Me a Coffee
                    </a>
                </div>
            </div>
            
            <Footer/>
        </div>
    )
}

export default Main;