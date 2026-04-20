import { useState } from 'react';
import type { FirstMoveResponse } from '../api/userService';
import { useLanguage } from '../context/LanguageContext';

interface FirstMoveChartProps {
  data: FirstMoveResponse | null;
  isLoading?: boolean;
}

const WHITE_BAR = 'rgba(147,197,253,0.80)';  // sky-300
const BLACK_BAR = 'rgba(251,146,60,0.75)';   // orange-400

const FirstMoveStatsChart = ({ data, isLoading = false }: FirstMoveChartProps) => {
  const { language } = useLanguage();
  const [side, setSide] = useState<'white' | 'black'>('white');

  if (isLoading) {
    return (
      <div className="bg-[#070d1a] border border-white/8 rounded-2xl p-8 animate-pulse">
        <div className="h-6 bg-white/10 rounded-lg mb-6 w-48" />
        <div className="min-h-[420px] bg-white/5 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#070d1a] border border-white/8 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[420px] gap-4">
        <div className="text-6xl select-none" style={{ opacity: 0.2 }}>♞</div>
        <p className="text-white/30 text-sm font-medium">
          {language === 'KR' ? '첫 수 통계 없음' : 'No first-move data'}
        </p>
        <p className="text-white/15 text-xs">
          {language === 'KR' ? '이 타임 컨트롤로 플레이된 게임이 없습니다' : 'No games played with this time control'}
        </p>
      </div>
    );
  }

  const isWhite = side === 'white';
  const movesRaw = isWhite ? data.white_moves : data.black_moves;
  const moves = Object.entries(movesRaw || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const total  = moves.reduce((acc, m) => acc + m.value, 0);
  const maxVal = moves[0]?.value || 1;
  const barColor = isWhite ? WHITE_BAR : BLACK_BAR;
  const accentClass = isWhite ? 'text-sky-300' : 'text-orange-400';

  return (
    <div className="bg-[#070d1a] border border-white/8 rounded-2xl p-8 min-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            {language === 'KR' ? '첫 수 통계' : 'First Move Statistics'}
          </h3>
          <p className="text-xs text-white/40 uppercase tracking-widest">
            {language === 'KR' ? '오프닝 수 분포' : 'Opening Move Distribution'}
          </p>
        </div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-full border border-white/10">
          <button
            onClick={() => setSide('white')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              side === 'white' ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {language === 'KR' ? '백' : 'White'}
          </button>
          <button
            onClick={() => setSide('black')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              side === 'black' ? 'bg-white/10 text-white/80 border border-white/15' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {language === 'KR' ? '흑' : 'Black'}
          </button>
        </div>
      </div>

      {/* Sub-header */}
      <div className="flex items-baseline gap-2 mb-6">
        <span className={`text-3xl font-black ${accentClass} tabular-nums`}>{total}</span>
        <span className="text-sm text-white/40">{language === 'KR' ? '경기' : 'games'}</span>
      </div>

      {/* Bar chart */}
      {moves.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="text-5xl select-none" style={{ opacity: 0.2 }}>♞</div>
          <p className="text-white/25 text-sm">{language === 'KR' ? '데이터 없음' : 'No data'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {moves.map((move, idx) => {
            const pct = total > 0 ? (move.value / total) * 100 : 0;
            const barWidth = (move.value / maxVal) * 100;
            return (
              <div key={move.name} className="flex items-center gap-3">
                <span className="text-[11px] text-white/25 w-4 text-right shrink-0 tabular-nums">{idx + 1}</span>
                <span className="text-sm font-mono font-semibold text-white w-12 shrink-0">{move.name}</span>
                <div className="flex-1 h-5 rounded-md overflow-hidden bg-white/[0.04] relative">
                  <div
                    className="h-full rounded-md transition-all duration-500"
                    style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                  />
                  <span
                    className="absolute inset-0 flex items-center pl-2 text-[11px] font-semibold text-white/70"
                    style={{ mixBlendMode: 'normal' }}
                  >
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <span className="text-sm font-bold text-white/70 w-10 text-right shrink-0 tabular-nums">{move.value}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FirstMoveStatsChart;
