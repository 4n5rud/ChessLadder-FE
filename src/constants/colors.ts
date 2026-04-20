// ── Tier colors — intentionally neutral, tier identity comes from images ──────
export const TIER_COLORS: Record<string, { gradient: string; main: string; light: string; border: string }> = {
  PAWN:   { gradient: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', main: 'rgba(255,255,255,0.55)', light: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' },
  KNIGHT: { gradient: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', main: 'rgba(255,255,255,0.55)', light: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' },
  BISHOP: { gradient: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', main: 'rgba(255,255,255,0.55)', light: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' },
  ROOK:   { gradient: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', main: 'rgba(255,255,255,0.55)', light: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' },
  QUEEN:  { gradient: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', main: 'rgba(255,255,255,0.55)', light: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' },
  KING:   { gradient: 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))', main: 'rgba(255,255,255,0.55)', light: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.10)' },
};

export const getTierColor = (tier: string) => TIER_COLORS[tier] ?? TIER_COLORS['PAWN'];

// ── Accent colors ─────────────────────────────────────────────────────────────
export const ACCENT_COLORS = {
  cyan:  '#00ffff',
  green: '#00ff41',
  blue:  '#2F639D',
  gold:  '#f5d26c',
};

// ── Background colors ─────────────────────────────────────────────────────────
export const BG_COLORS = {
  primary:   '#070d1a',
  secondary: '#0a1221',
  tertiary:  '#0d1829',
  card:      'rgba(255,255,255,0.04)',
};

// ── Text colors ───────────────────────────────────────────────────────────────
export const TEXT_COLORS = {
  primary:   '#ffffff',
  secondary: 'rgba(255,255,255,0.7)',
  tertiary:  'rgba(255,255,255,0.4)',
  muted:     'rgba(255,255,255,0.25)',
};

// ── Game type colors ──────────────────────────────────────────────────────────
export const GAME_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  RAPID:     { bg: 'bg-white/8',  text: 'text-white/70', border: 'border-white/12' },
  BLITZ:     { bg: 'bg-white/8',  text: 'text-white/70', border: 'border-white/12' },
  CLASSICAL: { bg: 'bg-white/8',  text: 'text-white/70', border: 'border-white/12' },
  BULLET:    { bg: 'bg-white/8',  text: 'text-white/70', border: 'border-white/12' },
};

// ── News type colors ──────────────────────────────────────────────────────────
export const NEWS_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  notice:  { bg: 'bg-blue-500/15',    text: 'text-blue-300',    border: 'border-blue-500/30' },
  update:  { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  fix:     { bg: 'bg-red-500/15',     text: 'text-red-300',     border: 'border-red-500/30' },
  feature: { bg: 'bg-purple-500/15',  text: 'text-purple-300',  border: 'border-purple-500/30' },
};
