import type {
  WristbandAttendee,
  WristbandSession,
  WristbandStats,
} from "@/ticketing/types/model/wristband.model";

type MockAttendeeRecord = WristbandAttendee & { eventId: string };

const sessions: WristbandSession[] = [
  {
    id: "1",
    title: "5월 13일 공연 팔찌 배부",
    dayLabel: "DAY 2",
    date: "2026-05-13",
    status: "open",
    totalCapacity: 5000,
  },
  {
    id: "2",
    title: "5월 14일 공연 팔찌 배부",
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
    name: "박주희",
    college: "공과대학",
    department: "컴퓨터공학과",
    hasWristband: false,
    issuedAt: null,
    issuerAdminName: null,
    eventId: "1",
  },
  {
    ticketId: 2,
    studentId: "20240002",
    name: "박민수",
    college: "경영대학",
    department: "경영학과",
    hasWristband: true,
    issuedAt: "2026-05-13T10:30:00",
    issuerAdminName: "김관리",
    eventId: "1",
  },
  {
    ticketId: 3,
    studentId: "20231234",
    name: "이서연",
    college: "인문대학",
    department: "국어국문학과",
    hasWristband: false,
    issuedAt: null,
    issuerAdminName: null,
    eventId: "1",
  },
  {
    ticketId: 5,
    studentId: "32221234",
    name: "테스트학생",
    college: "테스트대학",
    department: "테스트학과",
    hasWristband: false,
    issuedAt: null,
    issuerAdminName: null,
    eventId: "1",
  },
  {
    ticketId: 4,
    studentId: "20227890",
    name: "정다은",
    college: "사회과학대학",
    department: "심리학과",
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
      throw new Error("해당 학번을 찾을 수 없습니다.");
    }
    attendee.hasWristband = true;
    attendee.issuedAt = new Date().toISOString();
    attendee.issuerAdminName = "관리자";
  },
  cancelWristband: (keyword: string, eventId: string): void => {
    const scoped = getAttendeesByEvent(eventId);
    const attendee = scoped.find((a) => a.studentId === keyword || String(a.ticketId) === keyword);
    if (!attendee) {
      throw new Error("해당 학번을 찾을 수 없습니다.");
    }
    attendee.hasWristband = false;
    attendee.issuedAt = null;
    attendee.issuerAdminName = null;
  },
};
