import { createHttpClient } from "@/ticketing/api/httpClient";
import {
  normalizeQueueEnterContract,
  normalizeQueueStatusContract,
  normalizeReserveContract,
  unwrapApiObjectEnvelope,
} from "@/ticketing/api/ticketContract";
import {
  mapQueueEnterDtoToModel,
  mapQueueStatusDtoToModel,
  mapTicketEventListDtoToModel,
  mapTicketListDtoToModel,
  mapTicketReservationDtoToModel,
} from "@/ticketing/mappers/ticketMapper";
import { authStore } from "@/ticketing/store/authStore";
import type {
  TicketEventListResponseDto,
  TicketListResponseDto,
  TicketQueueEnterResponseDto,
  TicketQueueStatusResponseDto,
  TicketReservationResponseDto,
} from "@/ticketing/types/dto/ticket.dto";
import type {
  QueueEnterResult,
  QueueStatusResult,
  Ticket,
  TicketingEvent,
  TicketReservationResult,
} from "@/ticketing/types/model/ticket.model";
import { env, requireEnv } from "@/ticketing/utils/env";

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

const addMinutesToIso = (minutes: number) => {
  return new Date(Date.now() + minutes * 60_000).toISOString();
};

const createMockTicketingEventsDto = (): TicketEventListResponseDto => {
  return {
    items: [
      {
        id: "1",
        title: "5??12???④뎅議??곗폆",
        eventDate: "05??2??(??",
        eventTime: "13:00 ?덈ℓ ?ㅽ뵂",
        ticketOpenAt: addMinutesToIso(-60),
        status: "soldout",
        remainingCount: 0,
        totalCount: 120,
      },
      {
        id: "2",
        title: "5??13???④뎅議??곗폆",
        eventDate: "05??3??(??",
        eventTime: "13:00 ?덈ℓ ?ㅽ뵂",
        ticketOpenAt: addMinutesToIso(-3),
        status: "open",
        remainingCount: 34,
        totalCount: 120,
      },
      {
        id: "3",
        title: "5??14???④뎅議??곗폆",
        eventDate: "05??4??(??",
        eventTime: "13:00 ?덈ℓ ?ㅽ뵂",
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
      eventName: "2?쇱감 ?곗폆",
      eventDate: "05??13??(?? 19:00",
      issuedAt: "2026-05-11 13:22",
      seat: "?④뎅議??쒕쾲 #127",
      queueNumber: 127,
      wristbandIssued: false,
      eventDescription: "2?쇱감 硫붿씤 怨듭뿰",
      venue: "Main Stage",
      contact: "異뺤젣 ?댁쁺蹂몃? 010-9876-5432",
    },
    {
      id: "341",
      status: "used",
      eventName: "3?쇱감 ?곗폆",
      eventDate: "05??14??(?? 19:00",
      issuedAt: "2026-05-12 08:54",
      seat: "?④뎅議??쒕쾲 #341",
      queueNumber: 341,
      wristbandIssued: true,
      eventDescription: "3?쇱감 硫붿씤 怨듭뿰",
      venue: "Main Stage",
      contact: "異뺤젣 ?댁쁺蹂몃? 010-9876-5432",
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
      eventName: mockEvent?.title?.replace("티켓", "공연") ?? "공연 티켓",
      eventDate: [mockEvent?.eventDate, mockEvent?.eventTime].filter(Boolean).join(" "),
      issuedAt: new Date().toISOString(),
      seat: `?④뎅議??쒕쾲 #${queueNumber}`,
      queueNumber,
      wristbandIssued: false,
      venue: "Main Stage",
      contact: "異뺤젣 ?댁쁺蹂몃? 010-9876-5432",
      eventDescription: "?덈ℓ ?꾨즺 ?곗폆",
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
const MOCK_QUEUE_INITIAL_REMAINING = 500;
const MOCK_QUEUE_DECREMENT_PER_POLL = 12;
const MOCK_QUEUE_TERMINAL_POLL_COUNT = 12;

export const ticketApi = {
  getTicketingEvents: async (): Promise<TicketingEvent[]> => {
    if (env.apiMode === "mock") {
      return mapTicketEventListDtoToModel(createMockTicketingEventsDto());
    }

    const client = getTicketingClient();
    // TODO(ticketing-api): Confirm endpoint path and response spec for student ticketing event list.
    const raw = await client.get<TicketEventListResponseDto | ApiEnvelope<TicketEventListResponseDto>>("/tickets/events");
    const dto = unwrapApiObjectEnvelope<TicketEventListResponseDto>(raw, "/tickets/events");
    return mapTicketEventListDtoToModel(dto);
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
        remaining: MOCK_QUEUE_INITIAL_REMAINING,
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
    const raw = await client.post<TicketQueueEnterResponseDto | ApiEnvelope<TicketQueueEnterResponseDto>>(
      `/tickets/${eventId}/queue/enter`,
      undefined,
      { signal },
    );
    const dto = unwrapApiObjectEnvelope<TicketQueueEnterResponseDto>(
      raw,
      `/tickets/${eventId}/queue/enter`,
    );
    const normalizedDto = normalizeQueueEnterContract(dto, `/tickets/${eventId}/queue/enter`);
    return mapQueueEnterDtoToModel(normalizedDto);
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
      session.remaining = Math.max(session.remaining - MOCK_QUEUE_DECREMENT_PER_POLL, 0);

      if (session.pollCount >= MOCK_QUEUE_TERMINAL_POLL_COUNT) {
        mockQueueByEvent.delete(eventId);
        return { status: session.terminalStatus };
      }

      return { status: "WAITING" };
    }

    const client = getTicketingClient();
    const raw = await client.get<TicketQueueStatusResponseDto | ApiEnvelope<TicketQueueStatusResponseDto>>(
      `/tickets/${eventId}/queue/status`,
      { signal },
    );
    const dto = unwrapApiObjectEnvelope<TicketQueueStatusResponseDto>(
      raw,
      `/tickets/${eventId}/queue/status`,
    );
    const normalizedDto = normalizeQueueStatusContract(dto, `/tickets/${eventId}/queue/status`);
    return mapQueueStatusDtoToModel(normalizedDto);
  },

  reserveTicket: async (
    eventId: string,
    signal?: AbortSignal,
  ): Promise<TicketReservationResult> => {
    if (env.apiMode === "mock") {
      return mapTicketReservationDtoToModel(createMockReservationDto(eventId));
    }

    const client = getTicketingClient();
    const raw = await client.post<TicketReservationResponseDto | ApiEnvelope<TicketReservationResponseDto>>(
      `/tickets/${eventId}/reserve`,
      undefined,
      { signal },
    );
    const dto = unwrapApiObjectEnvelope<TicketReservationResponseDto>(
      raw,
      `/tickets/${eventId}/reserve`,
    );
    const normalizedDto = normalizeReserveContract(dto, `/tickets/${eventId}/reserve`);
    return mapTicketReservationDtoToModel(normalizedDto);
  },

  getRemainingCount: async (eventId: string): Promise<{ eventId: number; remaining: number }> => {
    if (env.apiMode === "mock") {
      return { eventId: Number(eventId), remaining: Math.floor(Math.random() * 100) };
    }

    const client = getTicketingClient();
    return await client.get<{ eventId: number; remaining: number }>(
      `/tickets/events/${eventId}/remaining`,
    );
  },

  getMyTickets: async (): Promise<Ticket[]> => {
    if (env.apiMode === "mock") {
      return mapTicketListDtoToModel(mockMyTicketsDto);
    }

    const client = getTicketingClient();
    // TODO(ticketing-api): Confirm endpoint path for student my-ticket list.
    const raw = await client.get<TicketListResponseDto | ApiEnvelope<TicketListResponseDto>>("/tickets/me");
    const dto = unwrapApiObjectEnvelope<TicketListResponseDto>(raw, "/tickets/me");
    return mapTicketListDtoToModel(dto);
  },
};
