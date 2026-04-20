import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { FirstMoveResponse } from '../api/userService';
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface FirstMoveChartProps {
  data: FirstMoveResponse;
  isLoading?: boolean;
}

const FirstMoveStatsChart = ({ data, isLoading = false }: FirstMoveChartProps) => {
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

  // Prepare data
  const whiteMovesData = Object.entries(data.white_moves || {})
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  const blackMovesData = Object.entries(data.black_moves || {})
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);

  const currentMovesData = selectedColor === 'white' ? whiteMovesData : blackMovesData;
  const currentStats = selectedColor === 'white'
    ? {
        types: Object.keys(data.white_moves || {}).length,
        games: Object.values(data.white_moves || {}).reduce((a, b) => a + b, 0)
      }
    : {
        types: Object.keys(data.black_moves || {}).length,
        games: Object.values(data.black_moves || {}).reduce((a, b) => a + b, 0)
      };

  // Y축 최대값을 모든 데이터의 최대값 기준으로 계산
  const allMovesMax = Math.max(
    ...Object.values(data.white_moves || {}).map(v => typeof v === 'number' ? v : 0),
    ...Object.values(data.black_moves || {}).map(v => typeof v === 'number' ? v : 0)
  );
  const yAxisMax = Math.ceil(allMovesMax * 1.1);

  const barColor = selectedColor === 'white' ? '#3b82f6' : '#8b5cf6';

  const chartData = {
    labels: currentMovesData.map(m => m.name),
    datasets: [
      {
        label: language === 'KR' ? '경기' : 'Games',
        data: currentMovesData.map(m => m.value),
        backgroundColor: barColor,
        borderColor: barColor,
        borderWidth: 0,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x' as const,
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
      },
    },
    scales: {
      x: {
        stacked: false,
        ticks: {
          color: '#999',
          font: { size: 12, weight: '500' as const },
          maxRotation: 0,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
        offset: true,
      },
      y: {
        stacked: false,
        beginAtZero: true,
        max: yAxisMax,
        ticks: {
          color: '#999',
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
          drawBorder: false,
        },
      },
    },
  };

  return (
    <div className="rounded-2xl p-8 bg-gradient-to-br from-[#0d1626]/80 to-[#070d1a]/50 border border-white/10 backdrop-blur-sm transition-all duration-300 hover:border-white/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {language === 'KR' ? '첫 수 통계' : 'First Move Statistics'}
          </h3>
          <p className="text-xs text-white/40 font-medium uppercase tracking-wide">
            {language === 'KR' ? '자주 사용하는 오프닝 보기' : 'Your Favorite Opening Moves'}
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
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl p-6 bg-blue-500/10 border border-blue-500/30 text-center">
          <p className="text-3xl font-bold text-blue-400 mb-2">{currentStats.types}</p>
          <p className="text-xs text-blue-400/70 font-medium uppercase tracking-wide">
            {language === 'KR' ? '오프닝 종류' : 'Opening Types'}
          </p>
        </div>
        <div className="rounded-xl p-6 bg-purple-500/10 border border-purple-500/30 text-center">
          <p className="text-3xl font-bold text-purple-400 mb-2">{currentStats.games}</p>
          <p className="text-xs text-purple-400/70 font-medium uppercase tracking-wide">
            {language === 'KR' ? '경기 수' : 'Total Games'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-8" style={{ height: currentMovesData.length > 5 ? '600px' : '400px' }}>
        <Bar data={chartData} options={{ ...options, maintainAspectRatio: false }} />
      </div>

      {/* Top 5 Moves */}
      <div className="pt-6 border-t border-white/10">
        <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">
          {language === 'KR'
            ? `${selectedColor === 'white' ? '백색' : '흑색'} - 상위 5 오프닝`
            : `Top 5 ${selectedColor === 'white' ? 'White' : 'Black'} Moves`
          }
        </h4>
        <div className="space-y-3">
          {currentMovesData.slice(0, 5).map((move, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                {idx + 1}
              </div>
              <span className="text-sm font-medium text-white flex-1">{move.name}</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(move.value / allMovesMax) * 100}%`,
                      backgroundColor: barColor,
                    }}
                  ></div>
                </div>
                <span className="text-xs font-semibold text-white/70 w-10 text-right">{move.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FirstMoveStatsChart;
