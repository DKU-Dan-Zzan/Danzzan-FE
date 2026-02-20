import { useCallback, useState } from "react";
import { ticketApi } from "@/api/ticketApi";
import type {
  Ticket,
  TicketingEvent,
  TicketReservationResult,
} from "@/types/model/ticket.model";

export const useTicketing = () => {
  const [loading, setLoading] = useState(false);
  const [reservationLoading, setReservationLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const normalizeError = (err: unknown): Error => {
    if (err instanceof Error) {
      return err;
    }
    return new Error("알 수 없는 오류가 발생했습니다.");
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
    async (
      eventId: string,
      acknowledgementText: string,
    ): Promise<TicketReservationResult | null> => {
      setReservationLoading(true);
      setError(null);
      try {
        return await ticketApi.reserveTicket(eventId, { captcha: acknowledgementText });
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
