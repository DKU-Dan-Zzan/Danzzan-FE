import { Badge } from "@/components/common/ui/badge";
import { Card } from "@/components/common/ui/card";
import type { Ticket } from "@/types/model/ticket.model";

const statusMap: Record<
  Ticket["status"],
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  issued: { label: "발급 완료", variant: "default" },
  used: { label: "사용 완료", variant: "secondary" },
  cancelled: { label: "취소", variant: "destructive" },
  unknown: { label: "확인 필요", variant: "secondary" },
};

export function TicketSummaryCard({ ticket }: { ticket: Ticket }) {
  const status = statusMap[ticket.status];

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{ticket.eventDate || "날짜 미정"}</p>
          <h3 className="text-lg font-semibold text-gray-900">
            {ticket.eventName || "행사명"}
          </h3>
        </div>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        <span>좌석: {ticket.seat || "미정"}</span>
        <span>발급일: {ticket.issuedAt || "미정"}</span>
      </div>
    </Card>
  );
}
