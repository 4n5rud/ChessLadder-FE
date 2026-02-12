import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { RatingHistoryEntry } from '../api/lichessService';
import { useLanguage } from '../context/LanguageContext';

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
        case 'PAWN': return '#aecdb1';
        case 'KNIGHT': return '#87abd6';
        case 'BISHOP': return '#ae97d7';
        case 'ROOK': return '#e7ada8';
        case 'QUEEN': return '#edae6c';
        case 'KING': return '#edae6c';
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
  
  return 'PAWN';
};

const getTierWithSubTier = (rating: number, thresholds: Record<string, number> = DEFAULT_TIER_THRESHOLDS): string => {
  const tier = getRatingTier(rating, thresholds);
  
  // 각 티어의 레이팅 범위 및 서브티어 기준
  const tierRanges: { [key: string]: { min: number; max: number; subTiers: { [key: number]: [number, number] } } } = {
    'PAWN': {
      min: 400,
      max: 900,
      subTiers: {
        5: [400, 500],
        4: [501, 600],
        3: [601, 700],
        2: [701, 800],
        1: [801, 900]
      }
    },
    'KNIGHT': {
      min: 901,
      max: 1200,
      subTiers: {
        5: [901, 960],
        4: [961, 1020],
        3: [1021, 1080],
        2: [1081, 1140],
        1: [1141, 1200]
      }
    },
    'BISHOP': {
      min: 1201,
      max: 1500,
      subTiers: {
        5: [1201, 1260],
        4: [1261, 1320],
        3: [1321, 1380],
        2: [1381, 1440],
        1: [1441, 1500]
      }
    },
    'ROOK': {
      min: 1501,
      max: 1800,
      subTiers: {
        5: [1501, 1560],
        4: [1561, 1620],
        3: [1621, 1680],
        2: [1681, 1740],
        1: [1741, 1800]
      }
    },
    'QUEEN': {
      min: 1801,
      max: 2100,
      subTiers: {
        5: [1801, 1860],
        4: [1861, 1920],
        3: [1921, 1980],
        2: [1981, 2040],
        1: [2041, 2100]
      }
    },
    'KING': {
      min: 2101,
      max: 2700,
      subTiers: {
        5: [2101, 2220],
        4: [2221, 2340],
        3: [2341, 2460],
        2: [2461, 2580],
        1: [2581, 2700]
      }
    }
  };
  
  const tierData = tierRanges[tier];
  if (!tierData) return `${tier}`;
  
  // 현재 레이팅에 해당하는 서브티어 찾기
  let currentSubTier = 5;
  for (const [subTier, [min, max]] of Object.entries(tierData.subTiers)) {
    if (rating >= min && rating <= max) {
      currentSubTier = parseInt(subTier);
      break;
    }
  }
  
  const romanMap: { [key: string]: string } = {
    '1': 'I',
    '2': 'II',
    '3': 'III',
    '4': 'IV',
    '5': 'V'
  };
  
  return `${tier} ${romanMap[currentSubTier]}`;
};

const RatingHistoryChart: React.FC<RatingHistoryChartProps> = ({ 
  ratingHistory, 
  gameType = 'Rapid',
  tierThresholds = DEFAULT_TIER_THRESHOLDS 
}) => {
  const { t } = useLanguage();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
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
        <p className="text-gray-500">{t('profile.noRatingData')}</p>
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
          {gameType} {t('profile.ratingHistory')}
        </h3>
        <p className="text-sm text-gray-500">{t('profile.ratingProgression')}</p>
      </div>
      
      <div className="w-full overflow-x-auto -mx-6 px-6">
        <ResponsiveContainer width="100%" height={450} minWidth={800}>
          <LineChart data={chartData} margin={{ top: 20, right: 50, left: 50, bottom: 60 }}>
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
    </div>
  );
};

export default RatingHistoryChart;
