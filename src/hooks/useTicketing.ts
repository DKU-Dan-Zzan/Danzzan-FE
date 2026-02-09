import { useCallback, useState } from "react";
import { ticketApi } from "@/api/ticketApi";
import type { Ticket } from "@/types/model/ticket.model";

export const useTicketing = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getMyTickets = useCallback(async (): Promise<Ticket[]> => {
    setLoading(true);
    setError(null);
    try {
      return await ticketApi.getMyTickets();
    } catch (err) {
      setError(err as Error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getMyTickets,
  };
};
