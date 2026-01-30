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
    const gameTypeColors: { [key: string]: { btn: string; activeBg: string; activeBorder: string; text: string } } = {
        'BULLET': { btn: 'border-orange-200 text-orange-700 hover:bg-orange-50', activeBg: 'bg-orange-500', activeBorder: 'border-orange-500', text: 'text-white' },
        'BLITZ': { btn: 'border-yellow-200 text-yellow-700 hover:bg-yellow-50', activeBg: 'bg-yellow-500', activeBorder: 'border-yellow-500', text: 'text-white' },
        'RAPID': { btn: 'border-green-200 text-green-700 hover:bg-green-50', activeBg: 'bg-green-500', activeBorder: 'border-green-500', text: 'text-white' },
        'CLASSICAL': { btn: 'border-blue-200 text-blue-700 hover:bg-blue-50', activeBg: 'bg-blue-500', activeBorder: 'border-blue-500', text: 'text-white' }
    };

    const gameImageMap: { [key: string]: string } = {
        'BULLET': 'bullet.webp',
        'BLITZ': 'blitz.webp',
        'RAPID': 'rapid.webp',
        'CLASSICAL': 'classical.webp'
    };

    return (
        <div className="max-w-6xl mx-auto px-6 mb-8 section-spacing">
            <div className="flex flex-wrap gap-3 button-group">
                {gameTypes.map((type) => {
                    const colors = gameTypeColors[type] || gameTypeColors['BULLET'];
                    const isActive = selectedGameType === type;
                    
                    return (
                        <button
                            key={type}
                            onClick={() => onGameTypeChange(type)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all duration-200 border-2 ${
                                isActive
                                    ? `${colors.activeBg} ${colors.activeBorder} ${colors.text} shadow-lg transform scale-105`
                                    : `border-gray-300 text-gray-700 bg-white hover:bg-gray-50`
                            }`}
                        >
                            <img
                                src={new URL(`../assets/images/logo/game/${gameImageMap[type]}`, import.meta.url).href}
                                alt={type}
                                className="w-5 h-5 object-contain"
                            />
                            {gameTypeDisplayNames[type]}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
