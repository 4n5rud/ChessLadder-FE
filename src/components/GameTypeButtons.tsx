interface GameTypeButtonsProps {
    gameTypes: string[];
    selectedGameType: string;
    gameTypeDisplayNames: { [key: string]: string };
    onGameTypeChange: (type: string) => void;
}

export const GameTypeButtons = ({
    gameTypes,
    selectedGameType,
    gameTypeDisplayNames,
    onGameTypeChange
}: GameTypeButtonsProps) => {
    const gameTypeAccent: { [key: string]: { ring: string; glow: string; text: string } } = {
        'BULLET': { ring: 'rgba(251,146,60,0.45)', glow: 'rgba(251,146,60,0.22)', text: 'rgba(254,215,170,1)' },
        'BLITZ': { ring: 'rgba(250,204,21,0.45)', glow: 'rgba(250,204,21,0.20)', text: 'rgba(254,240,138,1)' },
        'RAPID': { ring: 'rgba(74,222,128,0.45)', glow: 'rgba(74,222,128,0.20)', text: 'rgba(187,247,208,1)' },
        'CLASSICAL': { ring: 'rgba(96,165,250,0.45)', glow: 'rgba(96,165,250,0.22)', text: 'rgba(191,219,254,1)' }
    };

    const gameImageMap: { [key: string]: string } = {
        'BULLET': 'bullet.webp',
        'BLITZ': 'blitz.webp',
        'RAPID': 'rapid.webp',
        'CLASSICAL': 'classical.webp'
    };

    return (
        <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
            <div
                className="flex flex-wrap gap-2 md:gap-3 p-2 rounded-2xl border"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                    borderColor: 'rgba(255,255,255,0.10)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                {gameTypes.map((type) => {
                    const accent = gameTypeAccent[type] || gameTypeAccent['BULLET'];
                    const isActive = selectedGameType === type;
                    
                    return (
                        <button
                            key={type}
                            onClick={() => onGameTypeChange(type)}
                            className="group flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 border"
                            style={
                                isActive
                                    ? {
                                        color: accent.text,
                                        borderColor: accent.ring,
                                        background: `linear-gradient(135deg, ${accent.glow}, rgba(255,255,255,0.04))`,
                                        boxShadow: `0 0 0 1px ${accent.ring} inset, 0 8px 22px rgba(0,0,0,0.32)`,
                                        transform: 'translateY(-1px)',
                                    }
                                    : {
                                        color: 'rgba(255,255,255,0.70)',
                                        borderColor: 'rgba(255,255,255,0.10)',
                                        background: 'rgba(255,255,255,0.03)',
                                    }
                            }
                        >
                            <div
                                className="w-6 h-6 rounded-md flex items-center justify-center"
                                style={{ background: isActive ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)' }}
                            >
                                <img
                                    src={new URL(`../assets/images/logo/game/${gameImageMap[type]}`, import.meta.url).href}
                                    alt={type}
                                    className="w-4 h-4 object-contain"
                                />
                            </div>
                            <span className="tracking-wide">{gameTypeDisplayNames[type]}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
