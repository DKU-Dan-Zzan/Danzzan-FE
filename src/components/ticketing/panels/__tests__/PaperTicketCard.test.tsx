// 역할: PaperTicketCard의 상태별 렌더링과 접근성 속성을 검증하는 테스트입니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PaperTicketCard } from "@/components/ticketing/panels/PaperTicketCard";
import type { Ticket } from "@/types/ticketing/model/ticket.model";

const createTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: "ticket-1",
  status: "issued",
  eventName: "단국존 선예매 티켓",
  eventDate: "2026-05-07",
  issuedAt: "2026-05-10 10:00",
  seat: "A-1",
  qrCodeUrl: "",
  queueNumber: 1,
  wristbandIssued: false,
  contact: "",
  venue: "단국존",
  eventDescription: "",
  ...overrides,
});

describe("PaperTicketCard", () => {
  it("공연 일자(2026-05-07) 기반으로 DAY 2를 표시한다", () => {
    const markup = renderToStaticMarkup(
      <PaperTicketCard ticket={createTicket({ eventDate: "2026-05-07", eventName: "단국존 선예매 티켓" })} />,
    );

    expect(markup).toContain("DAY 2");
  });
});
