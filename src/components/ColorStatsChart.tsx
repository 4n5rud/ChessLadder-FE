import { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ColorStatsResponse } from '../api/userService';
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ColorStatsChartProps {
  data: ColorStatsResponse;
  isLoading?: boolean;
}

const ColorStatsChart = ({ data, isLoading = false }: ColorStatsChartProps) => {
  const { language } = useLanguage();
  const [selectedColor, setSelectedColor] = useState<'white' | 'black'>('white');

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[#0d1626] to-[#070d1a] border border-white/10 rounded-2xl p-8 animate-pulse">
        <div className="h-6 bg-white/10 rounded-lg mb-6"></div>
        <div className="h-96 bg-white/10 rounded-xl"></div>
      </div>
    );
  }

  const currentData = selectedColor === 'white'
    ? {
        wins: data.white_wins,
        losses: data.white_losses,
        draws: data.white_draws,
        total: data.white_wins + data.white_losses + data.white_draws,
      }
    : {
        wins: data.black_wins,
        losses: data.black_losses,
        draws: data.black_draws,
        total: data.black_wins + data.black_losses + data.black_draws,
      };

  const winRate = currentData.total > 0 ? ((currentData.wins / currentData.total) * 100).toFixed(1) : '0.0';

  const chartData = {
    labels: [
      language === 'KR' ? '승리' : 'Wins',
      language === 'KR' ? '패배' : 'Losses',
      language === 'KR' ? '무승부' : 'Draws',
    ],
    datasets: [
      {
        data: [currentData.wins, currentData.losses, currentData.draws],
        backgroundColor: ['#10b981', '#ef4444', '#8b5cf6'],
        borderColor: 'transparent',
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(13, 22, 38, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff30',
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 13, weight: 'bold' as const },
        bodyFont: { size: 12 },
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} (${percentage}%)`;
          }
        }
      },
    },
  };

  return (
    <div className="rounded-2xl p-8 bg-gradient-to-br from-[#0d1626]/80 to-[#070d1a]/50 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {language === 'KR' ? '색깔별 통계' : 'Color Statistics'}
          </h3>
          <p className="text-xs text-white/40 font-medium uppercase tracking-wide">
            {language === 'KR' ? '흰색과 검정색 성과 비교' : 'Compare White & Black Performance'}
          </p>
        </div>

        {/* Color Toggle */}
        <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/10">
          <button
            onClick={() => setSelectedColor('white')}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
              selectedColor === 'white'
                ? 'bg-white text-gray-900 shadow-lg shadow-white/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {language === 'KR' ? '백' : 'White'}
          </button>
          <button
            onClick={() => setSelectedColor('black')}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-200 ${
              selectedColor === 'black'
                ? 'bg-gray-800 text-white shadow-lg shadow-gray-600/20 border border-white/20'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {language === 'KR' ? '흑' : 'Black'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Total Games */}
        <div className="rounded-xl p-4 bg-white/5 border border-white/10 text-center">
          <p className="text-2xl font-bold text-white mb-1">{currentData.total}</p>
          <p className="text-xs text-white/50 font-medium uppercase tracking-wide">
            {language === 'KR' ? '총 경기' : 'Total'}
          </p>
        </div>

        {/* Wins */}
        <div className="rounded-xl p-4 bg-green-500/10 border border-green-500/30 text-center">
          <p className="text-2xl font-bold text-green-400 mb-1">{currentData.wins}</p>
          <p className="text-xs text-green-400/70 font-medium uppercase tracking-wide">
            {language === 'KR' ? '승리' : 'Wins'}
          </p>
        </div>

        {/* Losses */}
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30 text-center">
          <p className="text-2xl font-bold text-red-400 mb-1">{currentData.losses}</p>
          <p className="text-xs text-red-400/70 font-medium uppercase tracking-wide">
            {language === 'KR' ? '패배' : 'Losses'}
          </p>
        </div>

        {/* Win Rate */}
        <div className="rounded-xl p-4 bg-purple-500/10 border border-purple-500/30 text-center">
          <p className="text-2xl font-bold text-purple-400 mb-1">{winRate}%</p>
          <p className="text-xs text-purple-400/70 font-medium uppercase tracking-wide">
            {language === 'KR' ? '승률' : 'Win Rate'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-center justify-center mb-8">
        <div className="relative w-full max-w-xs h-80">
          <Doughnut data={chartData} options={options} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-white/70">{language === 'KR' ? '승리' : 'Wins'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-white/70">{language === 'KR' ? '패배' : 'Losses'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm text-white/70">{language === 'KR' ? '무승부' : 'Draws'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorStatsChart;
