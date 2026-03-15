import type {
  TicketDto,
  TicketEventDto,
  TicketEventListResponseDto,
  TicketListResponseDto,
  TicketQueueEnterResponseDto,
  TicketQueueStatusResponseDto,
  TicketReservationResponseDto,
} from "@/types/ticketing/dto/ticket.dto";
import type {
  AdmissionState,
  QueueEnterResult,
  QueueRequestStatus,
  QueueStatusResult,
  Ticket,
  TicketingEvent,
  TicketingEventStatus,
  TicketReservationResult,
  TicketStatus,
} from "@/types/ticketing/model/ticket.model";

const mapTicketStatus = (status?: string): TicketStatus => {
  const normalized = status?.trim().toLowerCase();
  switch (normalized) {
    case "issued":
    case "used":
    case "cancelled":
      return normalized;
    default:
      return "unknown";
  }
};

const mapAdmissionState = (admissionState?: string | null): AdmissionState | null => {
  const normalized = admissionState?.trim().toUpperCase();
  switch (normalized) {
    case "READY":
    case "ACTIVE":
      return normalized;
    default:
      return null;
  }
};

const mapTicketingEventStatus = (status?: string): TicketingEventStatus => {
  const normalized = status?.trim().toLowerCase();
  switch (normalized) {
    case "upcoming":
    case "open":
    case "soldout":
      return normalized;
    default:
      return "unknown";
  }
};

const mapQueueRequestStatus = (status?: string): QueueRequestStatus => {
  const normalized = status?.trim().toUpperCase();
  switch (normalized) {
    case "NONE":
    case "WAITING":
    case "ADMITTED":
    case "SUCCESS":
    case "SOLD_OUT":
    case "ALREADY":
      return normalized;
    default:
      return "NONE";
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

export const mapQueueEnterDtoToModel = (
  dto: TicketQueueEnterResponseDto,
): QueueEnterResult => {
  return {
    status: mapQueueRequestStatus(dto.status),
    remaining: toNullableNumber(dto.remaining ?? undefined),
    queuePosition: dto.queuePosition ?? null,
    mySequence: toNullableNumber(dto.mySequence ?? undefined),
    aheadCount: toNullableNumber(dto.aheadCount ?? undefined),
    estimatedWaitSeconds: toNullableNumber(dto.estimatedWaitSeconds ?? undefined),
    readyUntil: toNullableNumber(dto.readyUntil ?? undefined),
    admissionState: mapAdmissionState(dto.admissionState),
  };
};

export const mapQueueStatusDtoToModel = (
  dto: TicketQueueStatusResponseDto,
): QueueStatusResult => {
  return {
    status: mapQueueRequestStatus(dto.status),
    queuePosition: dto.queuePosition ?? null,
    mySequence: toNullableNumber(dto.mySequence ?? undefined),
    aheadCount: toNullableNumber(dto.aheadCount ?? undefined),
    estimatedWaitSeconds: toNullableNumber(dto.estimatedWaitSeconds ?? undefined),
    readyUntil: toNullableNumber(dto.readyUntil ?? undefined),
    admissionState: mapAdmissionState(dto.admissionState),
  };
};
