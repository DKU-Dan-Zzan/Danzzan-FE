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
              description: "대표 메뉴 안내",
              locationX: 127.12,
              locationY: 37.31,
              startTime: "11:00",
              endTime: "17:00",
            },
          ],
        },
      },
      "/map/booth-map?date=2026-05-12",
    );

    expect(parsed.colleges).toHaveLength(1);
    expect(parsed.booths[0]?.type).toBe("FOOD_TRUCK");
    expect(parsed.booths[0]?.subType).toBeNull();
    expect(parsed.booths[0]?.description).toBe("대표 메뉴 안내");
  });

  it("유효하지 않은 booth type이면 에러를 던진다", () => {
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
        thumbnailUrl: null,
        startTime: "11:00",
        endTime: "17:00",
      },
      "/map/booths/7",
    );

    expect(parsed).toEqual({
      boothId: 7,
      name: "체험 부스",
      description: "설명",
      imageUrl: null,
      thumbnailUrl: null,
      startTime: "11:00",
      endTime: "17:00",
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
          thumbnailUrl: "https://cdn.example.com/thumb/pub.webp",
          startTime: "18:00",
          endTime: "23:00",
        },
      ],
      "/map/pubs",
    );

    expect(parsed[0]?.collegeName).toBe("공과대학");
    expect(parsed[0]?.thumbnailUrl).toBe("https://cdn.example.com/thumb/pub.webp");
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
        thumbnailImageUrls: ["https://cdn.example.com/thumb/1.webp"],
        startTime: "18:00",
        endTime: "23:00",
      },
      "/map/pubs/3",
    );

    expect(parsed.imageUrls).toHaveLength(1);
    expect(parsed.thumbnailImageUrls).toHaveLength(1);
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
            startTime: "11:00",
            endTime: "17:00",
          },
        ],
      },
      "/map/booth-map",
    );

    expect(parsed.booths[0]?.subType).toBe("SMOKING_AREA");
  });
});
