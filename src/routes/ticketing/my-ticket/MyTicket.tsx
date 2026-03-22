// 역할: 티켓팅 도메인 라우트와 화면 흐름을 구성하는 모듈입니다.
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MyTicketListPanel } from "@/components/ticketing/panels/MyTicketListPanel";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { appQueryKeys, useAppQuery } from "@/lib/query";
import type { PlacementAd } from "@/types/ticketing/model/ad.model";
import { ticketApi } from "@/api/ticketing/ticketApi";
import { getPlacementAd as getWebPlacementAd } from "@/api/ticketing/noticeApi";

export default function MyTicket() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const myTicketsQuery = useAppQuery({
    queryKey: appQueryKeys.myTicketList(),
    queryFn: ({ signal }) => ticketApi.getMyTickets({ signal }),
    staleTime: 30_000,
  });

  const waitingRoomAdQuery = useAppQuery({
    queryKey: appQueryKeys.myTicketAd(),
    queryFn: ({ signal }) => getWebPlacementAd("MY_TICKET", { signal }),
    staleTime: 5 * 60_000,
  });

  const waitingRoomAd = useMemo<PlacementAd | null>(() => {
    const ad = waitingRoomAdQuery.data;
    if (!ad) {
      return null;
    }
    return {
      placement: "WAITING_ROOM_MAIN",
      imageUrl: ad.imageUrl,
      linkUrl: null,
      altText: ad.title,
      isActive: ad.isActive,
      updatedAt: ad.updatedAt,
    };
  }, [waitingRoomAdQuery.data]);

  return (
    <MyTicketListPanel
      tickets={myTicketsQuery.data ?? []}
      student={{
        studentId: session.user?.studentId || "-",
        name: session.user?.name || "학생",
      }}
      loading={myTicketsQuery.isPending}
      errorMessage={myTicketsQuery.error?.message ?? null}
      ad={waitingRoomAd}
      onRefresh={() => {
        void myTicketsQuery.refetch();
      }}
      onGoTicketing={() => navigate("/ticket/ticketing")}
    />
  );
}
