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
