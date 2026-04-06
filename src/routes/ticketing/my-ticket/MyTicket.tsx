// 역할: 내 티켓 조회 화면의 데이터 로딩과 패널 구성을 담당합니다.
import { useNavigate } from "react-router-dom";
import { MyTicketListPanel } from "@/components/ticketing/panels/MyTicketListPanel";
import { adApi } from "@/api/ticketing/adApi";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { appQueryKeys, useAppQuery } from "@/lib/query";
import { ticketApi } from "@/api/ticketing/ticketApi";

export default function MyTicket() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const myTicketsQuery = useAppQuery({
    queryKey: appQueryKeys.myTicketList(),
    queryFn: ({ signal }) => ticketApi.getMyTickets({ signal }),
    staleTime: 30_000,
  });

  const myTicketAdQuery = useAppQuery({
    queryKey: appQueryKeys.placementAds("MY_TICKET"),
    queryFn: ({ signal }) => adApi.getMyTicketAds(signal),
    staleTime: 5 * 60_000,
  });

  const ads = myTicketAdQuery.data ?? [];

  const tickets = [...(myTicketsQuery.data ?? [])].sort((a, b) =>
    a.eventDate.localeCompare(b.eventDate),
  );

  return (
    <MyTicketListPanel
      tickets={tickets}
      student={{
        studentId: session.user?.studentId || "-",
        name: session.user?.name || "학생",
      }}
      loading={myTicketsQuery.isPending}
      errorMessage={myTicketsQuery.error?.message ?? null}
      ads={ads}
      onRefresh={() => {
        void myTicketsQuery.refetch();
      }}
      onGoTicketing={() => navigate("/ticket/ticketing")}
    />
  );
}
