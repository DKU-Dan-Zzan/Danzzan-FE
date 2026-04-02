// 역할: queryKeys 모듈의 동작과 회귀 여부를 검증하는 테스트다.

import { describe, expect, it } from "vitest";
import { appQueryKeys } from "@/lib/query/queryKeys";

describe("appQueryKeys", () => {
  it("notice 목록 키에 검색/페이지 파라미터를 포함한다", () => {
    expect(
      appQueryKeys.noticeList({ keyword: "행사", category: "ALL", page: 2, size: 10 }),
    ).toEqual(["notice", "list", { keyword: "행사", category: "ALL", page: 2, size: 10 }]);
  });

  it("timetable 공연 키에 날짜 파라미터를 포함한다", () => {
    expect(appQueryKeys.timetablePerformances("2026-05-13")).toEqual([
      "timetable",
      "performances",
      { date: "2026-05-13" },
    ]);
  });

  it("my-ticket 목록 키를 고정 포맷으로 제공한다", () => {
    expect(appQueryKeys.myTicketList()).toEqual(["ticketing", "my-ticket", "list"]);
    expect(appQueryKeys.myPageProfile()).toEqual(["mypage", "profile"]);
  });

  it("admin/boothmap 키를 파라미터 포함 포맷으로 제공한다", () => {
    expect(appQueryKeys.adminEmergencyNotice()).toEqual(["admin", "emergency-notice"]);
    expect(
      appQueryKeys.adminNotices({
        keyword: "긴급",
        status: "ACTIVE",
        page: 0,
        size: 10,
      }),
    ).toEqual([
      "admin",
      "notices",
      {
        keyword: "긴급",
        status: "ACTIVE",
        page: 0,
        size: 10,
      },
    ]);
    expect(appQueryKeys.boothMapData("2026-05-12")).toEqual(["boothmap", "data", { date: "2026-05-12" }]);
  });
});
