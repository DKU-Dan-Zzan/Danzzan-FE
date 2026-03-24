// 역할: timetableContract 모듈의 API 계약과 예외 처리를 검증하는 테스트다.

import { describe, expect, it } from "vitest";
import {
  TimetableContractError,
  parseContentImagesContract,
  parsePerformancesContract,
} from "@/api/app/timetable/timetableContract";

describe("timetableContract", () => {
  it("공연 타임테이블 계약을 파싱한다", () => {
    const payload = {
      date: "2026-05-13",
      performances: [
        {
          performanceId: 10,
          startTime: "2026-05-13T18:00:00+09:00",
          endTime: "2026-05-13T18:30:00+09:00",
          artistId: 7,
          artistName: "아티스트",
          artistImageUrl: null,
          artistDescription: null,
          stage: "MAIN",
        },
      ],
    };

    expect(parsePerformancesContract(payload, "/timetable/performances")).toEqual(payload);
  });

  it("콘텐츠 이미지 계약을 파싱한다", () => {
    const payload = [
      {
        id: 1,
        name: "포스터",
        previewImageUrl: "https://cdn.example.com/preview.png",
        detailImageUrl: "https://cdn.example.com/detail.png",
      },
    ];

    expect(parseContentImagesContract(payload, "/timetable/content-images")).toEqual(payload);
  });

  it("공연 목록이 배열이 아니면 TimetableContractError를 던진다", () => {
    expect(() =>
      parsePerformancesContract({ date: "2026-05-13", performances: null }, "/timetable/performances"),
    ).toThrow(TimetableContractError);
  });
});
