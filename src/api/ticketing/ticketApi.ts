// 역할: 대기열 진입·상태조회·예매·내 티켓 조회를 포함한 티켓팅 핵심 API를 제공합니다.
import { createHttpClient } from "@/api/ticketing/httpClient";
import {
  normalizeQueueEnterContract,
  normalizeQueueStatusContract,
  normalizeReserveContract,
  unwrapApiObjectEnvelope,
} from "@/api/ticketing/ticketContract";
import {
  mapQueueEnterDtoToModel,
  mapQueueStatusDtoToModel,
  mapTicketEventListDtoToModel,
  mapTicketListDtoToModel,
  mapTicketReservationDtoToModel,
} from "@/lib/ticketing/mappers/ticketMapper";
import { authStore } from "@/store/common/authStore";
import type {
  TicketEventListResponseDto,
  TicketListResponseDto,
  TicketQueueEnterResponseDto,
  TicketQueueStatusResponseDto,
  TicketReservationResponseDto,
} from "@/types/ticketing/dto/ticket.dto";
import type {
  QueueEnterResult,
  QueueStatusResult,
  Ticket,
  TicketingEvent,
  TicketReservationResult,
} from "@/types/ticketing/model/ticket.model";
import { env, requireEnv } from "@/utils/common/env";

const getTicketingClient = () =>
  createHttpClient({
    baseUrl: requireEnv(
      env.ticketingApiBaseUrl,
      "VITE_TICKETING_API_BASE_URL (or VITE_API_BASE_URL)",
    ),
    getAccessToken: authStore.getAccessToken,
    refreshAccessToken: authStore.refreshAccessToken,
    clearSession: authStore.clear,
    refreshKey: "ticketing-auth",
  });

type ApiEnvelope<T> = {
  data?: T | null;
} & Record<string, unknown>;

const readTicketEventListDto = (
  payload: TicketEventListResponseDto | ApiEnvelope<TicketEventListResponseDto>,
): TicketEventListResponseDto => {
  try {
    return unwrapApiObjectEnvelope<TicketEventListResponseDto>(payload, "/tickets/events");
  } catch (error) {
    const message = error instanceof Error ? error.message : "응답 형식 오류";
    throw new Error(
      `티켓 이벤트 목록 응답 형식 검증에 실패했습니다. 백엔드 계약을 확인해 주세요. (${message})`,
    );
  }
};

const readMyTicketListDto = (
  payload: TicketListResponseDto | ApiEnvelope<TicketListResponseDto>,
): TicketListResponseDto => {
  try {
    return unwrapApiObjectEnvelope<TicketListResponseDto>(payload, "/tickets/me");
  } catch (error) {
    const message = error instanceof Error ? error.message : "응답 형식 오류";
    throw new Error(
      `내 티켓 목록 응답 형식 검증에 실패했습니다. 백엔드 계약을 확인해 주세요. (${message})`,
    );
  }
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
const MOCK_QUEUE_INITIAL_REMAINING = 500;
const MOCK_QUEUE_DECREMENT_PER_POLL = 12;
const MOCK_QUEUE_TERMINAL_POLL_COUNT = 12;

export const ticketApi = {
  getTicketingEvents: async (): Promise<TicketingEvent[]> => {
    if (env.apiMode === "mock") {
      return mapTicketEventListDtoToModel(createMockTicketingEventsDto());
    }

    const client = getTicketingClient();
    const raw = await client.get<TicketEventListResponseDto | ApiEnvelope<TicketEventListResponseDto>>("/tickets/events");
    const dto = readTicketEventListDto(raw);
    return mapTicketEventListDtoToModel(dto);
  },

  enterTicketQueue: async (
    eventId: string,
    signal?: AbortSignal,
  ): Promise<QueueEnterResult> => {
    if (env.apiMode === "mock") {
      const event = createMockTicketingEventsDto().items?.find((item) => `${item.id}` === eventId);
      if (!event) {
        return {
          status: "NONE",
          remaining: null,
          queuePosition: null,
          mySequence: null,
          aheadCount: null,
          estimatedWaitSeconds: null,
          readyUntil: null,
          admissionState: null,
        };
      }
      if (event.status === "soldout" || event.remainingCount === 0) {
        return {
          status: "SOLD_OUT",
          remaining: 0,
          queuePosition: null,
          mySequence: null,
          aheadCount: null,
          estimatedWaitSeconds: null,
          readyUntil: null,
          admissionState: null,
        };
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
        remaining: null,
        queuePosition: mockJoinSequence,
        mySequence: mockJoinSequence,
        aheadCount: Math.max(mockJoinSequence - 1, 0),
        estimatedWaitSeconds: Math.max(mockJoinSequence - 1, 0) * 15,
        readyUntil: null,
        admissionState: null,
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
        return {
          status: "NONE",
          queuePosition: null,
          mySequence: null,
          aheadCount: null,
          estimatedWaitSeconds: null,
          readyUntil: null,
          admissionState: null,
        };
      }

      session.pollCount += 1;
      session.remaining = Math.max(session.remaining - MOCK_QUEUE_DECREMENT_PER_POLL, 0);

      if (session.pollCount >= MOCK_QUEUE_TERMINAL_POLL_COUNT) {
        mockQueueByEvent.delete(eventId);
        return {
          status: session.terminalStatus,
          queuePosition: null,
          mySequence: null,
          aheadCount: 0,
          estimatedWaitSeconds: 0,
          readyUntil: Date.now() + 180_000,
          admissionState: "READY",
        };
      }

      return {
        status: "WAITING",
        queuePosition: mockJoinSequence,
        mySequence: mockJoinSequence,
        aheadCount: Math.max(mockJoinSequence - 1, 0),
        estimatedWaitSeconds: Math.max(session.remaining, 0),
        readyUntil: null,
        admissionState: null,
      };
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

  activateTicket: async (
    eventId: string,
    signal?: AbortSignal,
  ): Promise<QueueEnterResult> => {
    if (env.apiMode === "mock") {
      return {
        status: "ADMITTED",
        remaining: null,
        queuePosition: null,
        mySequence: null,
        aheadCount: 0,
        estimatedWaitSeconds: 0,
        readyUntil: null,
        admissionState: "ACTIVE",
      };
    }

    const client = getTicketingClient();
    const raw = await client.post<TicketQueueEnterResponseDto | ApiEnvelope<TicketQueueEnterResponseDto>>(
      `/tickets/${eventId}/activate`,
      undefined,
      { signal },
    );
    const dto = unwrapApiObjectEnvelope<TicketQueueEnterResponseDto>(
      raw,
      `/tickets/${eventId}/activate`,
    );
    const normalizedDto = normalizeQueueEnterContract(dto, `/tickets/${eventId}/activate`);
    return mapQueueEnterDtoToModel(normalizedDto);
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

  leaveQueue: async (eventId: string): Promise<void> => {
    if (env.apiMode === "mock") {
      return;
    }
    const client = getTicketingClient();
    await client.delete(`/tickets/${eventId}/queue/leave`);
  },

  getMyTickets: async (
    options?: { signal?: AbortSignal },
  ): Promise<Ticket[]> => {
    if (env.apiMode === "mock") {
      return mapTicketListDtoToModel(mockMyTicketsDto);
    }

    const client = getTicketingClient();
    const raw = await client.get<TicketListResponseDto | ApiEnvelope<TicketListResponseDto>>(
      "/tickets/me",
      {
        signal: options?.signal,
      },
    );
    const dto = readMyTicketListDto(raw);
    return mapTicketListDtoToModel(dto);
  },
};
