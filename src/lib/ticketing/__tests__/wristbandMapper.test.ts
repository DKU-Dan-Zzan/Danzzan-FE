import { describe, expect, it } from "vitest";
import { mapEventStatsToWristbandStats } from "@/lib/ticketing/mappers/wristbandMapper";

describe("wristbandMapper", () => {
  it("팔찌 배부 대상 수량에서 회원 탈퇴 권리포기 티켓을 제외한다", () => {
    const stats = mapEventStatsToWristbandStats({
      eventId: 30,
      title: "2026 DANFESTA DAY 2",
      eventDate: "2026-05-13",
      totalCapacity: 300,
      totalTickets: 3,
      ticketsConfirmed: 1,
      ticketsIssued: 0,
      ticketsCancelledByWithdrawal: 2,
      issueRate: 0,
      remainingCapacity: 297,
    });

    expect(stats).toEqual({
      totalTickets: 1,
      issuedCount: 0,
      pendingCount: 1,
    });
  });
});
