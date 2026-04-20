import type { ProfileResponse, UserPerfResponse } from '../api/userService';
import { useLanguage } from '../context/LanguageContext';

interface GameStatsDisplayProps {
  profile: ProfileResponse | null;
  userPerf: UserPerfResponse | null;
  summaryLoaded: boolean;
}

const GameStatsDisplay = ({ profile, userPerf: _userPerf, summaryLoaded }: GameStatsDisplayProps) => {
  const { language } = useLanguage();

  if (!profile) return null;

  // 통계 계산
  const totalGames = profile.allGames ?? 0;
  const wins = profile.wins ?? 0;
  const losses = profile.losses ?? 0;
  const draws = profile.draws ?? 0;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(1) : '0.0';

  // 승률에 따른 색상 결정
  const getProgressColor = (): string => {
    const rate = parseFloat(winRate);
    if (rate >= 51) return '#22c55e'; // 초록
    if (rate >= 31) return '#eab308'; // 노랑
    return '#ef4444'; // 빨강
  };

  const circumference = 2 * Math.PI * 45; // 반지름 45
  const strokeDashoffset = circumference - (parseFloat(winRate) / 100) * circumference;

  return (
    <div className="mt-8 pt-8 border-t border-white/10">
      {/* 원형 진행 바 + 통계 카드 섹션 */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        {/* 왼쪽: 원형 진행 바 */}
        <div className="flex-shrink-0 w-full md:w-auto flex justify-center">
          <div className="relative w-64 h-64">
            <svg className="w-full h-full" viewBox="0 0 120 120">
              {/* 배경 원 */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="8"
              />
              {/* 진행 원 */}
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke={getProgressColor()}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '60px 60px',
                }}
              />
            </svg>

            {/* 중앙 콘텐츠 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-5xl font-black text-white">{summaryLoaded ? winRate : '?'}</p>
              <p className="text-sm text-white/60 mt-1 font-medium">
                {language === 'KR' ? '승률' : 'Win Rate'}
              </p>
            </div>
          </div>
        </div>

        {/* 오른쪽: 통계 카드 4개 */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-2 gap-4">
            {/* 총 게임 */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-white/20 transition">
              <p className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">
                {language === 'KR' ? '총 경기' : 'Total Games'}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-white">{summaryLoaded ? totalGames : '?'}</p>
                <p className="text-xs text-white/40">{language === 'KR' ? '경기' : 'games'}</p>
              </div>
            </div>

            {/* 승수 */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-green-500/30 transition">
              <p className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">
                {language === 'KR' ? '승리' : 'Wins'}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-green-500">{summaryLoaded ? wins : '?'}</p>
                <p className="text-xs text-white/40">{((wins / totalGames) * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* 패수 */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-red-500/30 transition">
              <p className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">
                {language === 'KR' ? '패배' : 'Losses'}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-red-500">{summaryLoaded ? losses : '?'}</p>
                <p className="text-xs text-white/40">{((losses / totalGames) * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* 무승부 */}
            <div className="bg-white/5 rounded-lg p-6 border border-white/10 hover:border-white/20 transition">
              <p className="text-white/60 text-xs font-semibold mb-3 uppercase tracking-wide">
                {language === 'KR' ? '무승부' : 'Draws'}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black text-white/70">{summaryLoaded ? draws : '?'}</p>
                <p className="text-xs text-white/40">{((draws / totalGames) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameStatsDisplay;
