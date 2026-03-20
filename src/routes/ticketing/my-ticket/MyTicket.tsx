import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MyTicketListPanel } from "@/components/ticketing/ticketing/MyTicketListPanel";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { useTicketing } from "@/hooks/ticketing/useTicketing";
import type { PlacementAd } from "@/types/ticketing/model/ad.model";
import type { Ticket } from "@/types/ticketing/model/ticket.model";
import { getPlacementAd as getWebPlacementAd, type PlacementKey as WebPlacementKey } from "@/api/noticeApi";

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
    let alive = true;

    (async () => {
      try {
        const ad = await getWebPlacementAd("MY_TICKET" as WebPlacementKey);
        if (!alive) return;

        setWaitingRoomAd(
          ad
            ? {
                placement: "WAITING_ROOM_MAIN",
                imageUrl: ad.imageUrl,
                linkUrl: null,
                altText: ad.title,
                isActive: ad.isActive,
                updatedAt: ad.updatedAt,
              }
            : null,
        );
      } catch {
        if (!alive) return;
        setWaitingRoomAd(null);
      }
    })();

    return () => {
      alive = false;
    };
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
      onGoTicketing={() => navigate("/ticket/ticketing")}
    />
  );
}
