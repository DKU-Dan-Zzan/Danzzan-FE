import { useCallback, useState } from "react";
import { ticketApi } from "@/ticketing/api/ticketApi";
import type {
  Ticket,
  TicketingEvent,
  TicketReservationResult,
} from "@/ticketing/types/model/ticket.model";

export const useTicketing = () => {
  const [loading, setLoading] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const normalizeError = (err: unknown): Error => {
    if (err instanceof Error) {
      return err;
    }
    return new Error("?????녿뒗 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.");
  };

  const getTicketingEvents = useCallback(async (): Promise<TicketingEvent[]> => {
    setLoading(true);
    setError(null);
    try {
      return await ticketApi.getTicketingEvents();
    } catch (err) {
      setError(normalizeError(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const reserveTicket = useCallback(
    async (eventId: string): Promise<TicketReservationResult | null> => {
      setReservationLoading(true);
      setError(null);
      try {
        return await ticketApi.reserveTicket(eventId);
      } catch (err) {
        setError(normalizeError(err));
        return null;
      } finally {
        setReservationLoading(false);
      }
    },
    [],
  );

  const getMyTickets = useCallback(async (): Promise<Ticket[]> => {
    setLoading(true);
    setError(null);
    try {
      return await ticketApi.getMyTickets();
    } catch (err) {
      setError(normalizeError(err));
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    reservationLoading,
    error,
    clearError,
    getTicketingEvents,
    reserveTicket,
    getMyTickets,
  };
};
