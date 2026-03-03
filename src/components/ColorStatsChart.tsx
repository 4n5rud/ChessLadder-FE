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
      <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const currentData = selectedColor === 'white' 
    ? {
        wins: data.white_wins,
        losses: data.white_loses,
        draws: data.white_draws,
        total: data.white_total,
      }
    : {
        wins: data.black_wins,
        losses: data.black_loses,
        draws: data.black_draws,
        total: data.black_total,
      };

  const themeColors = selectedColor === 'white'
    ? { 
        bg: 'bg-white', 
        text: 'text-gray-900', 
        border: 'border-gray-300', 
        cardBg: 'bg-gray-50', 
        inactiveBtn: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        tooltip: { bg: '#fff', border: '#d1d5db', text: '#000' }
      }
    : { 
        bg: 'bg-gray-900', 
        text: 'text-white', 
        border: 'border-gray-700', 
        cardBg: 'bg-gray-800', 
        inactiveBtn: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
        tooltip: { bg: '#1f2937', border: '#4b5563', text: '#fff' }
      };

  const chartData = {
    labels: [
      language === 'KR' ? '승리' : 'Wins',
      language === 'KR' ? '패배' : 'Losses',
      language === 'KR' ? '무승부' : 'Draws',
    ],
    datasets: [
      {
        data: [currentData.wins, currentData.losses, currentData.draws],
        backgroundColor: ['#4ade80', '#ef4444', '#9ca3af'],
        borderColor: selectedColor === 'white' ? '#ffffff' : '#1f2937',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: selectedColor === 'white' ? '#374151' : '#d1d5db',
          font: { size: 12 },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: themeColors.tooltip.bg,
        titleColor: themeColors.tooltip.text,
        bodyColor: themeColors.tooltip.text,
        borderColor: themeColors.tooltip.border,
        borderWidth: 1,
        padding: 16,
        titleFont: { size: 14, weight: 'bold' as const },
        bodyFont: { size: 13 },
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
    <div className={`rounded-lg p-6 ${themeColors.bg} ${themeColors.border} border shadow-sm transition-colors duration-300`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${themeColors.text}`}>
            {language === 'KR' ? '색깔별 게임 통계' : 'Color Game Statistics'}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedColor('white')}
              className={`px-4 py-2 rounded font-medium text-sm transition focus:outline-none focus:ring-0 ${
                selectedColor === 'white'
                  ? 'bg-gray-800 text-white'
                  : themeColors.inactiveBtn
              }`}
            >
              {language === 'KR' ? '백' : 'White'}
            </button>
            <button
              onClick={() => setSelectedColor('black')}
              className={`px-4 py-2 rounded font-medium text-sm transition focus:outline-none focus:ring-0 ${
                selectedColor === 'black'
                  ? 'bg-white text-gray-900'
                  : themeColors.inactiveBtn
              }`}
            >
              {language === 'KR' ? '흑' : 'Black'}
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className={`${themeColors.cardBg} p-4 rounded-lg border ${themeColors.border}`}>
          <p className={`text-xs font-semibold ${selectedColor === 'white' ? 'text-gray-600' : 'text-gray-400'} mb-3 uppercase`}>
            {selectedColor === 'white' ? (language === 'KR' ? '백색' : 'White') : (language === 'KR' ? '흑색' : 'Black')}
          </p>
          <div className="flex justify-between items-center">
            <div>
              <p className={`text-2xl font-bold ${themeColors.text}`}>{currentData.total}</p>
              <p className={`text-xs ${selectedColor === 'white' ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
                {language === 'KR' ? '경기' : 'Games'}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${themeColors.text}`}>
                {currentData.total > 0
                  ? ((currentData.wins / currentData.total) * 100).toFixed(1)
                  : '0.0'}%
              </p>
              <p className={`text-xs ${selectedColor === 'white' ? 'text-gray-600' : 'text-gray-400'}`}>
                {language === 'KR' ? '승률' : 'Win %'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-96 outline-none">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ColorStatsChart;
