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
      <div className="bg-white rounded-lg p-6 border border-gray-300 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
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

  const themeColors = selectedColor === 'white'
    ? { 
        bg: 'bg-white', 
        text: 'text-gray-900', 
        border: 'border-gray-300', 
        cardBg: 'bg-gray-50', 
        inactiveBtn: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
        tooltip: { bg: '#fff', border: '#d1d5db', text: '#000' },
        barColor: '#3b82f6',
        barHover: 'rgba(59, 130, 246, 0.8)',
      }
    : { 
        bg: 'bg-gray-900', 
        text: 'text-white', 
        border: 'border-gray-700', 
        cardBg: 'bg-gray-800',
        inactiveBtn: 'bg-gray-700 text-gray-300 hover:bg-gray-600',
        tooltip: { bg: '#1f2937', border: '#4b5563', text: '#fff' },
        barColor: '#1f2937',
        barHover: 'rgba(31, 41, 55, 0.9)',
      };

  const chartData = {
    labels: currentMovesData.map(m => m.name),
    datasets: [
      {
        label: language === 'KR' ? '경기' : 'Games',
        data: currentMovesData.map(m => m.value),
        backgroundColor: themeColors.barColor,
        borderColor: themeColors.barColor,
        borderWidth: 0,
        borderRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x' as const,
    plugins: {
      legend: {
        display: true,
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
      },
    },
    scales: {
      x: {
        stacked: false,
        ticks: {
          color: selectedColor === 'white' ? '#666' : '#ccc',
          font: { size: 14, weight: 'bold' as const },
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
          color: selectedColor === 'white' ? '#666' : '#ccc',
          font: { size: 11 },
        },
        grid: {
          color: selectedColor === 'white' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  return (
    <div className={`rounded-lg p-6 ${themeColors.bg} ${themeColors.border} border shadow-sm transition-colors duration-300`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${themeColors.text}`}>
            {language === 'KR' ? '첫 수 통계' : 'First Move Statistics'}
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
              <p className={`text-2xl font-bold ${themeColors.text}`}>{currentStats.types}</p>
              <p className={`text-xs ${selectedColor === 'white' ? 'text-gray-600' : 'text-gray-400'} mt-1`}>
                {language === 'KR' ? '종류' : 'Types'}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${themeColors.text}`}>{currentStats.games}</p>
              <p className={`text-xs ${selectedColor === 'white' ? 'text-gray-600' : 'text-gray-400'}`}>
                {language === 'KR' ? '경기' : 'Games'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full outline-none" style={{ height: '400px', overflowY: currentMovesData.length > 5 ? 'auto' : 'visible' }}>
        <div style={{ minHeight: currentMovesData.length > 5 ? '600px' : '400px' }}>
          <Bar data={chartData} options={{ ...options, maintainAspectRatio: false }} />
        </div>
      </div>

      {/* Top 5 Moves */}
      <div className="mt-8">
        <h4 className={`font-bold ${themeColors.text} mb-4`}>
          {selectedColor === 'white' 
            ? (language === 'KR' ? '백색 - 자주 사용하는 첫 수' : 'White - Favorite Opening Moves')
            : (language === 'KR' ? '흑색 - 자주 사용하는 첫 수' : 'Black - Favorite Opening Moves')
          }
        </h4>
        <div className="space-y-3">
          {currentMovesData.slice(0, 5).map((move, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className={`text-sm font-medium ${themeColors.text}`}>{move.name}</span>
              <div className="flex items-center gap-2">
                <div className={`w-24 h-2 ${selectedColor === 'white' ? 'bg-gray-200' : 'bg-gray-700'} rounded-full overflow-hidden`}>
                  <div
                    className={`h-full ${selectedColor === 'white' ? 'bg-blue-500' : 'bg-gray-300'} rounded-full`}
                    style={{
                      width: `${(move.value / allMovesMax) * 100}%`,
                    }}
                  ></div>
                </div>
                <span className={`text-sm font-semibold ${themeColors.text} w-12 text-right`}>{move.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FirstMoveStatsChart;
