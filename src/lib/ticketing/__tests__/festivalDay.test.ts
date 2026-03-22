// 역할: 티켓팅 도메인 동작을 검증하는 테스트 모듈입니다.
import { describe, expect, it } from "vitest";
import {
  DEFAULT_FESTIVAL_DAY_RULES,
  resolveTicketDayLabel,
} from "@/lib/ticketing/festivalDay";

describe("resolveTicketDayLabel", () => {
  it("ISO 날짜로 DAY를 계산한다", () => {
    expect(resolveTicketDayLabel({ eventDate: "2026-05-13" })).toBe("DAY 2");
    expect(resolveTicketDayLabel({ eventDate: "2026-05-14T19:00:00+09:00" })).toBe("DAY 3");
  });

  it("한글 날짜/슬래시 날짜로도 DAY를 계산한다", () => {
    expect(resolveTicketDayLabel({ eventDate: "05월 13일 (화) 19:00" })).toBe("DAY 2");
    expect(resolveTicketDayLabel({ eventDate: "5/14" })).toBe("DAY 3");
  });

  it("날짜 계산이 불가능하면 eventName의 n일차를 fallback으로 사용한다", () => {
    expect(
      resolveTicketDayLabel({
        eventDate: "",
        eventName: "단국존 2일차 메인 티켓",
      }),
    ).toBe("DAY 2");
  });

  it("날짜/이벤트명 모두 불충분하면 DAY 미정을 반환한다", () => {
    expect(resolveTicketDayLabel({ eventDate: "미정", eventName: "단국존 선예매 티켓" })).toBe("DAY 미정");
  });

  it("커스텀 rules를 주입해 축제 일정 확장에 대응할 수 있다", () => {
    const extendedRules = [
      ...DEFAULT_FESTIVAL_DAY_RULES,
      { dayNumber: 4, date: "2026-05-15" },
    ];

    expect(
      resolveTicketDayLabel({
        eventDate: "2026-05-15",
        rules: extendedRules,
      }),
    ).toBe("DAY 4");
  });
});
