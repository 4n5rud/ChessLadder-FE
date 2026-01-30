import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { RatingHistoryEntry } from '../api/lichessService';

interface RatingHistoryChartProps {
  ratingHistory: RatingHistoryEntry[];
  gameType?: string;
  tierThresholds?: Record<string, number>;
}

interface ChartDataPoint extends RatingHistoryEntry {
  dateStr: string;
  previousRating?: number;
  tier?: string;
  isTierChange?: boolean;
  isPromoted?: boolean;
}

const DEFAULT_TIER_THRESHOLDS: Record<string, number> = {
  'Pawn': 0,
  'Knight': 800,
  'Bishop': 1200,
  'Rook': 1600,
  'Queen': 2000,
  'King': 2400,
};

const getTierColor = (rating: number, thresholds: Record<string, number> = DEFAULT_TIER_THRESHOLDS): string => {
  const tiers = Object.entries(thresholds).sort(([, a], [, b]) => b - a);
  
  for (const [tier, minRating] of tiers) {
    if (rating >= minRating) {
      switch (tier) {
        case 'Pawn': return '#aecdb1';
        case 'Knight': return '#87abd6';
        case 'Bishop': return '#ae97d7';
        case 'Rook': return '#e7ada8';
        case 'Queen': return '#edae6c';
        case 'King': return '#edae6c';
        default: return '#2F639D';
      }
    }
  }
  
  return '#aecdb1';
};

const getRatingTier = (rating: number, thresholds: Record<string, number> = DEFAULT_TIER_THRESHOLDS): string => {
  const tiers = Object.entries(thresholds).sort(([, a], [, b]) => b - a);
  
  for (const [tier, minRating] of tiers) {
    if (rating >= minRating) {
      return tier;
    }
  }
  
  return 'Pawn';
};

const RatingHistoryChart: React.FC<RatingHistoryChartProps> = ({ 
  ratingHistory, 
  gameType = 'Rapid',
  tierThresholds = DEFAULT_TIER_THRESHOLDS 
}) => {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [maxRating, setMaxRating] = useState(2400);
  const [minRating, setMinRating] = useState(0);
  const [lineSegments, setLineSegments] = useState<Array<{ data: ChartDataPoint[]; color: string; startIndex: number }>>([]);

  useEffect(() => {
    if (!ratingHistory || ratingHistory.length === 0) {
      return;
    }

    // 데이터를 날짜순으로 정렬
    const sortedHistory = [...ratingHistory].sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1, a.day);
      const dateB = new Date(b.year, b.month - 1, b.day);
      return dateA.getTime() - dateB.getTime();
    });

    // 중복 제거
    const uniqueHistory = sortedHistory.reduce((acc, curr) => {
      const lastItem = acc[acc.length - 1];
      if (!lastItem || 
          lastItem.year !== curr.year || 
          lastItem.month !== curr.month || 
          lastItem.day !== curr.day) {
        acc.push(curr);
      }
      return acc;
    }, [] as RatingHistoryEntry[]);

    // 차트 데이터 생성 및 티어 변경 감지
    const data: ChartDataPoint[] = uniqueHistory.map((entry, index) => {
      const dateStr = `${entry.year}-${String(entry.month).padStart(2, '0')}-${String(entry.day).padStart(2, '0')}`;
      const previousRating = index > 0 ? uniqueHistory[index - 1].rating : entry.rating;
      const currentTier = getRatingTier(entry.rating, tierThresholds);
      const previousTier = getRatingTier(previousRating, tierThresholds);
      
      const isTierChange = currentTier !== previousTier;
      const isPromoted = isTierChange && entry.rating > previousRating;

      return {
        ...entry,
        dateStr,
        previousRating,
        tier: currentTier,
        isTierChange,
        isPromoted,
      };
    });

    // 티어별 라인 세그먼트 생성
    const segments: Array<{ data: ChartDataPoint[]; color: string; startIndex: number }> = [];
    let currentSegment: ChartDataPoint[] = [];
    let currentTier = data[0]?.tier;

    data.forEach((point, index) => {
      if (point.tier !== currentTier && index > 0) {
        if (currentSegment.length > 0) {
          segments.push({
            data: currentSegment,
            color: getTierColor(currentSegment[0].rating, tierThresholds),
            startIndex: index - currentSegment.length
          });
        }
        currentSegment = [point];
        currentTier = point.tier;
      } else {
        currentSegment.push(point);
      }
    });

    if (currentSegment.length > 0) {
      segments.push({
        data: currentSegment,
        color: getTierColor(currentSegment[0].rating, tierThresholds),
        startIndex: data.length - currentSegment.length
      });
    }

    setLineSegments(segments);
    setChartData(data);

    // 최대/최소 레이팅 계산
    if (data.length > 0) {
      const ratings = data.map(d => d.rating);
      const max = Math.max(...ratings);
      const min = Math.min(...ratings);
      
      setMaxRating(Math.ceil((max + 200) / 100) * 100);
      setMinRating(Math.floor((min - 200) / 100) * 100);
    }
  }, [ratingHistory, tierThresholds]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">레이팅 히스토리 데이터가 없습니다.</p>
      </div>
    );
  }

  const CustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      const ratingChange = data.rating - (data.previousRating || data.rating);
      const changeColor = ratingChange > 0 ? 'text-green-600' : ratingChange < 0 ? 'text-red-600' : 'text-gray-600';

      return (
        <div className="bg-white p-3 border-2 border-[#2F639D] rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-800">{data.dateStr}</p>
          <p className="text-sm text-gray-700">레이팅: {data.rating}</p>
          <p className={`text-sm font-semibold ${changeColor}`}>
            {ratingChange > 0 ? '+' : ''}{ratingChange}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            티어: {data.tier}
            {data.isTierChange && (data.isPromoted ? ' (승격)' : ' (강등)')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6 overflow-hidden">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">{gameType} 레이팅 히스토리</h3>
      
      <div className="w-full overflow-x-auto -mx-6 px-6">
        <ResponsiveContainer width="100%" height={450} minWidth={800}>
          <LineChart data={chartData} margin={{ top: 20, right: 50, left: 50, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="dateStr"
              tick={{ fontSize: 12 }}
              interval={Math.floor(chartData.length / 6)}
              stroke="#666"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              domain={[minRating, maxRating]}
              tick={{ fontSize: 12 }}
              stroke="#666"
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* 티어 구분선 */}
            {Object.entries(tierThresholds).map(([tier, rating]) => (
              <ReferenceLine
                key={tier}
                y={rating}
                stroke={getTierColor(rating, tierThresholds)}
                strokeDasharray="5 5"
                opacity={0.3}
                label={{ value: tier, position: 'right', fill: getTierColor(rating, tierThresholds), offset: 10 }}
              />
            ))}
            
            {/* 티어별 라인 세그먼트 */}
            {lineSegments.map((segment, idx) => (
              <Line
                key={`segment-${idx}`}
                data={segment.data}
                type="monotone"
                dataKey="rating"
                stroke={segment.color}
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload) return null;
                  
                  // 모든 점을 표시하되, 티어 변경 지점은 특별히 강조
                  const data = payload as ChartDataPoint;
                  
                  if (data.isTierChange) {
                    // 승격: 초록색, 강등: 빨간색
                    const changeColor = data.isPromoted ? '#22c55e' : '#ef4444';
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={7}
                        fill={changeColor}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  } else {
                    // 일반 점: 작게 표시
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill={segment.color}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    );
                  }
                }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 통계 정보 */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm mb-2">현재 레이팅</p>
          <p className="text-2xl font-bold text-[#2F639D]">
            {chartData[chartData.length - 1]?.rating || '-'}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm mb-2">최고 레이팅</p>
          <p className="text-2xl font-bold text-green-600">
            {Math.max(...chartData.map(d => d.rating))}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm mb-2">최저 레이팅</p>
          <p className="text-2xl font-bold text-red-600">
            {Math.min(...chartData.map(d => d.rating))}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm mb-2">현재 티어</p>
          <p className="text-2xl font-bold" style={{ color: getTierColor(chartData[chartData.length - 1]?.rating) }}>
            {chartData[chartData.length - 1]?.tier || '-'}
          </p>
        </div>
      </div>

      {/* 호버 정보 */}
      {hoveredPoint && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-[#2F639D]">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{hoveredPoint.dateStr}</span>
            {' - '}
            <span className="font-bold text-[#2F639D]">{hoveredPoint.rating} 레이팅</span>
            {' - '}
            <span>{hoveredPoint.tier}</span>
            {hoveredPoint.isTierChange && (
              <span className="ml-2 font-semibold">
                {hoveredPoint.isPromoted ? '✓ 승격' : '✗ 강등'}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default RatingHistoryChart;
