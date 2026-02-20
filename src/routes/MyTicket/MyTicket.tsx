import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MyTicketListPanel } from "@/components/ticketing/MyTicketListPanel";
import { useAuth } from "@/hooks/useAuth";
import { useTicketing } from "@/hooks/useTicketing";
import type { Ticket } from "@/types/model/ticket.model";

export default function MyTicket() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { loading, error, getMyTickets } = useTicketing();

  const [tickets, setTickets] = useState<Ticket[]>([]);

  const loadMyTickets = useCallback(async () => {
    const fetched = await getMyTickets();
    setTickets(fetched);
  }, [getMyTickets]);

  useEffect(() => {
    void loadMyTickets();
  }, [loadMyTickets]);

  return (
    <MyTicketListPanel
      tickets={tickets}
      student={{
        studentId: session.user?.studentId || "-",
        name: session.user?.name || "학생",
      }}
      loading={loading}
      errorMessage={error?.message ?? null}
      onRefresh={() => {
        void loadMyTickets();
      }}
      onGoTicketing={() => navigate("/ticketing")}
    />
  );
}
