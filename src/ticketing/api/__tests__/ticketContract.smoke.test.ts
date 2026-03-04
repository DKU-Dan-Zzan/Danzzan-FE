import {
  TicketContractError,
  normalizeQueueEnterContract,
  normalizeQueueStatusContract,
  normalizeReserveContract,
  unwrapApiObjectEnvelope,
} from "@/ticketing/api/ticketContract";

describe("ticketContract smoke", () => {
  it("queue enter ?묐떟???뺢퇋?뷀븳??, () => {
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

  it("queue enter remaining ?꾨씫 ???먮윭瑜??섏쭊??, () => {
    expect(() =>
      normalizeQueueEnterContract(
        {
          status: "WAITING",
        },
        "/tickets/2/queue/enter",
      ),
    ).toThrow(TicketContractError);
  });

  it("queue status ?묐떟??status瑜?寃利앺븳??, () => {
    expect(() =>
      normalizeQueueStatusContract(
        {
          status: "UNKNOWN",
        },
        "/tickets/2/queue/status",
      ),
    ).toThrow(TicketContractError);
  });

  it("reserve ?묐떟?먯꽌 ticket 媛앹껜 ?꾨씫 ???먮윭瑜??섏쭊??, () => {
    expect(() =>
      normalizeReserveContract(
        {
          queueNumber: 7,
        },
        "/tickets/2/reserve",
      ),
    ).toThrow(TicketContractError);
  });

  it("data envelope瑜??덉쟾?섍쾶 ?몃옪?쒕떎", () => {
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
