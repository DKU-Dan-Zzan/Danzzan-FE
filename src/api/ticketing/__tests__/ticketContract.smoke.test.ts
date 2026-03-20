import {
  TicketContractError,
  normalizeQueueEnterContract,
  normalizeQueueStatusContract,
  normalizeReserveContract,
  unwrapApiObjectEnvelope,
} from "@/api/ticketing/ticketContract";

describe("ticketContract smoke", () => {
  it("queue enter SUCCESS 응답을 정규화한다", () => {
    const dto = normalizeQueueEnterContract(
      {
        status: " success ",
        remaining: "17",
      },
      "/tickets/2/queue/enter",
    );

    expect(dto).toEqual({
      status: "SUCCESS",
      remaining: 17,
      queuePosition: null,
      mySequence: null,
      aheadCount: null,
      estimatedWaitSeconds: null,
      readyUntil: null,
      admissionState: undefined,
    });
  });

  it("queue enter WAITING 응답에서 queuePosition을 파싱한다", () => {
    const dto = normalizeQueueEnterContract(
      {
        status: "WAITING",
        queuePosition: 142,
      },
      "/tickets/2/queue/enter",
    );

    expect(dto).toEqual({
      status: "WAITING",
      remaining: undefined,
      queuePosition: 142,
      mySequence: null,
      aheadCount: null,
      estimatedWaitSeconds: null,
      readyUntil: null,
      admissionState: undefined,
    });
  });

  it("queue enter remaining 없이도 에러 없이 동작한다", () => {
    expect(() =>
      normalizeQueueEnterContract(
        {
          status: "WAITING",
        },
        "/tickets/2/queue/enter",
      ),
    ).not.toThrow();
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
