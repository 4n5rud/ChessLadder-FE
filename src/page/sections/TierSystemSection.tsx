import { useState } from 'react';

interface TierData {
    name: string;
    range: string;
    icon: string;
    color: string;
    levels: { level: string; min: number; max: number | string }[];
}

/**
 * 티어 시스템 설명 섹션
 */
export function TierSystemSection() {
    const [selectedTier, setSelectedTier] = useState<string | null>('KNIGHT');

    const tierData: TierData[] = [
        {
            name: 'PAWN',
            range: '400~900',
            icon: '/src/assets/images/tier/pawn.png',
            color: 'from-[#C0A060] to-[#A0805F]',
            levels: [
                {level: 'V', min: 400, max: 500},
                {level: 'IV', min: 501, max: 600},
                {level: 'III', min: 601, max: 700},
                {level: 'II', min: 701, max: 800},
                {level: 'I', min: 801, max: 900},
            ]
        },
        {
            name: 'KNIGHT',
            range: '901~1200',
            icon: '/src/assets/images/tier/knight.png',
            color: 'from-[#7CA0D0] to-[#5C80B0]',
            levels: [
                {level: 'V', min: 901, max: 960},
                {level: 'IV', min: 961, max: 1020},
                {level: 'III', min: 1021, max: 1080},
                {level: 'II', min: 1081, max: 1140},
                {level: 'I', min: 1141, max: 1200},
            ]
        },
        {
            name: 'BISHOP',
            range: '1201~1500',
            icon: '/src/assets/images/tier/vishop.png',
            color: 'from-[#BFA7D2] to-[#9F87B2]',
            levels: [
                {level: 'V', min: 1201, max: 1260},
                {level: 'IV', min: 1261, max: 1320},
                {level: 'III', min: 1321, max: 1380},
                {level: 'II', min: 1381, max: 1440},
                {level: 'I', min: 1441, max: 1500},
            ]
        },
        {
            name: 'ROOK',
            range: '1501~1800',
            icon: '/src/assets/images/tier/rook.png',
            color: 'from-[#E6B7C2] to-[#C697A2]',
            levels: [
                {level: 'V', min: 1501, max: 1560},
                {level: 'IV', min: 1561, max: 1620},
                {level: 'III', min: 1621, max: 1680},
                {level: 'II', min: 1681, max: 1740},
                {level: 'I', min: 1741, max: 1800},
            ]
        },
        {
            name: 'QUEEN',
            range: '1801~2100',
            icon: '/src/assets/images/tier/queen.png',
            color: 'from-[#F5D06F] to-[#D5B04F]',
            levels: [
                {level: 'V', min: 1801, max: 1860},
                {level: 'IV', min: 1861, max: 1920},
                {level: 'III', min: 1921, max: 1980},
                {level: 'II', min: 1981, max: 2040},
                {level: 'I', min: 2041, max: 2100},
            ]
        },
        {
            name: 'KING',
            range: '2101~2700+',
            icon: '/src/assets/images/tier/king.png',
            color: 'from-[#F7E08C] to-[#D7C06C]',
            levels: [
                {level: 'V', min: 2101, max: 2220},
                {level: 'IV', min: 2221, max: 2340},
                {level: 'III', min: 2341, max: 2460},
                {level: 'II', min: 2461, max: 2580},
                {level: 'I', min: 2581, max: '2700+'},
            ]
        },
    ];

    return (
        <div className="w-full" style={{background: 'linear-gradient(to bottom, transparent 0%, #0a1f33 10%, #0a1f33 100%)'}}>
            <div className="flex flex-col pt-100 pb-20 px-4 max-w-6xl mx-auto text-white">
                <h2 className="text-4xl font-bold mb-4">ChessMate 티어 시스템</h2>
                <p className="text-lg mb-8 text-white/90 font-semibold">ChessMate는 기존의 지루한 레이팅 시스템에서 벗어난 6가지의 티어 시스템을 제공해요</p>
                
                {/* Tier icons - Button Style */}
                <div className="flex flex-row justify-between gap-4 mb-12 w-full flex-wrap">
                    {tierData.map(tier => (
                        <div 
                            key={tier.name} 
                            className="flex flex-col items-center cursor-pointer group flex-1 min-w-[100px]"
                            onClick={() => setSelectedTier(selectedTier === tier.name ? null : tier.name)}
                        >
                            <div className={`aspect-square w-full max-w-24 rounded-xl shadow-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105 border-2 ${selectedTier === tier.name ? 'border-white ring-2 ring-white' : 'border-white/30'}`} style={{background: `linear-gradient(135deg, ${tier.color.split(' ').slice(1).join(' ')})`}}>
                                <img src={tier.icon} alt={tier.name} className="w-12 h-16" />
                            </div>
                            <span className="text-sm font-semibold group-hover:text-yellow-300 text-center">{tier.name}</span>
                        </div>
                    ))}
                </div>

                {/* Selected Tier Details */}
                {selectedTier && (
                    <div className={`rounded-lg p-8 backdrop-blur-sm ${
                        selectedTier === 'PAWN' ? 'bg-[#A7F3D0]/20' :
                        selectedTier === 'KNIGHT' ? 'bg-[#93C5FD]/20' :
                        selectedTier === 'BISHOP' ? 'bg-[#C4B5FD]/20' :
                        selectedTier === 'ROOK' ? 'bg-[#FBCFE8]/20' :
                        selectedTier === 'QUEEN' ? 'bg-[#FED7AA]/20' :
                        selectedTier === 'KING' ? 'bg-[#FDE68A]/20' :
                        'bg-white/10'
                    }`}>
                        {tierData.find(t => t.name === selectedTier) && (
                            <>
                                <div className="flex items-center gap-4 mb-6">
                                    <img src={tierData.find(t => t.name === selectedTier)?.icon} alt={selectedTier} className="w-12 h-16" />
                                    <div>
                                        <h3 className="text-3xl font-bold">{selectedTier}</h3>
                                        <p className="text-lg text-white/80">{tierData.find(t => t.name === selectedTier)?.range}</p>
                                    </div>
                                </div>
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/30">
                                            <th className="pb-2 font-semibold">단계</th>
                                            <th className="pb-2 font-semibold">레이팅 범위</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tierData.find(t => t.name === selectedTier)?.levels.map(lv => (
                                            <tr key={lv.level} className="border-b border-white/10 hover:bg-white/5">
                                                <td className="py-2 font-semibold">{lv.level}</td>
                                                <td className="py-2">{lv.min} ~ {lv.max}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
