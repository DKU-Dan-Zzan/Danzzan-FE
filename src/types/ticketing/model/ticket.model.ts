// 역할: 티켓팅 플로우에서 사용하는 티켓·이벤트·대기열 도메인 모델 타입을 정의합니다.
export type TicketStatus = "issued" | "used" | "cancelled" | "unknown";

export interface Ticket {
  id: string;
  status: TicketStatus;
  eventName: string;
  eventDate: string;
  issuedAt: string;
  seat: string;
  qrCodeUrl: string;
  queueNumber?: number | null;
  wristbandIssued?: boolean;
  contact?: string;
  venue?: string;
  eventDescription?: string;
}

export type TicketingEventStatus = "upcoming" | "open" | "soldout" | "unknown";

export interface TicketingEvent {
  id: string;
  title: string;
  eventDate: string;
  eventTime: string;
  ticketOpenAt: string;
  status: TicketingEventStatus;
  remainingCount: number | null;
  totalCount: number | null;
}

export interface TicketReservationResult {
  ticket: Ticket;
  queueNumber: number | null;
}

export type QueueRequestStatus =
  | "NONE"
  | "WAITING"
  | "ADMITTED"
  // SUCCESS means Redis claim success; final completion still requires /reserve success.
  | "SUCCESS"
  | "SOLD_OUT"
  | "ALREADY";

export type AdmissionState = "READY" | "ACTIVE";

export interface QueueEnterResult {
  status: QueueRequestStatus;
  remaining: number | null;
  queuePosition: number | null;
  mySequence: number | null;
  aheadCount: number | null;
  estimatedWaitSeconds: number | null;
  readyUntil: number | null;
  admissionState: AdmissionState | null;
}

export interface QueueStatusResult {
  status: QueueRequestStatus;
  queuePosition: number | null;
  mySequence: number | null;
  aheadCount: number | null;
  estimatedWaitSeconds: number | null;
  readyUntil: number | null;
  admissionState: AdmissionState | null;
}

export type ReserveErrorCode =
  | "RESERVE_ALREADY_RESERVED"
  | "RESERVE_SOLD_OUT"
  | "RESERVE_NOT_OPEN"
  | "EVENT_NOT_FOUND"
  | "UNAUTHORIZED"
  | "TEMPORARY_ERROR";
