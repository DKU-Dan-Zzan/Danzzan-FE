// 역할: 부스맵이 쓰는 축제 날짜. 실제 값은 서버 설정(festivalCalendar)에서 온다.
//
// 예전에는 이 파일에 날짜가 박혀 있었다. 화면이 실시간으로 따라 바뀌어야 하는 곳은
// useFestivalDates() 훅을 쓰고, 훅을 쓸 수 없는 곳(프리패치 등)만 아래 함수를 쓴다.

import {
  formatFestivalDateLabel,
  getDefaultFestivalDate,
  getFestivalDates,
  isFestivalDate,
  toFestivalDateOptions,
  type FestivalDateOption,
} from "@/lib/app/festival/festivalCalendar";

export type FestivalDate = string;
export type { FestivalDateOption };

export { formatFestivalDateLabel, isFestivalDate };

/** 호출 시점의 운영 날짜. 모듈 로드 시점에 고정되지 않도록 함수로 둔다. */
export function getFestivalDateOptions(): FestivalDateOption[] {
  return toFestivalDateOptions(getFestivalDates());
}

export { getFestivalDates, getDefaultFestivalDate };
