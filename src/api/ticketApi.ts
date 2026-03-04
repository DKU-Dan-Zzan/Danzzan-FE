import { createHttpClient } from "@/api/httpClient";
import {
  mapQueueEnterDtoToModel,
  mapQueueStatusDtoToModel,
  mapTicketEventListDtoToModel,
  mapTicketListDtoToModel,
  mapTicketReservationDtoToModel,
} from "@/mappers/ticketMapper";
import { authStore } from "@/store/authStore";
import type {
  TicketEventListResponseDto,
  TicketListResponseDto,
  TicketQueueEnterResponseDto,
  TicketQueueStatusResponseDto,
  TicketReservationResponseDto,
} from "@/types/dto/ticket.dto";
import type {
  QueueEnterResult,
  QueueStatusResult,
  Ticket,
  TicketingEvent,
  TicketReservationResult,
} from "@/types/model/ticket.model";
import { env, requireEnv } from "@/utils/env";

const getTicketingClient = () =>
  createHttpClient({
    baseUrl: requireEnv(
      env.ticketingApiBaseUrl,
      "VITE_TICKETING_API_BASE_URL (or VITE_API_BASE_URL)",
    ),
    getAccessToken: authStore.getAccessToken,
  });

type ApiEnvelope<T> = {
  data?: T | null;
} & Record<string, unknown>;

const unwrapApiData = <T extends Record<string, unknown>>(
  payload: T | ApiEnvelope<T> | null | undefined,
): T => {
  if (!payload || typeof payload !== "object") {
    return {} as T;
  }

  const record = payload as Record<string, unknown>;
  const maybeData = record.data;
  if (maybeData && typeof maybeData === "object") {
    return maybeData as T;
  }

  return payload as T;
};

const addMinutesToIso = (minutes: number) => {
  return new Date(Date.now() + minutes * 60_000).toISOString();
};

const createMockTicketingEventsDto = (): TicketEventListResponseDto => {
  return {
    items: [
      {
        id: "1",
        title: "5월 12일 단국존 티켓",
        eventDate: "05월 2일 (토)",
        eventTime: "13:00 예매 오픈",
        ticketOpenAt: addMinutesToIso(-60),
        status: "soldout",
        remainingCount: 0,
        totalCount: 120,
      },
      {
        id: "2",
        title: "5월 13일 단국존 티켓",
        eventDate: "05월 3일 (일)",
        eventTime: "13:00 예매 오픈",
        ticketOpenAt: addMinutesToIso(-3),
        status: "open",
        remainingCount: 34,
        totalCount: 120,
      },
      {
        id: "3",
        title: "5월 14일 단국존 티켓",
        eventDate: "05월 4일 (월)",
        eventTime: "13:00 예매 오픈",
        ticketOpenAt: addMinutesToIso(12),
        status: "upcoming",
        remainingCount: 120,
        totalCount: 120,
      },
    ],
  };
};

const mockMyTicketsDto: TicketListResponseDto = {
  items: [
    {
      id: "127",
      status: "issued",
      eventName: "2일차 티켓",
      eventDate: "05월 13일 (화) 19:00",
      issuedAt: "2026-05-11 13:22",
      seat: "단국존 순번 #127",
      queueNumber: 127,
      wristbandIssued: false,
      eventDescription: "2일차 메인 공연",
      venue: "단국존",
      contact: "축제 운영본부 010-9876-5432",
    },
    {
      id: "341",
      status: "used",
      eventName: "3일차 티켓",
      eventDate: "05월 14일 (수) 19:00",
      issuedAt: "2026-05-12 08:54",
      seat: "단국존 순번 #341",
      queueNumber: 341,
      wristbandIssued: true,
      eventDescription: "3일차 메인 공연",
      venue: "단국존",
      contact: "축제 운영본부 010-9876-5432",
    },
  ],
};

const createMockReservationDto = (eventId: string): TicketReservationResponseDto => {
  const mockEvent = createMockTicketingEventsDto().items?.find(
    (item) => `${item.id}` === eventId,
  );
  const queueNumber = Math.floor(Math.random() * 500) + 1;

  return {
    queueNumber,
    ticket: {
      id: `mock-${Date.now()}`,
      status: "issued",
      eventName: mockEvent?.title?.replace("티켓팅", "티켓") ?? "공연 티켓",
      eventDate: [mockEvent?.eventDate, mockEvent?.eventTime].filter(Boolean).join(" "),
      issuedAt: new Date().toISOString(),
      seat: `단국존 순번 #${queueNumber}`,
      queueNumber,
      wristbandIssued: false,
      venue: "단국존",
      contact: "축제 운영본부 010-9876-5432",
      eventDescription: "예매 완료 티켓",
      qrCodeUrl: "",
    },
  };
};

type MockQueueSession = {
  remaining: number;
  pollCount: number;
  terminalStatus: "ADMITTED" | "SUCCESS";
};

const mockQueueByEvent = new Map<string, MockQueueSession>();
let mockJoinSequence = 0;

export const ticketApi = {
  getTicketingEvents: async (): Promise<TicketingEvent[]> => {
    if (env.apiMode === "mock") {
      return mapTicketEventListDtoToModel(createMockTicketingEventsDto());
    }

    const client = getTicketingClient();
    // TODO(ticketing-api): Confirm endpoint path and response spec for student ticketing event list.
    const dto = await client.get<TicketEventListResponseDto | ApiEnvelope<TicketEventListResponseDto>>("/tickets/events");
    return mapTicketEventListDtoToModel(unwrapApiData(dto));
  },

  enterTicketQueue: async (
    eventId: string,
    signal?: AbortSignal,
  ): Promise<QueueEnterResult> => {
    if (env.apiMode === "mock") {
      const event = createMockTicketingEventsDto().items?.find((item) => `${item.id}` === eventId);
      if (!event) {
        return { status: "NONE", remaining: null };
      }
      if (event.status === "soldout" || event.remainingCount === 0) {
        return { status: "SOLD_OUT", remaining: 0 };
      }

      mockJoinSequence += 1;
      const session: MockQueueSession = {
        remaining: 18,
        pollCount: 0,
        terminalStatus: mockJoinSequence % 2 === 0 ? "SUCCESS" : "ADMITTED",
      };
      mockQueueByEvent.set(eventId, session);
      return {
        status: "WAITING",
        remaining: session.remaining,
      };
    }

    const client = getTicketingClient();
    const dto = await client.post<TicketQueueEnterResponseDto | ApiEnvelope<TicketQueueEnterResponseDto>>(
      `/tickets/${eventId}/queue/enter`,
      undefined,
      { signal },
    );
    return mapQueueEnterDtoToModel(unwrapApiData(dto));
  },

  getTicketQueueStatus: async (
    eventId: string,
    signal?: AbortSignal,
  ): Promise<QueueStatusResult> => {
    if (env.apiMode === "mock") {
      const session = mockQueueByEvent.get(eventId);
      if (!session) {
        return { status: "NONE" };
      }

      session.pollCount += 1;
      session.remaining = Math.max(session.remaining - 4, 0);

      if (session.pollCount >= 3) {
        mockQueueByEvent.delete(eventId);
        return { status: session.terminalStatus };
      }

      return { status: "WAITING" };
    }

    const client = getTicketingClient();
    const dto = await client.get<TicketQueueStatusResponseDto | ApiEnvelope<TicketQueueStatusResponseDto>>(
      `/tickets/${eventId}/queue/status`,
      { signal },
    );
    return mapQueueStatusDtoToModel(unwrapApiData(dto));
  },

  reserveTicket: async (
    eventId: string,
    signal?: AbortSignal,
  ): Promise<TicketReservationResult> => {
    if (env.apiMode === "mock") {
      return mapTicketReservationDtoToModel(createMockReservationDto(eventId));
    }

    const client = getTicketingClient();
    const dto = await client.post<TicketReservationResponseDto | ApiEnvelope<TicketReservationResponseDto>>(
      `/tickets/${eventId}/reserve`,
      undefined,
      { signal },
    );
    return mapTicketReservationDtoToModel(unwrapApiData(dto));
  },

  getMyTickets: async (): Promise<Ticket[]> => {
    if (env.apiMode === "mock") {
      return mapTicketListDtoToModel(mockMyTicketsDto);
    }

    const client = getTicketingClient();
    // TODO(ticketing-api): Confirm endpoint path for student my-ticket list.
    const dto = await client.get<TicketListResponseDto | ApiEnvelope<TicketListResponseDto>>("/tickets/me");
    return mapTicketListDtoToModel(unwrapApiData(dto));
  },
};
