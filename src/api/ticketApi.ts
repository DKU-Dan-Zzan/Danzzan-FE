import { createHttpClient } from "@/api/httpClient";
import {
  mapTicketEventListDtoToModel,
  mapTicketListDtoToModel,
  mapTicketReservationDtoToModel,
} from "@/mappers/ticketMapper";
import { authStore } from "@/store/authStore";
import type {
  ReserveTicketRequestDto,
  TicketEventListResponseDto,
  TicketListResponseDto,
  TicketReservationResponseDto,
} from "@/types/dto/ticket.dto";
import type {
  Ticket,
  TicketingEvent,
  TicketReservationResult,
} from "@/types/model/ticket.model";
import { env, requireEnv } from "@/utils/env";

const getTicketingClient = () =>
  createHttpClient({
    baseUrl: requireEnv(env.ticketingApiBaseUrl, "VITE_TICKETING_API_BASE_URL"),
    getAccessToken: authStore.getAccessToken,
  });

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

export const ticketApi = {
  getTicketingEvents: async (): Promise<TicketingEvent[]> => {
    if (env.apiMode === "mock") {
      return mapTicketEventListDtoToModel(createMockTicketingEventsDto());
    }

    const client = getTicketingClient();
    // TODO(ticketing-api): Confirm endpoint path and response spec for student ticketing event list.
    const dto = await client.get<TicketEventListResponseDto>("/tickets/events");
    return mapTicketEventListDtoToModel(dto ?? {});
  },

  reserveTicket: async (
    eventId: string,
    payload: ReserveTicketRequestDto,
  ): Promise<TicketReservationResult> => {
    if (env.apiMode === "mock") {
      return mapTicketReservationDtoToModel(createMockReservationDto(eventId));
    }

    const client = getTicketingClient();
    // TODO(ticketing-api): Confirm endpoint path and payload schema for ticket reservation.
    const dto = await client.post<TicketReservationResponseDto>(
      `/tickets/${eventId}/reserve`,
      payload,
    );
    return mapTicketReservationDtoToModel(dto ?? {});
  },

  getMyTickets: async (): Promise<Ticket[]> => {
    if (env.apiMode === "mock") {
      return mapTicketListDtoToModel(mockMyTicketsDto);
    }

    const client = getTicketingClient();
    // TODO(ticketing-api): Confirm endpoint path for student my-ticket list.
    const dto = await client.get<TicketListResponseDto>("/tickets/me");
    return mapTicketListDtoToModel(dto ?? {});
  },
};
