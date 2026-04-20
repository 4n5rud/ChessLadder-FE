import { useState } from 'react';
import type { ColorStatsResponse } from '../api/userService';
import { useLanguage } from '../context/LanguageContext';

interface ColorStatsChartProps {
  data: ColorStatsResponse | null;
  isLoading?: boolean;
}

interface SideData {
  wins: number;
  losses: number;
  draws: number;
}

function DonutChart({ wins, losses, draws }: SideData) {
  const total = wins + losses + draws;
  const winPct  = total > 0 ? (wins  / total) * 100 : 0;
  const drawPct = total > 0 ? (draws / total) * 100 : 0;
  const lossPct = total > 0 ? (losses / total) * 100 : 0;

  const isEmpty = total === 0;

  const gradient = isEmpty
    ? 'conic-gradient(rgba(255,255,255,0.06) 0% 100%)'
    : `conic-gradient(
        rgba(74,222,128,0.82) 0% ${winPct}%,
        rgba(250,204,21,0.65) ${winPct}% ${winPct + drawPct}%,
        rgba(248,113,113,0.72) ${winPct + drawPct}% 100%
      )`;

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="w-40 h-40 rounded-full"
        style={{ background: gradient }}
      />
      <div
        className="absolute w-28 h-28 rounded-full flex flex-col items-center justify-center"
        style={{ background: '#070d1a' }}
      >
        {isEmpty ? (
          <span className="text-white/20 text-sm">—</span>
        ) : (
          <>
            <span className="text-2xl font-black text-white leading-none">
              {winPct.toFixed(0)}<span className="text-sm font-normal text-white/40">%</span>
            </span>
            <span className="text-[10px] text-white/30 mt-0.5">Win Rate</span>
          </>
        )}
      </div>
    </div>
  );
}

const ColorStatsChart = ({ data, isLoading = false }: ColorStatsChartProps) => {
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
        <div className="flex gap-3 text-5xl select-none">
          <span style={{ opacity: 0.55 }}>♙</span>
          <span style={{ opacity: 0.18 }}>♟</span>
        </div>
        <p className="text-white/30 text-sm font-medium">
          {language === 'KR' ? '색깔별 통계 없음' : 'No color stats'}
        </p>
        <p className="text-white/15 text-xs">
          {language === 'KR' ? '이 타임 컨트롤로 플레이된 게임이 없습니다' : 'No games played with this time control'}
        </p>
      </div>
    );
  }

  const isWhite = side === 'white';
  const wins   = isWhite ? data.white_wins   : data.black_wins;
  const losses = isWhite ? data.white_losses : data.black_losses;
  const draws  = isWhite ? data.white_draws  : data.black_draws;
  const total  = wins + losses + draws;

  const rows = [
    { label: language === 'KR' ? '승리' : 'Wins',    value: wins,   color: 'bg-emerald-400/70',  dot: 'rgba(74,222,128,0.82)'  },
    { label: language === 'KR' ? '무승부' : 'Draws',  value: draws,  color: 'bg-amber-400/60',    dot: 'rgba(250,204,21,0.65)'  },
    { label: language === 'KR' ? '패배' : 'Losses',   value: losses, color: 'bg-rose-400/65',     dot: 'rgba(248,113,113,0.72)' },
  ];

  return (
    <div className="bg-[#070d1a] border border-white/8 rounded-2xl p-8 min-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            {language === 'KR' ? '색깔별 통계' : 'Color Statistics'}
          </h3>
          <p className="text-xs text-white/40 uppercase tracking-widest">
            {language === 'KR' ? '흑/백 기준 승패 분포' : 'Win/Loss by Color'}
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

      {/* Content */}
      <div className="flex flex-col sm:flex-row items-center gap-8">
        {/* Donut */}
        <DonutChart wins={wins} losses={losses} draws={draws} />

        {/* Stats */}
        <div className="flex-1 w-full space-y-4">
          <p className="text-xs text-white/30 mb-1">
            {language === 'KR' ? `총 ${total}게임` : `${total} games`}
          </p>
          {rows.map((row) => {
            const pct = total > 0 ? ((row.value / total) * 100) : 0;
            return (
              <div key={row.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: row.dot }} />
                <span className="text-xs text-white/50 w-14 flex-shrink-0">{row.label}</span>
                <div className="flex-1 h-2 rounded-full bg-white/6 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${row.color}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-white/80 w-8 text-right">{row.value}</span>
                <span className="text-xs text-white/30 w-10 text-right">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ColorStatsChart;
