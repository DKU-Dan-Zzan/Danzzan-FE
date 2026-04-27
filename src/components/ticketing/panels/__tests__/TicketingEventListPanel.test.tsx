import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TicketingEventListPanel } from "@/components/ticketing/panels/TicketingEventListPanel";
import type { TicketingEvent } from "@/types/ticketing/model/ticket.model";

const OPEN_EVENT: TicketingEvent = {
  id: "event-open",
  title: "2026 DANFESTA DAY 2",
  eventDate: "5월 13일 (수)",
  eventTime: "18:00",
  ticketOpenAt: "2026-05-13T09:00:00Z",
  status: "open",
  remainingCount: 120,
  totalCount: 500,
};

describe("TicketingEventListPanel", () => {
  it("오픈 상태 배지는 상태 토큰 배경을 우선 적용하고 기본 Badge 그라데이션을 사용하지 않는다", () => {
    const markup = renderToStaticMarkup(
      <TicketingEventListPanel
        events={[OPEN_EVENT]}
        loading={false}
        errorMessage={null}
        now={Date.now()}
        onRefresh={vi.fn()}
        onSelectEvent={vi.fn()}
      />,
    );

    const openBadgeMatch = markup.match(/<span[^>]*>실시간 예매 중<\/span>/);
    expect(openBadgeMatch).not.toBeNull();
    const openBadgeMarkup = openBadgeMatch?.[0] ?? "";

    expect(openBadgeMarkup).toContain("bg-[var(--status-success)]");
    expect(openBadgeMarkup).toContain("text-white");
    expect(openBadgeMarkup).not.toContain(
      "bg-[linear-gradient(135deg,var(--primary)_0%,var(--primary_container)_100%)]",
    );
  });
});
