// 역할: boothmapContract 모듈의 API 계약과 예외 처리를 검증하는 테스트다.

import { describe, expect, it } from "vitest";
import {
  BoothmapContractError,
  parseBoothMapContract,
  parseBoothSummaryContract,
  parsePubDetailContract,
  parsePubsContract,
} from "@/api/app/boothmap/boothmapContract";

describe("boothmapContract", () => {
  it("booth map 응답을 파싱한다", () => {
    const parsed = parseBoothMapContract(
      {
        data: {
          colleges: [
            {
              collegeId: 10,
              name: "공과대학",
              locationX: 127.11,
              locationY: 37.32,
            },
          ],
          booths: [
            {
              boothId: 1,
              name: "푸드트럭 A",
              type: "FOOD_TRUCK",
              subType: null,
              locationX: 127.12,
              locationY: 37.31,
            },
          ],
        },
      },
      "/map/booth-map?date=2026-05-12",
    );

    expect(parsed.colleges).toHaveLength(1);
    expect(parsed.booths[0]?.type).toBe("FOOD_TRUCK");
    expect(parsed.booths[0]?.subType).toBeNull();
  });

  it("유효하지 않은 booth type은 오류를 던진다", () => {
    expect(() =>
      parseBoothMapContract(
        {
          colleges: [],
          booths: [
            {
              boothId: 1,
              name: "부스",
              type: "UNKNOWN",
              locationX: 127.1,
              locationY: 37.3,
            },
          ],
        },
        "/map/booth-map",
      ),
    ).toThrow(BoothmapContractError);
  });

  it("부스 상세 응답을 파싱한다", () => {
    const parsed = parseBoothSummaryContract(
      {
        boothId: 7,
        name: "체험 부스",
        description: "설명",
        imageUrl: null,
      },
      "/map/booths/7",
    );

    expect(parsed).toEqual({
      boothId: 7,
      name: "체험 부스",
      description: "설명",
      imageUrl: null,
    });
  });

  it("주점 목록 응답을 파싱한다", () => {
    const parsed = parsePubsContract(
      [
        {
          pubId: 11,
          name: "주점",
          intro: "소개",
          department: "컴공",
          collegeId: 2,
          collegeName: "공과대학",
          mainImageUrl: "https://cdn.example.com/pub.png",
        },
      ],
      "/map/pubs",
    );

    expect(parsed[0]?.collegeName).toBe("공과대학");
  });

  it("주점 상세 응답을 파싱한다", () => {
    const parsed = parsePubDetailContract(
      {
        pubId: 3,
        name: "주점 B",
        intro: "소개",
        description: "상세",
        department: "전자",
        collegeName: "공과대학",
        instagram: "@pub",
        imageUrls: ["https://cdn.example.com/1.png"],
      },
      "/map/pubs/3",
    );

    expect(parsed.imageUrls).toHaveLength(1);
  });
  it("facility booth subType을 파싱한다", () => {
    const parsed = parseBoothMapContract(
      {
        colleges: [],
        booths: [
          {
            boothId: 10,
            name: "흡연구역 A",
            type: "FACILITY",
            subType: "SMOKING_AREA",
            locationX: 120.5,
            locationY: 88.3,
          },
        ],
      },
      "/map/booth-map",
    );

    expect(parsed.booths[0]?.subType).toBe("SMOKING_AREA");
  });
});
