import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adApi } from "@/api/adApi";
import { MyTicketListPanel } from "@/components/ticketing/MyTicketListPanel";
import { useAuth } from "@/hooks/useAuth";
import { useTicketing } from "@/hooks/useTicketing";
import type { PlacementAd } from "@/types/model/ad.model";
import type { Ticket } from "@/types/model/ticket.model";

export default function MyTicket() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { loading, error, getMyTickets } = useTicketing();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [waitingRoomAd, setWaitingRoomAd] = useState<PlacementAd | null>(null);

  const loadMyTickets = useCallback(async () => {
    const fetched = await getMyTickets();
    setTickets(fetched);
  }, [getMyTickets]);

  useEffect(() => {
    void loadMyTickets();
  }, [loadMyTickets]);

  useEffect(() => {
    const controller = new AbortController();
    adApi
      .getPlacementAd("WAITING_ROOM_MAIN", controller.signal)
      .then((ad) => setWaitingRoomAd(ad))
      .catch(() => setWaitingRoomAd(null));

    return () => controller.abort();
  }, []);

  return (
    <MyTicketListPanel
      tickets={tickets}
      student={{
        studentId: session.user?.studentId || "-",
        name: session.user?.name || "학생",
      }}
      loading={loading}
      errorMessage={error?.message ?? null}
      ad={waitingRoomAd}
      onRefresh={() => {
        void loadMyTickets();
      }}
      onGoTicketing={() => navigate("/ticketing")}
    />
  );
}
