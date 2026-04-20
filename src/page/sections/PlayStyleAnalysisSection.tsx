/**
 * 플레이 스타일 분석 섹션
 */
export function PlayStyleAnalysisSection() {
    return (
        <div className="w-full bg-[#0a1f33]">
            <div className="flex flex-col pt-20 pb-20 px-4 max-w-6xl mx-auto text-white">
                <h2 className="text-4xl font-bold mb-8">사용자의 플레이 스타일 분석</h2>
                
                <div className="flex flex-col md:flex-row gap-8 items-center">
                    {/* 왼쪽 - 이미지 */}
                    <div className="flex-1 flex justify-center px">
                        <div className="bg-white/10 rounded-lg p-8 backdrop-blur-sm w-full h-64 flex items-center justify-center">
                            {/* 이미지 추후 추가 */}
                        </div>
                    </div>
                    
                    {/* 오른쪽 - 설명 */}
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-4">당신의 체스 실력을 분석하세요</h3>
                        <p className="text-lg text-white/90 mb-6">
                            설명 내용이 들어갈 영역입니다.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
