// 역할: 내 티켓 목록 서버 상태 조회와 캐시 정책을 캡슐화한 훅입니다.
import { ticketApi } from "@/api/ticketing/ticketApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";

export const useMyTicketsQuery = (enabled = true) => {
  return useAppQuery({
    queryKey: appQueryKeys.myTicketList(),
    enabled,
    queryFn: ({ signal }) => ticketApi.getMyTickets({ signal }),
    staleTime: 30_000,
  });
};
