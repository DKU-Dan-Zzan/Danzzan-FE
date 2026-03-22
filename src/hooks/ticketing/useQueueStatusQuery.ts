import { ticketApi } from "@/api/ticketing/ticketApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";

type UseQueueStatusQueryOptions = {
  enabled?: boolean;
};

export const useQueueStatusQuery = (
  eventId: string | null,
  options?: UseQueueStatusQueryOptions,
) => {
  const enabled = options?.enabled ?? Boolean(eventId);

  return useAppQuery({
    queryKey: appQueryKeys.ticketingQueueStatus(eventId ?? ""),
    enabled: enabled && Boolean(eventId),
    queryFn: ({ signal }) => {
      if (!eventId) {
        throw new Error("대기열 상태 조회 대상 이벤트가 없습니다.");
      }
      return ticketApi.getTicketQueueStatus(eventId, signal);
    },
    staleTime: 0,
  });
};
