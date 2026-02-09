export type TicketStatus = "issued" | "used" | "cancelled" | "unknown";

export interface Ticket {
  id: string;
  status: TicketStatus;
  eventName: string;
  eventDate: string;
  issuedAt: string;
  seat: string;
  qrCodeUrl: string;
}
