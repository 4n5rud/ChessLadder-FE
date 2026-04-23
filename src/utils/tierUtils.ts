export type Platform = 'LICHESS' | 'CHESSCOM';
export type TierKey = 'PAWN' | 'KNIGHT' | 'BISHOP' | 'ROOK' | 'QUEEN' | 'KING';

export const TIER_ORDER: TierKey[] = ['PAWN', 'KNIGHT', 'BISHOP', 'ROOK', 'QUEEN', 'KING'];

type SubTierMap = Record<number, [number, number]>; // sub number (1=highest, 5=lowest) → [min, max]

export type TierRanges = Record<TierKey, { subTiers: SubTierMap }>;

export const LICHESS_TIER_RANGES: TierRanges = {
  PAWN:   { subTiers: { 5:[400,500],   4:[501,600],  3:[601,700],  2:[701,800],  1:[801,900]   } },
  KNIGHT: { subTiers: { 5:[901,960],   4:[961,1020], 3:[1021,1080],2:[1081,1140],1:[1141,1200] } },
  BISHOP: { subTiers: { 5:[1201,1260], 4:[1261,1320],3:[1321,1380],2:[1381,1440],1:[1441,1500] } },
  ROOK:   { subTiers: { 5:[1501,1560], 4:[1561,1620],3:[1621,1680],2:[1681,1740],1:[1741,1800] } },
  QUEEN:  { subTiers: { 5:[1801,1860], 4:[1861,1920],3:[1921,1980],2:[1981,2040],1:[2041,2100] } },
  KING:   { subTiers: { 5:[2101,2220], 4:[2221,2340],3:[2341,2460],2:[2461,2580],1:[2581,2700] } },
};

export const CHESSCOM_TIER_RANGES: TierRanges = {
  PAWN:   { subTiers: { 5:[100,220],   4:[221,340],  3:[341,460],  2:[461,580],  1:[581,700]   } },
  KNIGHT: { subTiers: { 5:[701,780],   4:[781,860],  3:[861,940],  2:[941,1020], 1:[1021,1100] } },
  BISHOP: { subTiers: { 5:[1101,1180], 4:[1181,1260],3:[1261,1340],2:[1341,1420],1:[1421,1500] } },
  ROOK:   { subTiers: { 5:[1501,1560], 4:[1561,1620],3:[1621,1680],2:[1681,1740],1:[1741,1800] } },
  QUEEN:  { subTiers: { 5:[1801,1880], 4:[1881,1960],3:[1961,2040],2:[2041,2120],1:[2121,2200] } },
  KING:   { subTiers: { 5:[2201,2320], 4:[2321,2440],3:[2441,2560],2:[2561,2680],1:[2681,2800] } },
};

export const LICHESS_PROMOTION_THRESHOLDS: Record<TierKey, number> = {
  PAWN: 400, KNIGHT: 901, BISHOP: 1201, ROOK: 1501, QUEEN: 1801, KING: 2101,
};

export const CHESSCOM_PROMOTION_THRESHOLDS: Record<TierKey, number> = {
  PAWN: 100, KNIGHT: 701, BISHOP: 1101, ROOK: 1501, QUEEN: 1801, KING: 2201,
};

export const SUB_ROMAN: Record<number, string> = { 1:'Ⅰ', 2:'Ⅱ', 3:'Ⅲ', 4:'Ⅳ', 5:'Ⅴ' };

export interface TierInfo {
  tier: TierKey;
  subNum: number;
  subRoman: string;
  levelMin: number;
  levelMax: number;
}

export function getTierRanges(platform: Platform = 'LICHESS'): TierRanges {
  return platform === 'CHESSCOM' ? CHESSCOM_TIER_RANGES : LICHESS_TIER_RANGES;
}

export function getPromotionThresholds(platform: Platform = 'LICHESS'): Record<TierKey, number> {
  return platform === 'CHESSCOM' ? CHESSCOM_PROMOTION_THRESHOLDS : LICHESS_PROMOTION_THRESHOLDS;
}

export function getTierInfo(rating: number, platform: Platform = 'LICHESS'): TierInfo {
  const ranges = getTierRanges(platform);

  for (const tier of TIER_ORDER) {
    for (let sub = 1; sub <= 5; sub++) {
      const [mn, mx] = ranges[tier].subTiers[sub];
      if (rating >= mn && rating <= mx) {
        return { tier, subNum: sub, subRoman: SUB_ROMAN[sub], levelMin: mn, levelMax: mx };
      }
    }
  }

  // Above KING I max → clamp to KING I
  const kingI = ranges.KING.subTiers[1];
  if (rating > kingI[1]) {
    return { tier: 'KING', subNum: 1, subRoman: 'I', levelMin: kingI[0], levelMax: kingI[1] };
  }

  // Below PAWN V min → clamp to PAWN V
  const pawnV = ranges.PAWN.subTiers[5];
  return { tier: 'PAWN', subNum: 5, subRoman: 'V', levelMin: pawnV[0], levelMax: pawnV[1] };
}

export function getTierName(rating: number, platform: Platform = 'LICHESS'): TierKey {
  return getTierInfo(rating, platform).tier;
}

export const TIER_COLOR_SCHEME: Record<TierKey, { mainColor: string; borderColor: string; darkText: string; lightText: string; darkBg: string; lightBg: string }> = {
  PAWN:   { mainColor: 'rgba(34,197,94,0.85)',   borderColor: 'rgba(34,197,94,0.25)',   darkText: 'rgba(74,222,128,1)',   lightText: 'rgba(34,197,94,0.65)',  darkBg: 'rgba(34,197,94,0.11)',   lightBg: 'rgba(34,197,94,0.07)'   },
  KNIGHT: { mainColor: 'rgba(59,130,246,0.85)',  borderColor: 'rgba(59,130,246,0.25)',  darkText: 'rgba(96,165,250,1)',   lightText: 'rgba(59,130,246,0.65)', darkBg: 'rgba(59,130,246,0.11)',  lightBg: 'rgba(59,130,246,0.07)'  },
  BISHOP: { mainColor: 'rgba(168,85,247,0.80)',  borderColor: 'rgba(168,85,247,0.25)',  darkText: 'rgba(192,132,252,1)',  lightText: 'rgba(168,85,247,0.65)', darkBg: 'rgba(168,85,247,0.11)',  lightBg: 'rgba(168,85,247,0.07)'  },
  ROOK:   { mainColor: 'rgba(239,68,68,0.85)',   borderColor: 'rgba(239,68,68,0.25)',   darkText: 'rgba(248,113,113,1)',  lightText: 'rgba(239,68,68,0.65)',  darkBg: 'rgba(239,68,68,0.11)',   lightBg: 'rgba(239,68,68,0.07)'   },
  QUEEN:  { mainColor: 'rgba(255,140,0,0.85)',   borderColor: 'rgba(255,140,0,0.25)',   darkText: 'rgba(251,146,60,1)',   lightText: 'rgba(255,140,0,0.65)',  darkBg: 'rgba(255,140,0,0.11)',   lightBg: 'rgba(255,140,0,0.07)'   },
  KING:   { mainColor: 'rgba(255,215,0,0.85)',   borderColor: 'rgba(255,215,0,0.28)',   darkText: 'rgba(251,191,36,1)',   lightText: 'rgba(234,179,8,0.65)',  darkBg: 'rgba(255,215,0,0.11)',   lightBg: 'rgba(255,215,0,0.07)'   },
};
