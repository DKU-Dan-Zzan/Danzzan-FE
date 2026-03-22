import { ticketApi } from "@/api/ticketing/ticketApi";
import { useAppMutation } from "@/lib/query";

export const useReserveTicketMutation = () => {
  return useAppMutation({
    mutationFn: async (eventId: string) => {
      await ticketApi.activateTicket(eventId);
      return ticketApi.reserveTicket(eventId);
    },
  });
};
