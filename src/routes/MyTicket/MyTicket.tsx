import { useEffect, useState } from "react";
import { Card } from "@/components/common/ui/card";
import { Badge } from "@/components/common/ui/badge";
import { useTicketing } from "@/hooks/useTicketing";
import type { Ticket } from "@/types/model/ticket.model";

export default function MyTicket() {
  const { loading, error, getMyTickets } = useTicketing();
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    getMyTickets()
      .then((items) => setTicket(items[0] ?? null))
      .catch(() => undefined);
  }, [getMyTickets]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">내 티켓</h2>
        <p className="text-sm text-gray-500">입장 시 필요한 티켓 정보를 확인하세요.</p>
      </div>

      {error && (
        <Card className="p-4 border border-red-200 bg-red-50 text-sm text-red-700">
          {error.message}
        </Card>
      )}

      {loading ? (
        <Card className="p-6 text-sm text-gray-500">티켓 정보를 불러오는 중...</Card>
      ) : ticket ? (
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">{ticket.eventDate || "날짜 미정"}</p>
              <h3 className="text-xl font-semibold text-gray-900">
                {ticket.eventName || "행사명"}
              </h3>
            </div>
            <Badge variant="default">{ticket.status}</Badge>
          </div>
          <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-400">좌석</p>
              <p>{ticket.seat || "미정"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">발급일</p>
              <p>{ticket.issuedAt || "미정"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">티켓 ID</p>
              <p>{ticket.id}</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-sm text-gray-500">
          아직 발급된 티켓이 없습니다.
        </Card>
      )}
    </div>
  );
}
