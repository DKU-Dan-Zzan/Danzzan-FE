export interface WristbandStatsDto {
  totalTickets?: number;
  issuedCount?: number;
  pendingCount?: number;
}

export interface WristbandAttendeeDto {
  studentId?: string;
  ticketId?: string;
  queueNumber?: number;
  name?: string;
  college?: string;
  department?: string;
  hasWristband?: boolean;
  ticketDate?: string;
}

export interface WristbandSessionDto {
  id?: string | number;
  date?: string;
  status?: string;
}
