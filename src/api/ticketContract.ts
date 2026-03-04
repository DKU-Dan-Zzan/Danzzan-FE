import type {
  TicketQueueEnterResponseDto,
  TicketQueueStatusResponseDto,
  TicketReservationResponseDto,
} from "@/types/dto/ticket.dto";
import type { QueueRequestStatus } from "@/types/model/ticket.model";

const QUEUE_STATUS_VALUES: QueueRequestStatus[] = [
  "NONE",
  "WAITING",
  "ADMITTED",
  "SUCCESS",
  "SOLD_OUT",
  "ALREADY",
];

const queueStatusSet = new Set<QueueRequestStatus>(QUEUE_STATUS_VALUES);

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object";
};

const toFiniteNumber = (value: unknown): number | null => {
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

export class TicketContractError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string, message: string) {
    super(`[ticket-contract:${endpoint}] ${message}`);
    this.name = "TicketContractError";
    this.endpoint = endpoint;
  }
}

const assertQueueStatus = (raw: unknown, endpoint: string): QueueRequestStatus => {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new TicketContractError(endpoint, "status 값이 비어 있습니다.");
  }

  const normalized = raw.trim().toUpperCase() as QueueRequestStatus;
  if (!queueStatusSet.has(normalized)) {
    throw new TicketContractError(endpoint, `status 값이 유효하지 않습니다. (${raw})`);
  }

  return normalized;
};

export const unwrapApiObjectEnvelope = <T extends Record<string, unknown>>(
  payload: unknown,
  endpoint: string,
): T => {
  if (!isRecord(payload)) {
    throw new TicketContractError(endpoint, "응답 본문이 객체 형태가 아닙니다.");
  }

  const data = payload.data;
  if (data === undefined || data === null) {
    return payload as T;
  }

  if (!isRecord(data)) {
    throw new TicketContractError(endpoint, "data 필드가 객체 형태가 아닙니다.");
  }

  return data as T;
};

export const normalizeQueueEnterContract = (
  rawDto: TicketQueueEnterResponseDto,
  endpoint: string,
): TicketQueueEnterResponseDto => {
  const status = assertQueueStatus(rawDto.status, endpoint);

  if (!Object.prototype.hasOwnProperty.call(rawDto, "remaining")) {
    throw new TicketContractError(endpoint, "remaining 필드가 누락되었습니다.");
  }

  const remainingRaw = rawDto.remaining;
  if (remainingRaw === null) {
    return {
      status,
      remaining: null,
    };
  }

  const remaining = toFiniteNumber(remainingRaw);
  if (remaining === null) {
    throw new TicketContractError(endpoint, "remaining 값이 숫자 형식이 아닙니다.");
  }

  return {
    status,
    remaining,
  };
};

export const normalizeQueueStatusContract = (
  rawDto: TicketQueueStatusResponseDto,
  endpoint: string,
): TicketQueueStatusResponseDto => {
  return {
    status: assertQueueStatus(rawDto.status, endpoint),
  };
};

export const normalizeReserveContract = (
  rawDto: TicketReservationResponseDto,
  endpoint: string,
): TicketReservationResponseDto => {
  if (!isRecord(rawDto.ticket)) {
    throw new TicketContractError(endpoint, "ticket 객체가 누락되었습니다.");
  }

  const ticketRecord = rawDto.ticket;
  const hasCoreField = ["id", "eventName", "status", "seat", "queueNumber"]
    .some((key) => ticketRecord[key] !== undefined && ticketRecord[key] !== null);

  if (!hasCoreField) {
    throw new TicketContractError(endpoint, "ticket 객체에 핵심 필드가 없습니다.");
  }

  if (rawDto.queueNumber !== undefined && rawDto.queueNumber !== null) {
    const queueNumber = toFiniteNumber(rawDto.queueNumber);
    if (queueNumber === null) {
      throw new TicketContractError(endpoint, "queueNumber 값이 숫자 형식이 아닙니다.");
    }
  }

  return rawDto;
};
