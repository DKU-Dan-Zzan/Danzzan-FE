import {
  TicketContractError,
  normalizeQueueEnterContract,
  normalizeQueueStatusContract,
  normalizeReserveContract,
  unwrapApiObjectEnvelope,
} from "@/ticketing/api/ticketContract";

describe("ticketContract smoke", () => {
  it("queue enter 응답을 정규화한다", () => {
    const dto = normalizeQueueEnterContract(
      {
        status: " waiting ",
        remaining: "17",
      },
      "/tickets/2/queue/enter",
    );

    expect(dto).toEqual({
      status: "WAITING",
      remaining: 17,
    });
  });

  it("queue enter remaining 누락 시 에러를 던진다", () => {
    expect(() =>
      normalizeQueueEnterContract(
        {
          status: "WAITING",
        },
        "/tickets/2/queue/enter",
      ),
    ).toThrow(TicketContractError);
  });

  it("queue status 응답의 status를 검증한다", () => {
    expect(() =>
      normalizeQueueStatusContract(
        {
          status: "UNKNOWN",
        },
        "/tickets/2/queue/status",
      ),
    ).toThrow(TicketContractError);
  });

  it("reserve 응답에서 ticket 객체 누락 시 에러를 던진다", () => {
    expect(() =>
      normalizeReserveContract(
        {
          queueNumber: 7,
        },
        "/tickets/2/reserve",
      ),
    ).toThrow(TicketContractError);
  });

  it("data envelope를 안전하게 언랩한다", () => {
    const dto = unwrapApiObjectEnvelope<{ status: string }>(
      {
        data: {
          status: "WAITING",
        },
      },
      "/tickets/2/queue/status",
    );
    expect(dto.status).toBe("WAITING");
  });
});
