// 역할: 내 티켓 목록 서버 상태 조회와 캐시 정책을 캡슐화한 훅입니다.
import { ticketApi } from "@/api/ticketing/ticketApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";
import { useSyncExternalStore } from "react";
import { authStore } from "@/store/common/authStore";

export const useMyTicketsQuery = (enabled = true) => {
  const epoch = useSyncExternalStore(authStore.subscribe, authStore.getSessionEpoch, authStore.getSessionEpoch);
  return useAppQuery({
    queryKey: appQueryKeys.myTicketList(epoch),
    enabled: enabled && Boolean(authStore.getAccessToken()),
    queryFn: ({ signal }) => ticketApi.getMyTickets({ signal }),
    staleTime: 30_000,
  });
};
