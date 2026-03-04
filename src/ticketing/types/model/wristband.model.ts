export interface WristbandStats {
  totalTickets: number;
  issuedCount: number;
  pendingCount: number;
}

export interface WristbandAttendee {
  ticketId: number;
  studentId: string;
  name: string;
  college: string;
  department: string;
  hasWristband: boolean;
  issuedAt: string | null;
  issuerAdminName: string | null;
}

export type WristbandSessionStatus = "open" | "closed" | "unknown";

export interface WristbandSession {
  id: string;
  title: string;
  dayLabel: string;
  date: string;
  status: WristbandSessionStatus;
  totalCapacity: number;
}
