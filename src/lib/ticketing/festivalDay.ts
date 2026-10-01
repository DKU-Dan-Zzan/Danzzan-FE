// 역할: 날짜를 축제 일차/표시 포맷으로 변환하는 도메인 유틸을 제공합니다.
export type FestivalDayRule = {
  dayNumber: number;
  date: string;
};

export const DEFAULT_FESTIVAL_DAY_RULES: FestivalDayRule[] = [
  { dayNumber: 2, date: "2026-05-07" },
  { dayNumber: 3, date: "2026-05-08" },
];

const toMonthDayKey = (month: number, day: number): string => {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const extractMonthDayKey = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const korean = trimmed.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (korean) {
    return toMonthDayKey(Number(korean[1]), Number(korean[2]));
  }

  const ymd = trimmed.match(/(\d{4})[-./](\d{1,2})[-./](\d{1,2})/);
  if (ymd) {
    return toMonthDayKey(Number(ymd[2]), Number(ymd[3]));
  }

  const md = trimmed.match(/(?:^|\D)(\d{1,2})[-/](\d{1,2})(?:\D|$)/);
  if (md) {
    return toMonthDayKey(Number(md[1]), Number(md[2]));
  }

  return null;
};

const getDayNumberFromEventName = (value: string): number | null => {
  const matched = value.match(/(?:DAY\s*(\d+)|(\d+)\s*일차)/i);
  if (!matched) {
    return null;
  }

  const dayNumber = Number(matched[1] ?? matched[2]);
  return Number.isFinite(dayNumber) ? dayNumber : null;
};

export const resolveTicketDayLabel = (input: {
  eventDate?: string | null;
  eventName?: string | null;
  rules?: FestivalDayRule[];
}): string => {
  // 관리자 설정으로 만든 이벤트명은 연도와 실제 축제 일차를 반영한다.
  const configuredDay = input.eventName?.match(/DAY\s*(\d+)\s*$/i);
  if (configuredDay) return `DAY ${Number(configuredDay[1])}`;
  const rules = input.rules ?? DEFAULT_FESTIVAL_DAY_RULES;
  const dayByMonthDayKey = new Map<string, number>();
  for (const rule of rules) {
    const key = extractMonthDayKey(rule.date);
    if (!key) {
      continue;
    }
    dayByMonthDayKey.set(key, rule.dayNumber);
  }

  const eventDateKey = input.eventDate ? extractMonthDayKey(input.eventDate) : null;
  if (eventDateKey && dayByMonthDayKey.has(eventDateKey)) {
    return `DAY ${dayByMonthDayKey.get(eventDateKey)}`;
  }

  const dayFromName = input.eventName ? getDayNumberFromEventName(input.eventName) : null;
  if (dayFromName != null) {
    return `DAY ${dayFromName}`;
  }

  return "DAY 미정";
};
