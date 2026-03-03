import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { RatingHistoryEntry } from '../api/lichessService';
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RatingHistoryChartProps {
  ratingHistory: RatingHistoryEntry[];
  tierThresholds?: Record<string, number>;
  isCard?: boolean;
}

const DEFAULT_TIER_THRESHOLDS: Record<string, number> = {
  'PAWN': 400,
  'KNIGHT': 901,
  'BISHOP': 1201,
  'ROOK': 1501,
  'QUEEN': 1801,
  'KING': 2101,
};

const getTierColor = (rating: number, thresholds: Record<string, number> = DEFAULT_TIER_THRESHOLDS): string => {
  const tiers = Object.entries(thresholds).sort(([, a], [, b]) => b - a);
  
  for (const [tier, minRating] of tiers) {
    if (rating >= minRating) {
      switch (tier) {
        case 'PAWN': return '#22c55e'; // Green
        case 'KNIGHT': return '#3b82f6'; // Blue
        case 'BISHOP': return '#a855f7'; // Purple
        case 'ROOK': return '#ef4444'; // Red
        case 'QUEEN': return '#f59e0b'; // Amber
        case 'KING': return '#f59e0b'; // Amber
        default: return '#3b82f6';
      }
    }
  }
  
  return '#22c55e';
};

const RatingHistoryChart = ({ 
  ratingHistory, 
  tierThresholds = DEFAULT_TIER_THRESHOLDS
}: RatingHistoryChartProps) => {
  const { language } = useLanguage();
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (!ratingHistory || ratingHistory.length === 0) return;

    // 데이터 준비
    const labels = ratingHistory.map((entry) => {
      return `${entry.month}/${entry.day}`;
    });

    const ratings = ratingHistory.map((entry) => entry.rating);
    const colors = ratings.map((rating) => getTierColor(rating, tierThresholds));

    // 각 세그먼트마다 다른 색상으로 보이게 하기 위해 데이터셋 분할
    const datasets = [];
    let currentColor = colors[0];
    let segmentStart = 0;

    for (let i = 1; i <= ratingHistory.length; i++) {
      if (i === ratingHistory.length || colors[i] !== currentColor) {
        const segmentEnd = i === ratingHistory.length ? i : i;
        const segmentRatings = ratings.slice(segmentStart, segmentEnd);

        datasets.push({
          label: `Tier`,
          data: segmentRatings,
          borderColor: currentColor,
          backgroundColor: currentColor + '20',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: currentColor,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        });

        if (i < ratingHistory.length) {
          currentColor = colors[i];
          segmentStart = i;
        }
      }
    }

    // 단순 버전: 하나의 라인으로 모든 데이터 표시
    setChartData({
      labels,
      datasets: [
        {
          label: language === 'KR' ? '레이팅' : 'Rating',
          data: ratings,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        },
      ],
    });
  }, [ratingHistory, tierThresholds, language]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">{language === 'KR' ? '데이터 로딩 중...' : 'Loading...'}</p>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 12, weight: 'bold' as const },
        bodyFont: { size: 12 },
        borderColor: '#ddd',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 12, weight: 'bold' as const },
        },
      },
      y: {
        display: true,
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default RatingHistoryChart;
