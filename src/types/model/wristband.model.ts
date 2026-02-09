export interface WristbandStats {
  totalTickets: number;
  issuedCount: number;
  pendingCount: number;
}

export interface WristbandAttendee {
  studentId: string;
  ticketId: string;
  queueNumber: number | null;
  name: string;
  college: string;
  department: string;
  hasWristband: boolean;
  ticketDate: string;
}

export type WristbandSessionStatus = "open" | "closed" | "unknown";

export interface WristbandSession {
  id: string;
  date: string;
  status: WristbandSessionStatus;
}
