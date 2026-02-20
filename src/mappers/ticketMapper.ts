import type {
  TicketDto,
  TicketEventDto,
  TicketEventListResponseDto,
  TicketListResponseDto,
  TicketReservationResponseDto,
} from "@/types/dto/ticket.dto";
import type {
  Ticket,
  TicketingEvent,
  TicketingEventStatus,
  TicketReservationResult,
  TicketStatus,
} from "@/types/model/ticket.model";

const mapTicketStatus = (status?: string): TicketStatus => {
  switch (status) {
    case "issued":
    case "used":
    case "cancelled":
      return status;
    default:
      return "unknown";
  }
};

const mapTicketingEventStatus = (status?: string): TicketingEventStatus => {
  switch (status) {
    case "upcoming":
    case "open":
    case "soldout":
      return status;
    default:
      return "unknown";
  }
};

const toText = (value?: string | number): string => {
  if (value === undefined || value === null) {
    return "";
  }
  return `${value}`;
};

const toNullableNumber = (value?: string | number): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

export const mapTicketDtoToModel = (dto: TicketDto): Ticket => {
  return {
    id: toText(dto.id),
    status: mapTicketStatus(dto.status),
    eventName: dto.eventName ?? "",
    eventDate: dto.eventDate ?? "",
    issuedAt: dto.issuedAt ?? "",
    seat: dto.seat ?? "",
    qrCodeUrl: dto.qrCodeUrl ?? "",
    queueNumber: toNullableNumber(dto.queueNumber),
    wristbandIssued: dto.wristbandIssued,
    contact: dto.contact ?? "",
    venue: dto.venue ?? "",
    eventDescription: dto.eventDescription ?? "",
  };
};

export const mapTicketListDtoToModel = (
  dto: TicketListResponseDto,
): Ticket[] => {
  const items = dto.items ?? [];
  return items.map((item) => mapTicketDtoToModel(item));
};

export const mapTicketEventDtoToModel = (dto: TicketEventDto): TicketingEvent => {
  return {
    id: toText(dto.id),
    title: dto.title ?? dto.eventName ?? "",
    eventDate: dto.eventDate ?? "",
    eventTime: dto.eventTime ?? "",
    ticketOpenAt: dto.ticketOpenAt ?? dto.openAt ?? "",
    status: mapTicketingEventStatus(dto.status),
    remainingCount: toNullableNumber(dto.remainingCount),
    totalCount: toNullableNumber(dto.totalCount),
  };
};

export const mapTicketEventListDtoToModel = (
  dto: TicketEventListResponseDto,
): TicketingEvent[] => {
  const items = dto.items ?? [];
  return items.map((item) => mapTicketEventDtoToModel(item));
};

export const mapTicketReservationDtoToModel = (
  dto: TicketReservationResponseDto,
): TicketReservationResult => {
  const ticketSource = dto.ticket ?? dto;
  const ticket = mapTicketDtoToModel(ticketSource);
  const queueNumber = toNullableNumber(dto.queueNumber) ?? ticket.queueNumber ?? null;

  return {
    ticket: {
      ...ticket,
      queueNumber,
    },
    queueNumber,
  };
};
