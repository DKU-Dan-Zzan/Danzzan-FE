import type {
  TicketQueueEnterResponseDto,
  TicketQueueStatusResponseDto,
  TicketReservationResponseDto,
} from "@/ticketing/types/dto/ticket.dto";
import type { QueueRequestStatus } from "@/ticketing/types/model/ticket.model";

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
    throw new TicketContractError(endpoint, "status 媛믪씠 鍮꾩뼱 ?덉뒿?덈떎.");
  }

  const normalized = raw.trim().toUpperCase() as QueueRequestStatus;
  if (!queueStatusSet.has(normalized)) {
    throw new TicketContractError(endpoint, `status 媛믪씠 ?좏슚?섏? ?딆뒿?덈떎. (${raw})`);
  }

  return normalized;
};

export const unwrapApiObjectEnvelope = <T>(
  payload: unknown,
  endpoint: string,
): T => {
  if (!isRecord(payload)) {
    throw new TicketContractError(endpoint, "?묐떟 蹂몃Ц??媛앹껜 ?뺥깭媛 ?꾨떃?덈떎.");
  }

  const data = payload.data;
  if (data === undefined || data === null) {
    return payload as T;
  }

  if (!isRecord(data)) {
    throw new TicketContractError(endpoint, "data ?꾨뱶媛 媛앹껜 ?뺥깭媛 ?꾨떃?덈떎.");
  }

  return data as T;
};

export const normalizeQueueEnterContract = (
  rawDto: TicketQueueEnterResponseDto,
  endpoint: string,
): TicketQueueEnterResponseDto => {
  const status = assertQueueStatus(rawDto.status, endpoint);

  if (!Object.prototype.hasOwnProperty.call(rawDto, "remaining")) {
    throw new TicketContractError(endpoint, "remaining ?꾨뱶媛 ?꾨씫?섏뿀?듬땲??");
  }

  const remainingRaw = rawDto.remaining;
  if (remainingRaw === null) {
    return {
      status,
      remaining: undefined,
    };
  }

  const remaining = toFiniteNumber(remainingRaw);
  if (remaining === null) {
    throw new TicketContractError(endpoint, "remaining 媛믪씠 ?レ옄 ?뺤떇???꾨떃?덈떎.");
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
    throw new TicketContractError(endpoint, "ticket 媛앹껜媛 ?꾨씫?섏뿀?듬땲??");
  }

  const ticketRecord = rawDto.ticket;
  const hasCoreField = ["id", "eventName", "status", "seat", "queueNumber"]
    .some((key) => ticketRecord[key] !== undefined && ticketRecord[key] !== null);

  if (!hasCoreField) {
    throw new TicketContractError(endpoint, "ticket 媛앹껜???듭떖 ?꾨뱶媛 ?놁뒿?덈떎.");
  }

  if (rawDto.queueNumber !== undefined && rawDto.queueNumber !== null) {
    const queueNumber = toFiniteNumber(rawDto.queueNumber);
    if (queueNumber === null) {
      throw new TicketContractError(endpoint, "queueNumber 媛믪씠 ?レ옄 ?뺤떇???꾨떃?덈떎.");
    }
  }

  return rawDto;
};
