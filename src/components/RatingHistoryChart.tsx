import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
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
  tierWithSubTier?: string;
  previousTier?: string;
  previousTierWithSubTier?: string;
  isTierChange?: boolean;
  isPromoted?: boolean;
}

interface LineSegment {
  data: ChartDataPoint[];
  color: string;
  startIndex: number;
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

const getTierWithSubTier = (rating: number, thresholds: Record<string, number> = DEFAULT_TIER_THRESHOLDS): string => {
  const tier = getRatingTier(rating, thresholds);
  const tierRating = thresholds[tier] || 0;
  const nextTierName = Object.keys(thresholds).find(t => thresholds[t] === Object.values(thresholds).find(v => v > tierRating));
  const nextTierRating = nextTierName ? thresholds[nextTierName] : (tierRating + 400);
  
  const diffToNext = nextTierRating - rating;
  let subTier = 1;
  
  if (diffToNext < 0) {
    subTier = 5;
  } else if (diffToNext <= 80) {
    subTier = 5;
  } else if (diffToNext <= 160) {
    subTier = 4;
  } else if (diffToNext <= 240) {
    subTier = 3;
  } else if (diffToNext <= 320) {
    subTier = 2;
  } else {
    subTier = 1;
  }
  
  const romanMap: { [key: string]: string } = {
    '1': 'I',
    '2': 'II',
    '3': 'III',
    '4': 'IV',
    '5': 'V'
  };
  
  return `${tier} ${romanMap[subTier]}`;
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
  const [lineSegments, setLineSegments] = useState<LineSegment[]>([]);

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
      const currentTierWithSubTier = getTierWithSubTier(entry.rating, tierThresholds);
      const previousTierWithSubTier = getTierWithSubTier(previousRating, tierThresholds);
      
      const isTierChange = currentTier !== previousTier;
      const isPromoted = isTierChange && entry.rating > previousRating;

      return {
        ...entry,
        dateStr,
        previousRating,
        tier: currentTier,
        tierWithSubTier: currentTierWithSubTier,
        previousTier: previousTier,
        previousTierWithSubTier: previousTierWithSubTier,
        isTierChange,
        isPromoted,
      };
    });

    // 티어별 라인 세그먼트 생성
    const segments: LineSegment[] = [];
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
      const changeColor = ratingChange > 0 ? '#22c55e' : ratingChange < 0 ? '#ef4444' : '#666666';
      const changeIcon = ratingChange > 0 ? '↑' : ratingChange < 0 ? '↓' : '→';
      const tierColor = getTierColor(data.rating, tierThresholds);

      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-blue-200">
          <p className="text-sm font-bold text-gray-800">{data.dateStr}</p>
          <p className="text-lg font-bold text-blue-600 my-1">{data.rating}</p>
          <div className="flex items-center gap-2">
            <span style={{ color: changeColor }} className="font-bold text-lg">
              {changeIcon} {ratingChange > 0 ? '+' : ''}{ratingChange}
            </span>
            <span style={{ backgroundColor: tierColor, color: '#fff' }} className="text-xs font-bold px-2 py-1 rounded">
              {data.tierWithSubTier}
            </span>
          </div>
          {data.isTierChange && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="mb-1">
                <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${data.isPromoted ? 'bg-green-500' : 'bg-red-500'}`}>
                  {data.isPromoted ? '✓ 승격' : '✗ 강등'}
                </span>
              </div>
              <p className="text-xs font-bold text-gray-800">
                {data.previousTierWithSubTier} → {data.tierWithSubTier}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6 overflow-hidden border border-gray-100">
      <div className="mb-6">
        <h3 className="text-3xl font-bold text-gray-800 mb-2">
          {gameType} 레이팅 히스토리
        </h3>
        <p className="text-sm text-gray-500">게임 활동에 따른 레이팅 진행 상황</p>
      </div>
      
      <div className="w-full overflow-x-auto -mx-6 px-6">
        <ResponsiveContainer width="100%" height={450} minWidth={800}>
          <LineChart data={chartData} margin={{ top: 20, right: 50, left: 50, bottom: 60 }} onMouseMove={(state: any) => {
              if (state?.activePayload?.[0]?.payload) {
                setHoveredPoint(state.activePayload[0].payload);
              }
            }} onMouseLeave={() => setHoveredPoint(null)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
            <XAxis
              dataKey="dateStr"
              tick={{ fontSize: 12, fill: '#666' }}
              interval={Math.floor(chartData.length / 6)}
              stroke="#d1d5db"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              domain={[minRating, maxRating]}
              tick={{ fontSize: 12, fill: '#666' }}
              stroke="#d1d5db"
              width={60}
              gridLineStroke="#f0f0f0"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 2, opacity: 0.3 }} />
            
            {/* 티어 구분선 */}
            {Object.entries(tierThresholds).map(([tier, rating]) => (
              <ReferenceLine
                key={tier}
                y={rating}
                stroke={getTierColor(rating, tierThresholds)}
                strokeDasharray="5 5"
                opacity={0.2}
                label={{
                  value: `${tier} (${rating})`,
                  position: 'right',
                  fill: getTierColor(rating, tierThresholds),
                  offset: 10,
                  fontSize: 11,
                  fontWeight: 'bold',
                  opacity: 0.6
                }}
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
                        r={8}
                        fill={changeColor}
                        stroke="#fff"
                        strokeWidth={2.5}
                      />
                    );
                  } else {
                    // 일반 점: 게임이 있던 날은 명확하게 표시
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={segment.color}
                        stroke="#fff"
                        strokeWidth={1.5}
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
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">현재 레이팅</p>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {chartData[chartData.length - 1]?.rating || '-'}
          </p>
          <p className="text-xs text-gray-500 mt-2">{chartData[chartData.length - 1]?.dateStr}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">최고 레이팅</p>
            <span className="text-2xl">🏆</span>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {Math.max(...chartData.map(d => d.rating))}
          </p>
          <p className="text-xs text-gray-500 mt-2">역대 최고 기록</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">최저 레이팅</p>
            <span className="text-2xl">📉</span>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {Math.min(...chartData.map(d => d.rating))}
          </p>
          <p className="text-xs text-gray-500 mt-2">역대 최저 기록</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm font-medium">현재 티어</p>
            <span className="text-2xl">👑</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: getTierColor(chartData[chartData.length - 1]?.rating) }}>
            {chartData[chartData.length - 1]?.tier || '-'}
          </p>
          <p className="text-xs text-gray-500 mt-2">진행 중</p>
        </div>
      </div>

      {/* 호버 정보 */}
      <div className="mt-6">
        {hoveredPoint ? (
          <div className="p-4 bg-blue-50 rounded-xl border-l-4 border-blue-500 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">날짜</p>
                <p className="text-lg font-bold text-gray-800">{hoveredPoint.dateStr}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">레이팅</p>
                <p className="text-lg font-bold text-blue-600">{hoveredPoint.rating}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">티어</p>
                <p className="text-lg font-bold" style={{ color: getTierColor(hoveredPoint.rating) }}>
                  {hoveredPoint.tierWithSubTier}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">변화</p>
                <p className={`text-lg font-bold ${hoveredPoint.rating - (hoveredPoint.previousRating || hoveredPoint.rating) > 0 ? 'text-green-600' : hoveredPoint.rating - (hoveredPoint.previousRating || hoveredPoint.rating) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {hoveredPoint.rating - (hoveredPoint.previousRating || hoveredPoint.rating) > 0 ? '+' : ''}{hoveredPoint.rating - (hoveredPoint.previousRating || hoveredPoint.rating)}
                </p>
              </div>
            </div>
            {hoveredPoint.isTierChange && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-semibold ${hoveredPoint.isPromoted ? 'bg-green-500' : 'bg-red-500'}`}>
                    {hoveredPoint.isPromoted ? '✓ 승격' : '✗ 강등'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-bold text-gray-800">
                    <span style={{ backgroundColor: getTierColor(hoveredPoint.previousRating || 0), color: '#fff' }} className="px-2 py-1 rounded-full text-xs font-bold mr-1">
                      {hoveredPoint.previousTierWithSubTier}
                    </span>
                    →
                    <span style={{ backgroundColor: getTierColor(hoveredPoint.rating), color: '#fff' }} className="px-2 py-1 rounded-full text-xs font-bold ml-1">
                      {hoveredPoint.tierWithSubTier}
                    </span>
                  </p>
                </div>
                <span className="text-xs text-gray-600">
                  {hoveredPoint.isPromoted ? '축하합니다! 상위 티어로 승격했습니다.' : '다음 게임에서 더 잘해보세요!'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-gray-500 text-sm">
            차트 위에 마우스를 올려 상세 정보를 확인하세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default RatingHistoryChart;
