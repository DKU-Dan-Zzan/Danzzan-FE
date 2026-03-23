// 역할: Wristband Stats 서버 상태 조회와 캐시 정책을 캡슐화한 훅이다.

import { wristbandApi } from "@/api/ticketing/wristbandApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";

export const useWristbandStatsQuery = (eventId: string | null) => {
  return useAppQuery({
    queryKey: appQueryKeys.ticketingWristbandStats(eventId ?? ""),
    enabled: Boolean(eventId),
    queryFn: ({ signal }) => {
      if (!eventId) {
        throw new Error("팔찌 통계 조회 대상 이벤트가 없습니다.");
      }
      return wristbandApi.getStats(eventId, { signal });
    },
    staleTime: 30_000,
  });
};
