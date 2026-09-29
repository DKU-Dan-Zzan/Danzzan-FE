// 역할: queryKeys 모듈의 동작과 회귀 여부를 검증하는 테스트다.

import { describe, expect, it } from "vitest";
import { appQueryKeys } from "@/lib/query/queryKeys";

describe("appQueryKeys", () => {
  it("notice 목록 키에 언어와 검색/페이지 파라미터를 포함한다", () => {
    expect(
      appQueryKeys.noticeList("ko", { keyword: "행사", category: "ALL", page: 2, size: 10 }),
    ).toEqual(["notice", "list", "ko", { keyword: "행사", category: "ALL", page: 2, size: 10 }]);
  });

  it("timetable 공연 키에 언어와 날짜 파라미터를 포함한다", () => {
    expect(appQueryKeys.timetablePerformances("en", "2026-05-13")).toEqual([
      "timetable",
      "performances",
      "en",
      { date: "2026-05-13" },
    ]);
  });

  it("my-ticket 목록 키를 세션별로 구분한다", () => {
    expect(appQueryKeys.myTicketList(1)).toEqual(["ticketing", "my-ticket", "list", 1]);
    expect(appQueryKeys.myTicketList(1)).not.toEqual(appQueryKeys.myTicketList(2));
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
    expect(appQueryKeys.boothMapData("ko", "2026-09-09")).toEqual([
      "boothmap",
      "data",
      "ko",
      { date: "2026-09-09" },
    ]);
  });
});
