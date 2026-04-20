import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { searchUsers, type UserSearchResult } from '../api/userService';
import lichessLogoImg from '../assets/images/logo/lichess-logo.png';
import chesscomLogoImg from '../assets/images/logo/chesscom-logo.png';

// ── Tier helpers ───────────────────────────────────────────────────────────────

const THRESHOLDS = [
  { key: 'KING',   min: 2101, color: 'rgba(255,215,0,1)',   bg: 'rgba(255,215,0,0.12)',   text: 'rgba(255,245,150,1)' },
  { key: 'QUEEN',  min: 1801, color: 'rgba(255,140,0,1)',   bg: 'rgba(255,140,0,0.12)',   text: 'rgba(255,190,120,1)' },
  { key: 'ROOK',   min: 1501, color: 'rgba(239,68,68,1)',   bg: 'rgba(239,68,68,0.12)',   text: 'rgba(255,170,170,1)' },
  { key: 'BISHOP', min: 1201, color: 'rgba(168,85,247,1)',  bg: 'rgba(168,85,247,0.12)',  text: 'rgba(220,170,255,1)' },
  { key: 'KNIGHT', min: 901,  color: 'rgba(59,130,246,1)',  bg: 'rgba(59,130,246,0.12)',  text: 'rgba(150,190,255,1)' },
  { key: 'PAWN',   min: 0,    color: 'rgba(34,197,94,1)',   bg: 'rgba(34,197,94,0.12)',   text: 'rgba(120,255,170,1)' },
] as const;

const TIER_IMAGES: Record<string, string> = {
  PAWN:   new URL('../assets/images/tier/pawn.png',   import.meta.url).href,
  KNIGHT: new URL('../assets/images/tier/knight.png', import.meta.url).href,
  BISHOP: new URL('../assets/images/tier/vishop.png', import.meta.url).href,
  ROOK:   new URL('../assets/images/tier/rook.png',   import.meta.url).href,
  QUEEN:  new URL('../assets/images/tier/queen.png',  import.meta.url).href,
  KING:   new URL('../assets/images/tier/king.png',   import.meta.url).href,
};

function getTier(rating: number) {
  return THRESHOLDS.find(t => rating >= t.min) ?? THRESHOLDS[THRESHOLDS.length - 1];
}

function getSubTierRoman(rating: number): string {
  const tierKey = getTier(rating).key;
  const ranges: Record<string, [number, number]> = {
    KING: [2101, 2700], QUEEN: [1801, 2100], ROOK: [1501, 1800],
    BISHOP: [1201, 1500], KNIGHT: [901, 1200], PAWN: [400, 900],
  };
  const [min, max] = ranges[tierKey] ?? [0, 1000];
  const size = (max - min) / 5;
  const part = Math.ceil((rating - min) / size);
  const sub = Math.max(1, Math.min(5, 6 - part));
  return (['I', 'II', 'III', 'IV', 'V'] as const)[sub - 1];
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  defaultPlatform?: 'LICHESS' | 'CHESSCOM';
}

export default function UserSearchBar({ defaultPlatform = 'LICHESS' }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<'LICHESS' | 'CHESSCOM'>(defaultPlatform);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [modalOpen, setModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // sync defaultPlatform prop
  useEffect(() => { setPlatform(defaultPlatform); }, [defaultPlatform]);

  // focus input & reset when modal opens/closes
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery('');
      setResults([]);
      setOpen(false);
      setActiveIdx(-1);
    }
  }, [modalOpen]);

  // ESC closes modal
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [modalOpen]);

  const doSearch = useCallback(async (q: string, plt: 'LICHESS' | 'CHESSCOM') => {
    if (q.length < 1) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const data = await searchUsers(q, plt);
      setResults(data);
      setOpen(true);
      setActiveIdx(-1);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 1) { setResults([]); setOpen(false); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => doSearch(val, platform), 320);
  };

  const handlePlatformToggle = (plt: 'LICHESS' | 'CHESSCOM') => {
    setPlatform(plt);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length >= 1) {
      setLoading(true);
      debounceRef.current = setTimeout(() => doSearch(query, plt), 200);
    }
  };

  const goToUser = (user: UserSearchResult) => {
    setOpen(false);
    setModalOpen(false);
    navigate(`/profile/${user.username}?platform=${user.platform}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setModalOpen(false); return; }
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { goToUser(results[activeIdx]); }
  };

  const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

  return (
    <>
      {/* ── Compact trigger bar in header ── */}
      <button
        onClick={() => setModalOpen(true)}
        className="flex items-center gap-2.5 h-9 px-3.5 rounded-lg transition flex-1 min-w-0 max-w-xs md:max-w-sm text-left"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <SearchIcon dim />
        <span className="text-white/30 text-[13px] font-medium truncate">Search players…</span>
        <span
          className="ml-auto hidden md:flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white/20 flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          /
        </span>
      </button>

      {/* ── Modal overlay ── */}
      {modalOpen && createPortal(
        <div
          className="fixed inset-0 flex flex-col items-center pt-16 md:pt-20 px-4 pb-8"
          style={{
            zIndex: 99999,
            background: 'rgba(0,0,0,0.70)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          {/* Panel */}
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: 'rgba(9,15,31,0.99)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
              animation: 'modalDropIn 0.18s ease-out',
              maxHeight: 'calc(100vh - 6rem)',
            }}
          >
            {/* Search header row */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Platform toggles */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {(['LICHESS', 'CHESSCOM'] as const).map(plt => (
                  <button
                    key={plt}
                    onClick={() => handlePlatformToggle(plt)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition text-xs font-bold"
                    style={{
                      background: platform === plt ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${platform === plt ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)'}`,
                      color: platform === plt ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: plt === 'CHESSCOM' ? '#81B64C' : '#ffffff' }}
                    >
                      <img src={plt === 'LICHESS' ? lichessLogoImg : chesscomLogoImg} alt={plt} className="w-2.5 h-2.5 object-contain" />
                    </div>
                    <span className="hidden sm:block">{plt === 'LICHESS' ? 'Lichess' : 'Chess.com'}</span>
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="relative flex-1 min-w-0">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  {loading ? <Spinner /> : <SearchIcon dim />}
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Search players…"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full h-10 pl-10 pr-9 text-sm font-medium text-white placeholder-white/25 rounded-lg outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    boxShadow: '0 0 0 3px rgba(59,130,246,0.10)',
                  }}
                />
                {query && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition"
                    onMouseDown={e => { e.preventDefault(); setQuery(''); setResults([]); setOpen(false); inputRef.current?.focus(); }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Close */}
              <button
                onClick={() => setModalOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/8 transition flex-shrink-0"
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1">
              {open ? (
                results.length === 0 && !loading ? (
                  <div className="px-5 py-10 text-center">
                    <p className="text-white/30 text-sm font-semibold">No players found</p>
                    <p className="text-white/15 text-xs mt-1">Try a different username or platform</p>
                  </div>
                ) : (
                  <ul>
                    {results.map((user, idx) => {
                      const tier = getTier(user.rating);
                      const sub  = getSubTierRoman(user.rating);
                      const isActive = idx === activeIdx;
                      return (
                        <li
                          key={user.id}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onMouseDown={e => { e.preventDefault(); goToUser(user); }}
                          className="relative cursor-pointer transition-colors"
                          style={{
                            background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                            borderBottom: idx < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          }}
                        >
                          {/* Tier accent bar */}
                          <div
                            className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
                            style={{ background: isActive ? tier.color : 'transparent', transition: 'background 0.15s' }}
                          />
                          <div className="flex items-center gap-4 px-5 py-3.5">
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <div
                                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
                                style={{ border: `2px solid ${tier.color}50`, background: 'rgba(255,255,255,0.06)' }}
                              >
                                {user.profileImageUrl ? (
                                  <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white/30 text-lg font-black">{user.username[0]?.toUpperCase()}</span>
                                )}
                              </div>
                              <div
                                className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: user.platform === 'CHESSCOM' ? '#81B64C' : '#ffffff', border: '1.5px solid rgba(9,15,31,1)' }}
                              >
                                <img src={user.platform === 'CHESSCOM' ? chesscomLogoImg : lichessLogoImg} alt="" className="w-2.5 h-2.5 object-contain" />
                              </div>
                            </div>

                            {/* Name & platform */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-bold truncate leading-tight">{user.username}</p>
                              <p className="text-white/30 text-[11px] font-medium uppercase tracking-wider leading-tight mt-0.5">
                                {user.platform === 'CHESSCOM' ? 'Chess.com' : 'Lichess'}
                              </p>
                            </div>

                            {/* Tier badge */}
                            <div
                              className="flex items-center gap-2 flex-shrink-0 px-3 py-2 rounded-xl"
                              style={{ background: tier.bg, border: `1px solid ${tier.color}30` }}
                            >
                              <img
                                src={TIER_IMAGES[tier.key]}
                                alt={tier.key}
                                className="w-5 h-5 object-contain flex-shrink-0"
                                style={{ filter: `drop-shadow(0 0 4px ${tier.color}80)` }}
                              />
                              <div className="text-right">
                                <div className="text-[12px] font-black leading-none" style={{ color: tier.text }}>
                                  {cap(tier.key)} <span className="opacity-70">{sub}</span>
                                </div>
                                <div className="text-[11px] font-bold tabular-nums leading-none mt-0.5 opacity-60" style={{ color: tier.text }}>
                                  {user.rating.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )
              ) : (
                /* Empty state — no query yet */
                <div className="px-5 py-10 text-center">
                  <div className="flex justify-center mb-3 opacity-20">
                    <SearchIcon />
                  </div>
                  <p className="text-white/20 text-sm">Type a username to search</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {open && results.length > 0 && (
              <div
                className="px-5 py-2.5 flex items-center justify-between flex-shrink-0"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-white/20 text-[10px] font-semibold uppercase tracking-wider">
                  {results.length} result{results.length > 1 ? 's' : ''}
                </span>
                <span className="text-white/15 text-[10px] font-medium">↑↓ navigate · ↵ open · esc close</span>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      <style>{`
        @keyframes modalDropIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
      `}</style>
    </>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function SearchIcon({ dim }: { dim?: boolean }) {
  const c = dim ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.45)';
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
      <circle cx="6" cy="6" r="4.5" stroke={c} />
      <path d="M9.5 9.5L12.5 12.5" stroke={c} />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="animate-spin">
      <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
      <path d="M7 1.5 A5.5 5.5 0 0 1 12.5 7" stroke="rgba(99,160,255,0.9)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
