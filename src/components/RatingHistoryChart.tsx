import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { RatingHistoryEntry } from '../api/lichessService';
import { useLanguage } from '../context/LanguageContext';

interface RatingHistoryChartProps {
  ratingHistory: RatingHistoryEntry[];
  tierThresholds?: Record<string, number>;
  isCard?: boolean;
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
  tierThresholds = DEFAULT_TIER_THRESHOLDS,
  isCard = false
}) => {
  const { t } = useLanguage();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [maxRating, setMaxRating] = useState(2400);
  const [minRating, setMinRating] = useState(0);

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

    setChartData(data);

    // 최대/최소 레이팅 계산
    if (data.length > 0) {
      const ratings = data.map(d => d.rating);
      const max = Math.max(...ratings);
      const min = Math.min(...ratings);
      
      setMaxRating(Math.ceil((max + 100) / 50) * 50);
      setMinRating(Math.floor((min - 100) / 50) * 50);
    }
  }, [ratingHistory, tierThresholds]);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-400 text-xs font-bold">{t('profile.noRatingData')}</p>
      </div>
    );
  }

  const CustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint;
      const ratingChange = data.rating - (data.previousRating || data.rating);
      const changeColor = ratingChange > 0 ? '#22c55e' : ratingChange < 0 ? '#ef4444' : '#666666';
      const tierColor = getTierColor(data.rating, tierThresholds);

      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-2xl shadow-2xl border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 mb-1">{data.dateStr}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-black text-gray-800">{data.rating}</p>
            <span style={{ color: changeColor }} className="text-xs font-black">
              {ratingChange >= 0 ? '+' : ''}{ratingChange}
            </span>
          </div>
          <p className="text-[10px] font-black mt-1 px-2 py-0.5 rounded-full inline-block text-white" style={{ backgroundColor: tierColor }}>
            {data.tierWithSubTier}
          </p>
        </div>
      );
    }
    return null;
  };

  const chartColor = getTierColor(chartData[chartData.length - 1].rating, tierThresholds);

  return (
    <div className={`w-full h-full overflow-hidden ${!isCard ? 'p-4 bg-gray-50/30 rounded-[32px]' : ''}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: -10, bottom: 10 }}>
          <defs>
            <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="4 4" 
            vertical={false} 
            stroke="#E5E7EB" 
            opacity={0.6}
          />
          <XAxis 
            dataKey="dateStr" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fontWeight: 600, fill: '#9CA3AF' }}
            minTickGap={30}
            dy={10}
            hide={isCard}
          />
          <YAxis 
            domain={[minRating, maxRating]} 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fontWeight: 700, fill: '#9CA3AF' }}
            dx={-10}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: chartColor, strokeWidth: 2, strokeDasharray: '5 5' }} 
          />
          
          {/* 티어 기준선 표시 (카드 모드가 아닐 때만) */}
          {!isCard && Object.entries(tierThresholds).map(([tier, threshold]) => (
            threshold >= minRating && threshold <= maxRating && (
              <ReferenceLine
                key={tier}
                y={threshold}
                stroke={getTierColor(threshold, tierThresholds)}
                strokeDasharray="3 3"
                strokeWidth={1}
                opacity={0.3}
              />
            )
          ))}

          <Area 
            type="monotone" 
            dataKey="rating" 
            stroke={chartColor} 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorRating)" 
            isAnimationActive={!isCard}
            animationDuration={1500}
            dot={!isCard ? { r: 4, strokeWidth: 2, fill: 'white', stroke: chartColor } : false}
            activeDot={{ r: 8, strokeWidth: 0, fill: chartColor }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RatingHistoryChart;
