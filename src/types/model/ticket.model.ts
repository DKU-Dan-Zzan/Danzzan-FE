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

export interface QueueEnterResult {
  status: QueueRequestStatus;
  remaining: number | null;
}

export interface QueueStatusResult {
  status: QueueRequestStatus;
}

export type ReserveErrorCode =
  | "RESERVE_ALREADY_RESERVED"
  | "RESERVE_SOLD_OUT"
  | "RESERVE_NOT_OPEN"
  | "EVENT_NOT_FOUND"
  | "UNAUTHORIZED"
  | "TEMPORARY_ERROR";
