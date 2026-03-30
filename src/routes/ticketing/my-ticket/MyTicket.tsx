// 역할: 내 티켓 조회 화면의 데이터 로딩과 패널 구성을 담당합니다.
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MyTicketListPanel } from "@/components/ticketing/panels/MyTicketListPanel";
import { useAuth } from "@/hooks/ticketing/useAuth";
import { appQueryKeys, useAppQuery } from "@/lib/query";
import { ticketApi } from "@/api/ticketing/ticketApi";
import { getAllActiveAds } from "@/api/app/ad/adApi";

export default function MyTicket() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const myTicketsQuery = useAppQuery({
    queryKey: appQueryKeys.myTicketList(),
    queryFn: ({ signal }) => ticketApi.getMyTickets({ signal }),
    staleTime: 30_000,
  });

  const allAdsQuery = useAppQuery({
    queryKey: appQueryKeys.allActiveAds(),
    queryFn: ({ signal }) => getAllActiveAds({ signal }),
    staleTime: 5 * 60_000,
  });

  const ads = useMemo(
    () =>
      (allAdsQuery.data ?? []).map((ad) => ({
        imageUrl: ad.imageUrl,
        alt: ad.title,
        updatedAt: ad.updatedAt,
        objectPosition: ad.objectPosition,
      })),
    [allAdsQuery.data],
  );

  return (
    <MyTicketListPanel
      tickets={myTicketsQuery.data ?? []}
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
