import type {
  WristbandAttendee,
  WristbandSession,
  WristbandStats,
} from "@/ticketing/types/model/wristband.model";

type MockAttendeeRecord = WristbandAttendee & { eventId: string };

const sessions: WristbandSession[] = [
  {
    id: "1",
    title: "5/13 Wristband",
    dayLabel: "DAY 2",
    date: "2026-05-13",
    status: "open",
    totalCapacity: 5000,
  },
  {
    id: "2",
    title: "5/14 Wristband",
    dayLabel: "DAY 3",
    date: "2026-05-14",
    status: "open",
    totalCapacity: 5000,
  },
];

const attendees: MockAttendeeRecord[] = [
  {
    ticketId: 1,
    studentId: "20240001",
    name: "Student A",
    college: "Engineering",
    department: "Computer Science",
    hasWristband: false,
    issuedAt: null,
    issuerAdminName: null,
    eventId: "1",
  },
  {
    ticketId: 2,
    studentId: "20240002",
    name: "Student B",
    college: "Business",
    department: "Business Administration",
    hasWristband: true,
    issuedAt: "2026-05-13T10:30:00",
    issuerAdminName: "Admin",
    eventId: "1",
  },
  {
    ticketId: 3,
    studentId: "20231234",
    name: "Student C",
    college: "Humanities",
    department: "Korean Literature",
    hasWristband: false,
    issuedAt: null,
    issuerAdminName: null,
    eventId: "1",
  },
  {
    ticketId: 5,
    studentId: "32221234",
    name: "Student D",
    college: "Test College",
    department: "Test Department",
    hasWristband: false,
    issuedAt: null,
    issuerAdminName: null,
    eventId: "1",
  },
  {
    ticketId: 4,
    studentId: "20227890",
    name: "Student E",
    college: "Social Science",
    department: "Psychology",
    hasWristband: false,
    issuedAt: null,
    issuerAdminName: null,
    eventId: "2",
  },
];

const getAttendeesByEvent = (eventId: string) =>
  attendees.filter((a) => a.eventId === eventId);

export const wristbandMock = {
  listSessions: (): WristbandSession[] => {
    return [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  },
  getStats: (eventId: string): WristbandStats => {
    const scoped = getAttendeesByEvent(eventId);
    const totalTickets = scoped.length;
    const issuedCount = scoped.filter((item) => item.hasWristband).length;
    return {
      totalTickets,
      issuedCount,
      pendingCount: totalTickets - issuedCount,
    };
  },
  findAttendee: (studentId: string, eventId: string): WristbandAttendee | null => {
    const scoped = getAttendeesByEvent(eventId);
    const found = scoped.find((a) => a.studentId === studentId.trim());
    if (!found) return null;
    const { eventId: _, ...attendee } = found;
    return attendee;
  },
  issueWristband: (keyword: string, eventId: string): void => {
    const scoped = getAttendeesByEvent(eventId);
    const attendee = scoped.find((a) => a.studentId === keyword || String(a.ticketId) === keyword);
    if (!attendee) {
      throw new Error("?대떦 ?숇쾲??李얠쓣 ???놁뒿?덈떎.");
    }
    attendee.hasWristband = true;
    attendee.issuedAt = new Date().toISOString();
    attendee.issuerAdminName = "愿由ъ옄";
  },
  cancelWristband: (keyword: string, eventId: string): void => {
    const scoped = getAttendeesByEvent(eventId);
    const attendee = scoped.find((a) => a.studentId === keyword || String(a.ticketId) === keyword);
    if (!attendee) {
      throw new Error("?대떦 ?숇쾲??李얠쓣 ???놁뒿?덈떎.");
    }
    attendee.hasWristband = false;
    attendee.issuedAt = null;
    attendee.issuerAdminName = null;
  },
};
