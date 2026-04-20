/**
 * 커뮤니티 섹션 (Discord, 기부 등)
 */
export function CommunitySection() {
    return (
        <>
            {/* Discord 섹션 */}
            <div className="w-full bg-[#0a1f33]">
                <div className="flex flex-col pt-20 pb-20 px-4 max-w-6xl mx-auto text-white">
                    <h2 className="text-4xl font-bold mb-4">디스코드 링크</h2>
                    <a 
                        href="https://discord.gg/9NeVdmYewQ" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105 w-fit"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.211.375-.444.864-.607 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.386-.395-.875-.607-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.975 14.975 0 0 0 1.293-2.1a.07.07 0 0 0-.038-.098a13.11 13.11 0 0 1-1.872-.892a.072.072 0 0 1-.007-.12a10.15 10.15 0 0 0 .372-.294a.074.074 0 0 1 .076-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .076.01c.12.098.246.198.373.294a.072.072 0 0 1-.006.12a12.98 12.98 0 0 1-1.873.892a.07.07 0 0 0-.037.099a14.992 14.992 0 0 0 1.293 2.1a.074.074 0 0 0 .084.028a19.963 19.963 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.057c.5-4.569-.838-8.54-3.549-12.267a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-.965-2.157-2.156c0-1.193.966-2.157 2.157-2.157c1.193 0 2.157.964 2.157 2.157c0 1.19-.964 2.156-2.157 2.156zm7.975 0c-1.183 0-2.157-.965-2.157-2.156c0-1.193.966-2.157 2.157-2.157c1.193 0 2.157.964 2.157 2.157c0 1.19-.964 2.156-2.157 2.156z"/>
                        </svg>
                        Discord 참여하기
                    </a>
                </div>
            </div>

            {/* 기부 섹션 */}
            <div className="w-full bg-[#0a1f33]">
                <div className="flex flex-col pt-20 pb-20 px-4 max-w-6xl mx-auto text-white">
                    <h2 className="text-4xl font-bold mb-4">개발자에게 서버비 기부하기</h2>
                    <a 
                        href="https://donate.chessmatelink" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-[#86ABD7] hover:bg-[#6a99c4] text-white font-bold py-3 px-8 rounded-full shadow-lg transition transform hover:scale-105 w-fit"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                        </svg>
                        기부하기
                    </a>
                </div>
            </div>
        </>
    );
}
