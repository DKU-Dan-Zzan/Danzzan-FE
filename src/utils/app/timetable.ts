// 역할: 타임테이블 화면에서 사용하는 날짜/시간 포맷 유틸을 제공한다.

import type { Performance } from "@/types/app/timetable/timetable.types";

/** Date -> YYYY-MM-DD */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** "18:40" -> 1120 */
export function timeStringToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

/** 현재 시각에 진행 중인 공연 반환 */
export function getCurrentPerformance(
  performances: Performance[],
  now: Date = new Date()
): Performance | null {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const current = performances.find((performance) => {
    const startMinutes = timeStringToMinutes(performance.startTime);
    const endMinutes = timeStringToMinutes(performance.endTime);

    return startMinutes <= currentMinutes && currentMinutes < endMinutes;
  });

  return current ?? null;
}