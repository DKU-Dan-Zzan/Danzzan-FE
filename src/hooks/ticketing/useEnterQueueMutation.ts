import { ticketApi } from "@/api/ticketing/ticketApi";
import { useAppMutation } from "@/lib/query";

export const useEnterQueueMutation = () => {
  return useAppMutation({
    mutationFn: async (eventId: string) => ticketApi.enterTicketQueue(eventId),
  });
};
