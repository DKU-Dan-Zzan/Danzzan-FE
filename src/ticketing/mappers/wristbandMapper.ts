import type {
  EventSummaryDto,
  EventStatsResponseDto,
  TicketSearchItemDto,
} from "@/ticketing/types/dto/wristband.dto";
import type {
  WristbandAttendee,
  WristbandSession,
  WristbandSessionStatus,
  WristbandStats,
} from "@/ticketing/types/model/wristband.model";

const mapTicketingStatus = (status: string): WristbandSessionStatus => {
  switch (status) {
    case "OPEN":
      return "open";
    case "CLOSED":
      return "closed";
    default:
      return "unknown";
  }
};

export const mapEventSummaryToSession = (
  dto: EventSummaryDto,
): WristbandSession => ({
  id: String(dto.eventId),
  title: dto.title,
  dayLabel: dto.dayLabel,
  date: dto.eventDate,
  status: mapTicketingStatus(dto.ticketingStatus),
  totalCapacity: dto.totalCapacity,
});

export const mapEventStatsToWristbandStats = (
  dto: EventStatsResponseDto,
): WristbandStats => ({
  totalTickets: dto.totalTickets,
  issuedCount: dto.ticketsIssued,
  pendingCount: dto.ticketsConfirmed,
});

export const mapTicketSearchItemToAttendee = (
  dto: TicketSearchItemDto,
): WristbandAttendee => ({
  ticketId: dto.ticketId,
  studentId: dto.studentId,
  name: dto.name,
  college: dto.college,
  department: dto.major,
  hasWristband: dto.status === "ISSUED",
  issuedAt: dto.issuedAt,
  issuerAdminName: dto.issuerAdminName,
});
