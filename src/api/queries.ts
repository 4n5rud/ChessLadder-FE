import { useQuery } from '@tanstack/react-query';
import { getRatingHistory } from './lichessService';

/**
 * 레이팅 히스토리를 캐싱하면서 조회하는 커스텀 훅
 * LocalStorage에 캐시되어 브라우저 재시작 후에도 즉시 로드 가능
 * staleTime이 지나면 백그라운드에서 자동으로 업데이트
 */
export const useRatingHistory = (username: string, gameType: string = 'RAPID') => {
    return useQuery({
        queryKey: ['ratingHistory', username, gameType],
        queryFn: () => getRatingHistory(username, gameType),
        staleTime: 1000 * 60 * 10, // 10분 동안 fresh 상태
        gcTime: 1000 * 60 * 60, // 1시간 후 메모리에서 제거
        enabled: !!username, // username이 있을 때만 요청
        retry: 2, // 실패 시 2회 재시도
    });
};
