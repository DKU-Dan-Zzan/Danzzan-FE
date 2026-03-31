// 역할: 티켓팅 홈 퀵 액션 아이콘 컬러 토큰을 검증합니다.
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TicketingHomePanel } from "@/components/ticketing/panels/TicketingHomePanel";

describe("TicketingHomePanel", () => {
  it("티켓팅 홈 퀵 액션 아이콘은 목적 토큰 색상을 사용한다", () => {
    const markup = renderToStaticMarkup(
      <TicketingHomePanel
        onOpenTicketingList={vi.fn()}
        onOpenMyTickets={vi.fn()}
      />,
    );

    expect(markup).toContain("h-[30px] w-[30px] text-[var(--ticketing-quick-action-icon)]");
  });
});
