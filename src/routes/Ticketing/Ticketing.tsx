import { useEffect, useState } from "react";
import { Card } from "@/components/common/ui/card";
import { TicketSummaryCard } from "@/components/ticketing/TicketSummaryCard";
import { useTicketing } from "@/hooks/useTicketing";
import type { Ticket } from "@/types/model/ticket.model";

export default function Ticketing() {
  const { loading, error, getMyTickets } = useTicketing();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    getMyTickets().then(setTickets).catch(() => undefined);
  }, [getMyTickets]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">티켓 예매 현황</h2>
        <p className="text-sm text-gray-500">내 티켓 발급 상태와 행사 정보를 확인하세요.</p>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-sm text-red-700">
          {error.message}
        </Card>
      )}

      {loading ? (
        <Card className="p-6 text-sm text-gray-500">티켓 정보를 불러오는 중...</Card>
      ) : tickets.length > 0 ? (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <TicketSummaryCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <Card className="p-6 text-sm text-gray-500">
          현재 발급된 티켓이 없습니다.
        </Card>
      )}
    </div>
  );
}
