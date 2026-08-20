export const FESTIVAL_DATES = [
  "2026-09-09",
  "2026-09-10",
] as const;

export const DEFAULT_FESTIVAL_DATE = FESTIVAL_DATES[0];

export type FestivalDate = (typeof FESTIVAL_DATES)[number];

export type FestivalDateOption = {
  label: string;
  value: FestivalDate;
};

export const FESTIVAL_DATE_OPTIONS: FestivalDateOption[] = FESTIVAL_DATES.map((date) => ({
  value: date,
  label: formatFestivalDateLabel(date),
}));

export function formatFestivalDateLabel(date: string) {
  const [, month = "", day = ""] = date.split("-");
  const normalizedMonth = String(Number(month));
  const normalizedDay = String(Number(day));
  return `${normalizedMonth}/${normalizedDay}`;
}

export function isFestivalDate(date: string): date is FestivalDate {
  return FESTIVAL_DATES.includes(date as FestivalDate);
}
