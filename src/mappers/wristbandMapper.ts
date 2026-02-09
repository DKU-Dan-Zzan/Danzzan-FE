import type {
  WristbandAttendeeDto,
  WristbandSessionDto,
  WristbandStatsDto,
} from "@/types/dto/wristband.dto";
import type {
  WristbandAttendee,
  WristbandSession,
  WristbandSessionStatus,
  WristbandStats,
} from "@/types/model/wristband.model";

const mapSessionStatus = (status?: string): WristbandSessionStatus => {
  switch (status) {
    case "open":
    case "closed":
      return status;
    default:
      return "unknown";
  }
};

export const mapWristbandStatsDtoToModel = (
  dto?: WristbandStatsDto,
): WristbandStats => {
  return {
    totalTickets: dto?.totalTickets ?? 0,
    issuedCount: dto?.issuedCount ?? 0,
    pendingCount: dto?.pendingCount ?? 0,
  };
};

export const mapWristbandAttendeeDtoToModel = (
  dto: WristbandAttendeeDto,
): WristbandAttendee => {
  return {
    studentId: dto.studentId ?? "",
    ticketId: dto.ticketId ?? "",
    queueNumber: dto.queueNumber ?? null,
    name: dto.name ?? "",
    college: dto.college ?? "",
    department: dto.department ?? "",
    hasWristband: dto.hasWristband ?? false,
    ticketDate: dto.ticketDate ?? "",
  };
};

export const mapWristbandSessionDtoToModel = (
  dto: WristbandSessionDto,
): WristbandSession => {
  return {
    id: dto.id?.toString() ?? "",
    date: dto.date ?? "",
    status: mapSessionStatus(dto.status),
  };
};
