import { useState, useEffect } from 'react';
import { api } from '../../api/apiClient';

export function UserListSection() {
    const [count, setCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserCount = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await api('/user/count');
                const userCount = data.count !== undefined ? data.count : (data.data?.count || 0);
                setCount(userCount);
            } catch (err) {
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
