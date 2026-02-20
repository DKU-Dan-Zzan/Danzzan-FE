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
