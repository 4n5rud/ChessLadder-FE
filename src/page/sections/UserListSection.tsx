import { useState, useEffect } from 'react';

/**
 * 최근 등록된 사용자 리스트 섹션
 * /api/user/count 에서 총 사용자 수 조회
 */
export function UserListSection() {
    const [count, setCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch('http://localhost:8080/api/user/count', {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`HTTP 오류: ${response.status}`);
                }

                const data = await response.json();
                console.log('사용자 수 API 응답:', data); // 디버깅용
                console.log('응답 타입:', typeof data);
                console.log('응답 키:', Object.keys(data));
                
                // 백엔드 응답 형식에 따라 유연하게 처리
                const userCount = data.count !== undefined ? data.count : (data.data?.count || 0);
                console.log('추출된 count:', userCount);
                
                setCount(userCount);
            } catch (err) {
                console.error('사용자 수 조회 오류:', err);
                setError(err instanceof Error ? err.message : '알 수 없는 오류');
                setCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchUserCount();
    }, []);

    if (loading) return <div className="text-center text-gray-500">유저 수 불러오는 중...</div>;
    if (error) return <div className="text-center text-red-500">유저 수 조회 오류: {error}</div>;
    
    return (
        <div className="text-center">
            <h2 className="text-xl font-bold mb-2">최근 등록된 유저 <span className="text-[#2F639D]">{count}+명</span></h2>
        </div>
    );
}
