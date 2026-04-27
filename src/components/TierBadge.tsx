import type { TierKey } from '../utils/tierUtils';
import pawnImg   from '../assets/images/tier/pawn.png';
import knightImg from '../assets/images/tier/knight.png';
import bishopImg from '../assets/images/tier/vishop.png';
import rookImg   from '../assets/images/tier/rook.png';
import queenImg  from '../assets/images/tier/queen.png';
import kingImg   from '../assets/images/tier/king.png';

const TIER_IMAGES: Record<TierKey, string> = {
  PAWN: pawnImg, KNIGHT: knightImg, BISHOP: bishopImg,
  ROOK: rookImg, QUEEN: queenImg,   KING: kingImg,
};

const TIER_GRAD: Record<TierKey, { hi: string; lo: string }> = {
  PAWN:   { hi: '#4ade80', lo: '#166534' },
  KNIGHT: { hi: '#60a5fa', lo: '#1e3a8a' },
  BISHOP: { hi: '#c084fc', lo: '#6b21a8' },
  ROOK:   { hi: '#f87171', lo: '#991b1b' },
  QUEEN:  { hi: '#fb923c', lo: '#9a3412' },
  KING:   { hi: '#fbbf24', lo: '#92400e' },
};

type Size = 'xs' | 'sm' | 'lg' | 'xl';

const SIZE_MAP: Record<Size, {
  h: number; img: number; roman: number;
  topBar: number; padX: number; padY: number; r: number; gap: number;
}> = {
  xs: { h: 28,  img: 16, roman: 12, topBar: 2, padX: 6,  padY: 4,  r: 7,  gap: 6  },
  sm: { h: 38,  img: 22, roman: 15, topBar: 2, padX: 8,  padY: 6,  r: 10, gap: 8  },
  lg: { h: 72,  img: 48, roman: 30, topBar: 3, padX: 14, padY: 10, r: 16, gap: 12 },
  xl: { h: 100, img: 68, roman: 42, topBar: 4, padX: 20, padY: 14, r: 20, gap: 16 },
};

interface TierBadgeProps {
  tier: TierKey;
  subRoman: string;
  size?: Size;
  className?: string;
  style?: React.CSSProperties;
}

export function TierBadge({ tier, subRoman, size = 'sm', className, style }: TierBadgeProps) {
  const s = SIZE_MAP[size];
  const g = TIER_GRAD[tier];

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: s.gap,
        height: s.h,
        paddingTop: s.padY + s.topBar,
        paddingBottom: s.padY,
        paddingLeft: s.padX,
        paddingRight: s.padX + 2,
        borderRadius: s.r,
        overflow: 'hidden',
        flexShrink: 0,
        background: `linear-gradient(110deg, ${g.hi}26 0%, ${g.lo}18 45%, #06101e 100%)`,
        border: `1px solid ${g.hi}50`,
        boxShadow: `0 0 20px ${g.hi}1c, 0 4px 14px rgba(0,0,0,0.55), inset 0 1px 0 ${g.hi}28`,
        ...style,
      }}
    >
      {/* Top accent bar */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: s.topBar,
        background: `linear-gradient(90deg, ${g.hi}ee, ${g.hi}88, ${g.lo}66)`,
      }} />

      {/* Subtle left-area glow behind image */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '55%',
        height: '100%',
        background: `linear-gradient(90deg, ${g.hi}16, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Top-left shine */}
      <div style={{
        position: 'absolute',
        top: s.topBar, left: 0, right: 0,
        height: '50%',
        background: `linear-gradient(180deg, ${g.hi}10 0%, transparent 100%)`,
        pointerEvents: 'none',
      }} />

      {/* Tier image */}
      <img
        src={TIER_IMAGES[tier]}
        alt={tier}
        style={{
          width: s.img,
          height: s.img,
          objectFit: 'contain',
          filter: `drop-shadow(0 1px ${size === 'lg' || size === 'xl' ? 10 : 4}px ${g.hi}aa)`,
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
        }}
      />

      {/* Vertical separator */}
      <div style={{
        width: 1,
        height: '55%',
        background: `linear-gradient(180deg, transparent, ${g.hi}55, transparent)`,
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
      }} />

      {/* Roman numeral */}
      <span style={{
        fontSize: s.roman,
        fontWeight: 900,
        lineHeight: 1,
        letterSpacing: '0.04em',
        background: `linear-gradient(160deg, ${g.hi} 0%, ${g.hi}bb 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        position: 'relative',
        zIndex: 1,
        flexShrink: 0,
      }}>
        {subRoman}
      </span>
    </div>
  );
}
