import type {
  WristbandAttendee,
  WristbandSession,
  WristbandStats,
} from "@/types/model/wristband.model";

type MockAttendeeRecord = WristbandAttendee;

const sessions: WristbandSession[] = [
  {
    id: "session-2026-05-13",
    date: "2026-05-13",
    status: "open",
  },
  {
    id: "session-2026-05-14",
    date: "2026-05-14",
    status: "open",
  },
  {
    id: "session-2026-05-15",
    date: "2026-05-15",
    status: "closed",
  },
];

const attendees: MockAttendeeRecord[] = [
  {
    studentId: "20240001",
    ticketId: "T-2026-0513-0001",
    queueNumber: 12,
    name: "김주희",
    college: "공과대학",
    department: "컴퓨터공학과",
    hasWristband: false,
    ticketDate: "2026-05-13",
  },
  {
    studentId: "20240002",
    ticketId: "T-2026-0513-0002",
    queueNumber: 1,
    name: "박민수",
    college: "경영대학",
    department: "경영학과",
    hasWristband: true,
    ticketDate: "2026-05-13",
  },
  {
    studentId: "20231234",
    ticketId: "T-2026-0513-0048",
    queueNumber: 48,
    name: "이서연",
    college: "인문대학",
    department: "국어국문학과",
    hasWristband: false,
    ticketDate: "2026-05-13",
  },
  {
    studentId: "20227890",
    ticketId: "T-2026-0514-0008",
    queueNumber: 8,
    name: "정다은",
    college: "사회과학대학",
    department: "심리학과",
    hasWristband: false,
    ticketDate: "2026-05-14",
  },
  {
    studentId: "20225555",
    ticketId: "T-2026-0514-0030",
    queueNumber: 30,
    name: "홍지훈",
    college: "자연과학대학",
    department: "물리학과",
    hasWristband: true,
    ticketDate: "2026-05-14",
  },
  {
    studentId: "20221212",
    ticketId: "T-2026-0515-0004",
    queueNumber: 4,
    name: "최하늘",
    college: "예술대학",
    department: "디자인학과",
    hasWristband: true,
    ticketDate: "2026-05-15",
  },
];

const normalize = (value: string) => value.trim().toLowerCase();

const matchesIdentifier = (attendee: MockAttendeeRecord, keyword: string) => {
  const target = normalize(keyword);
  if (!target) {
    return false;
  }
  return (
    normalize(attendee.studentId) === target ||
    normalize(attendee.ticketId) === target
  );
};

const getAttendeesByDate = (date: string) =>
  attendees.filter((attendee) => attendee.ticketDate === date);

export const wristbandMock = {
  listSessions: (): WristbandSession[] => {
    return [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  },
  getStats: (date: string): WristbandStats => {
    const scoped = getAttendeesByDate(date);
    const totalTickets = scoped.length;
    const issuedCount = scoped.filter((item) => item.hasWristband).length;
    return {
      totalTickets,
      issuedCount,
      pendingCount: totalTickets - issuedCount,
    };
  },
  findAttendee: (keyword: string, date: string): WristbandAttendee | null => {
    const scoped = getAttendeesByDate(date);
    const found = scoped.find((attendee) => matchesIdentifier(attendee, keyword));
    return found ?? null;
  },
  issueWristband: (keyword: string, date: string): void => {
    const scoped = getAttendeesByDate(date);
    const attendee = scoped.find((item) => matchesIdentifier(item, keyword));
    if (!attendee) {
      throw new Error("해당 학번/티켓ID를 찾을 수 없습니다.");
    }
    attendee.hasWristband = true;
  },
};
