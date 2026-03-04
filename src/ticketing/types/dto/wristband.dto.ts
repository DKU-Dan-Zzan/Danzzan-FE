// 諛깆뿏??ApiResponse ?섑띁
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    error: string;
    message: string;
    ticketId?: number;
    issuedAt?: string;
    issuerAdminName?: string;
  } | null;
}

// GET /api/admin/events ?묐떟
export interface EventSummaryDto {
  eventId: number;
  title: string;
  dayLabel: string;
  eventDate: string;
  ticketingStatus: "READY" | "OPEN" | "CLOSED";
  totalCapacity: number;
}

export interface EventListResponseDto {
  events: EventSummaryDto[];
}

// GET /api/admin/events/{eventId}/stats ?묐떟
export interface EventStatsResponseDto {
  eventId: number;
  title: string;
  eventDate: string;
  totalCapacity: number;
  totalTickets: number;
  ticketsConfirmed: number;
  ticketsIssued: number;
  issueRate: number;
  remainingCapacity: number;
}

// GET /api/admin/events/{eventId}/tickets/search ?묐떟
export interface TicketSearchItemDto {
  ticketId: number;
  studentId: string;
  name: string;
  college: string;
  major: string;
  status: "CONFIRMED" | "ISSUED";
  issuedAt: string | null;
  issuerAdminName: string | null;
}

export interface TicketSearchResponseDto {
  eventId: number;
  studentId: string;
  results: TicketSearchItemDto[];
}

// PATCH /api/admin/events/{eventId}/tickets/{ticketId}/issue ?묐떟
export interface IssueTicketResponseDto {
  ticketId: number;
  status: "ISSUED";
  issuedAt: string;
  issuerAdminId: number;
  issuerAdminName: string;
}
