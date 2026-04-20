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
import type { RatingHistoryResponse } from '../api/userService';
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

interface MonthlyRatingHistoryChartProps {
  ratingHistory: RatingHistoryResponse | null;
  tierThresholds?: Record<string, number>;
  isLoading?: boolean;
  platform?: 'LICHESS' | 'CHESSCOM';
}

const DEFAULT_TIER_THRESHOLDS: Record<string, number> = {
  PAWN:   400,
  KNIGHT: 901,
  BISHOP: 1201,
  ROOK:   1501,
  QUEEN:  1801,
  KING:   2101,
};

const TIER_CONFIG: Record<string, { color: string; label: string }> = {
  PAWN:   { color: 'rgba(34, 197, 94, 1)',  label: 'Pawn'   },
  KNIGHT: { color: 'rgba(59, 130, 246, 1)', label: 'Knight' },
  BISHOP: { color: 'rgba(168, 85, 247, 1)', label: 'Bishop' },
  ROOK:   { color: 'rgba(239, 68, 68, 1)',  label: 'Rook'   },
  QUEEN:  { color: 'rgba(255, 140, 0, 1)',  label: 'Queen'  },
  KING:   { color: 'rgba(255, 215, 0, 1)',  label: 'King'   },
};

// TierSection.tsx와 동일한 서브티어 범위표
const LICHESS_SUBTIERS: Record<string, Record<number, [number, number]>> = {
  PAWN:   { 5:[400,500],   4:[501,600],   3:[601,700],   2:[701,800],   1:[801,900]   },
  KNIGHT: { 5:[901,960],   4:[961,1020],  3:[1021,1080], 2:[1081,1140], 1:[1141,1200] },
  BISHOP: { 5:[1201,1260], 4:[1261,1320], 3:[1321,1380], 2:[1381,1440], 1:[1441,1500] },
  ROOK:   { 5:[1501,1560], 4:[1561,1620], 3:[1621,1680], 2:[1681,1740], 1:[1741,1800] },
  QUEEN:  { 5:[1801,1860], 4:[1861,1920], 3:[1921,1980], 2:[1981,2040], 1:[2041,2100] },
  KING:   { 5:[2101,2220], 4:[2221,2340], 3:[2341,2460], 2:[2461,2580], 1:[2581,2700] },
};

const CHESSCOM_SUBTIERS: Record<string, Record<number, [number, number]>> = {
  PAWN:   { 5:[100,220],   4:[221,340],   3:[341,460],   2:[461,580],   1:[581,700]   },
  KNIGHT: { 5:[701,780],   4:[781,860],   3:[861,940],   2:[941,1020],  1:[1021,1100] },
  BISHOP: { 5:[1101,1180], 4:[1181,1260], 3:[1261,1340], 2:[1341,1420], 1:[1421,1500] },
  ROOK:   { 5:[1501,1560], 4:[1561,1620], 3:[1621,1680], 2:[1681,1740], 1:[1741,1800] },
  QUEEN:  { 5:[1801,1880], 4:[1881,1960], 3:[1961,2040], 2:[2041,2120], 1:[2121,2200] },
  KING:   { 5:[2201,2320], 4:[2321,2440], 3:[2441,2560], 2:[2561,2680], 1:[2681,2800] },
};

const ROMAN: Record<number, string> = { 1:'I', 2:'II', 3:'III', 4:'IV', 5:'V' };

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun',
                     'Jul','Aug','Sep','Oct','Nov','Dec'];

// ── 헬퍼 ────────────────────────────────────────────────────────────

function parseYearMonth(ym: string): { year: string; month: string } | null {
  if (!ym) return null;
  const parts = ym.split('-');
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { year: parts[0], month: parts[1] };
}

/** 차트 x축 레이블 — 항상 영문 약자 */
function formatLabel(ym: string): string | null {
  const parsed = parseYearMonth(ym);
  if (!parsed) return null;
  const idx = parseInt(parsed.month, 10) - 1;
  return `${MONTH_SHORT[idx] ?? parsed.month} '${parsed.year.slice(2)}`;
}

/** 툴팁 날짜 — 언어에 맞게 포맷 */
function formatTooltipTitle(ym: string, isKR: boolean): string {
  const p = parseYearMonth(ym);
  if (!p) return ym;
  if (isKR) {
    return `${p.year.slice(2)}년 ${parseInt(p.month, 10)}월`;
  }
  const idx = parseInt(p.month, 10) - 1;
  return `${MONTH_SHORT[idx] ?? p.month} '${p.year.slice(2)}`;
}

/** 기간 표시 — KR: "25년 5월 ~ 26년 4월"  EN: "May '25 – Apr '26" */
function formatPeriod(from: string, to: string, isKR: boolean): string {
  const fmtKR = (ym: string): string | null => {
    const p = parseYearMonth(ym);
    if (!p) return null;
    return `${p.year.slice(2)}년 ${parseInt(p.month, 10)}월`;
  };
  const fmtEN = (ym: string): string | null => formatLabel(ym);

  if (isKR) {
    const f = fmtKR(from), t = fmtKR(to);
    if (!f && !t) return '';
    if (!f) return t ?? '';
    if (!t) return f;
    return `${f} ~ ${t}`;
  } else {
    const f = fmtEN(from), t = fmtEN(to);
    if (!f && !t) return '';
    if (!f) return t ?? '';
    if (!t) return f;
    return `${f} – ${t}`;
  }
}

/** 메인 티어 이름 반환 */
function getTierForRating(
  rating: number,
  thresholds: Record<string, number>
): string {
  const sorted = Object.entries(thresholds).sort(([, a], [, b]) => b - a);
  return sorted.find(([, min]) => rating >= min)?.[0] ?? 'PAWN';
}

/** "Knight III" 형식의 티어+서브티어 문자열 반환 */
function getTierWithSubTier(
  rating: number,
  thresholds: Record<string, number>,
  platform?: 'LICHESS' | 'CHESSCOM'
): string {
  const tier = getTierForRating(rating, thresholds);
  const subTiers = platform === 'CHESSCOM'
    ? CHESSCOM_SUBTIERS[tier]
    : LICHESS_SUBTIERS[tier];

  if (!subTiers) return TIER_CONFIG[tier]?.label ?? tier;

  let sub = 5;
  for (const [s, [mn, mx]] of Object.entries(subTiers)) {
    if (rating >= mn && rating <= mx) { sub = parseInt(s); break; }
  }
  return `${TIER_CONFIG[tier]?.label ?? tier} ${ROMAN[sub] ?? 'V'}`;
}

// ── 컴포넌트 ──────────────────────────────────────────────────────────

const MonthlyRatingHistoryChart = ({
  ratingHistory,
  tierThresholds = DEFAULT_TIER_THRESHOLDS,
  isLoading = false,
  platform,
}: MonthlyRatingHistoryChartProps) => {
  const { language } = useLanguage();
  const isKR = language === 'KR';

  const [chartData, setChartData] = useState<any>(null);
  const [rawYearMonths, setRawYearMonths] = useState<string[]>([]);
  const [summary, setSummary] = useState<{
    current: number;
    change: number;
    tierLabel: string;   // "Knight III"
    tierKey: string;     // "KNIGHT"
    period: string;
  } | null>(null);

  useEffect(() => {
    if (!ratingHistory?.data?.length) return;

    const sorted = ratingHistory.data
      .filter((e) => !!e.yearMonth && parseYearMonth(e.yearMonth) !== null)
      .sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

    if (sorted.length === 0) return;

    const labels       = sorted.map((e) => formatLabel(e.yearMonth) ?? e.yearMonth);
    const ratings      = sorted.map((e) => e.rating ?? 0);
    setRawYearMonths(sorted.map((e) => e.yearMonth));

    const current    = ratings[ratings.length - 1];
    const change     = current - ratings[0];
    const tierKey    = getTierForRating(current, tierThresholds);
    const tierLabel  = getTierWithSubTier(current, tierThresholds, platform);
    const period     = formatPeriod(
      ratingHistory.from || sorted[0].yearMonth,
      ratingHistory.to   || sorted[sorted.length - 1].yearMonth,
      isKR
    );

    setSummary({ current, change, tierLabel, tierKey, period });

    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);

    const tierLines = Object.entries(tierThresholds)
      .filter(([, v]) => v >= minRating - 100 && v <= maxRating + 300)
      .map(([name, value]) => ({
        label: `__tier__${name}`,
        data: labels.map(() => value),
        borderColor: TIER_CONFIG[name]?.color.replace(', 1)', ', 0.2)') ?? 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderDash: [3, 6],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0,
        order: 1,
      }));

    setChartData({
      labels,
      datasets: [
        ...tierLines,
        {
          label: 'rating',
          data: ratings,
          borderColor: 'rgba(210, 220, 245, 0.9)',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.25,
          pointRadius: 4,
          pointHitRadius: 16,
          pointBackgroundColor: ratings.map(
            (r) => TIER_CONFIG[getTierForRating(r, tierThresholds)]?.color ?? 'white'
          ),
          pointBorderColor: 'rgba(8, 15, 28, 0.8)',
          pointBorderWidth: 1.5,
          pointHoverRadius: 7,
          pointHoverBorderColor: 'rgba(255,255,255,0.6)',
          pointHoverBorderWidth: 2,
          pointHoverBackgroundColor: ratings.map(
            (r) => TIER_CONFIG[getTierForRating(r, tierThresholds)]?.color ?? 'white'
          ),
          borderWidth: 1.5,
          order: 0,
        },
      ],
    });
  }, [ratingHistory, tierThresholds, platform, isKR]);

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(6, 12, 24, 0.97)',
        titleColor: 'rgba(255,255,255,0.9)',
        bodyColor: 'rgba(200,210,240,0.75)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: { x: 14, y: 10 },
        displayColors: false,
        filter: (item: any) => !String(item.dataset.label).startsWith('__tier__'),
        callbacks: {
          title: (items: any[]) => {
            const idx = items[0]?.dataIndex;
            const ym  = typeof idx === 'number' ? rawYearMonths[idx] : undefined;
            return ym ? formatTooltipTitle(ym, isKR) : (items[0]?.label ?? '');
          },
          label: (item: any) => {
            const rating = item.parsed.y as number;
            const label  = getTierWithSubTier(rating, tierThresholds, platform);
            return `${rating}  ·  ${label}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: { color: 'rgba(255,255,255,0.2)', font: { size: 10 }, maxTicksLimit: 6 },
        grid:  { color: 'rgba(255,255,255,0.04)', drawBorder: false },
        border: { display: false },
      },
      x: {
        ticks: { color: 'rgba(255,255,255,0.2)', font: { size: 10 }, maxTicksLimit: 9, maxRotation: 0 },
        grid:  { display: false },
        border: { display: false },
      },
    },
    interaction: { mode: 'index', intersect: false },
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-white/30 text-sm">
          {isKR ? '불러오는 중...' : 'Loading...'}
        </p>
      </div>
    );
  }

  if (!ratingHistory?.data?.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
        <div className="flex gap-1 text-4xl select-none opacity-15">
          <span>♟</span><span>♞</span><span>♝</span><span>♜</span><span>♛</span><span>♚</span>
        </div>
        <p className="text-white/30 text-sm">{isKR ? '레이팅 히스토리가 없습니다' : 'No rating history'}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      {/* 요약 헤더 */}
      {summary && (
        <div className="flex items-end justify-between gap-3 mb-4 px-1 flex-shrink-0">
          <div className="flex items-end gap-3">
            {/* 현재 레이팅 */}
            <span className="text-4xl font-bold text-white tabular-nums leading-none">
              {summary.current}
            </span>
            <div className="flex items-center gap-2 mb-0.5">
              {/* 티어 + 서브티어 — 티어 색상 적용 */}
              <span
                className="text-sm font-semibold"
                style={{ color: TIER_CONFIG[summary.tierKey]?.color ?? 'rgba(255,255,255,0.5)' }}
              >
                {summary.tierLabel}
              </span>
              {/* 변화량 */}
              <span
                className={`text-sm font-semibold ${
                  summary.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {summary.change >= 0 ? '+' : ''}{summary.change}
              </span>
            </div>
          </div>
          {/* 기간 */}
          {summary.period && (
            <span className="text-white/25 text-xs mb-0.5 flex-shrink-0">
              {summary.period}
            </span>
          )}
        </div>
      )}

      {/* 차트 */}
      <div className="flex-1 min-h-0">
        {chartData && <Line data={chartData} options={options} />}
      </div>

      {/* 티어 컬러 레전드 */}
      {chartData && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 px-1 flex-shrink-0">
          {Object.entries(TIER_CONFIG).map(([name, { color, label }]) => (
            <div key={name} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-white/22 text-[10px]">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthlyRatingHistoryChart;
