// 역할: Waiting Room Ad 서버 상태 조회와 캐시 정책을 캡슐화한 훅이다.

import { adApi } from "@/api/ticketing/adApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";

export const useWaitingRoomAdQuery = (enabled = true) => {
  return useAppQuery({
    queryKey: appQueryKeys.ticketingWaitingRoomAd(),
    enabled,
    queryFn: ({ signal }) => adApi.getPlacementAd("WAITING_ROOM_MAIN", signal),
    staleTime: 5 * 60_000,
  });
};
