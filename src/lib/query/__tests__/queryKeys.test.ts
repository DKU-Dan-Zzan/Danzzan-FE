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
});
