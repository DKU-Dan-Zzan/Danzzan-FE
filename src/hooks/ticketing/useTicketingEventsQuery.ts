// 역할: Ticketing Events 서버 상태 조회와 캐시 정책을 캡슐화한 훅이다.

import { ticketApi } from "@/api/ticketing/ticketApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";

export const useTicketingEventsQuery = (enabled = true) => {
  return useAppQuery({
    queryKey: appQueryKeys.ticketingEvents(),
    enabled,
    queryFn: () => ticketApi.getTicketingEvents(),
    staleTime: 30_000,
  });
};
