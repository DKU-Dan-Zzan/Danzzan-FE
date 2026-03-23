// 역할: homeContract 모듈의 API 계약과 예외 처리를 검증하는 테스트다.

import { describe, expect, it } from "vitest";
import {
  HomeContractError,
  parseEmergencyNoticeContract,
  parseHomeImagesContract,
} from "@/api/app/home/homeContract";

describe("homeContract", () => {
  it("home 이미지 배열을 파싱한다", () => {
    expect(
      parseHomeImagesContract(
        [{ id: 1, imageUrl: "https://cdn.example.com/home.jpg", version: "v1" }],
        "/home/images",
      ),
    ).toEqual([{ id: 1, imageUrl: "https://cdn.example.com/home.jpg", version: "v1" }]);
  });

  it("긴급 공지 null 응답을 허용한다", () => {
    expect(parseEmergencyNoticeContract(null, "/home/emergencyNotice")).toBeNull();
  });

  it("홈 긴급 공지 응답(id/content/updatedAt)을 파싱한다", () => {
    expect(
      parseEmergencyNoticeContract(
        {
          id: 1,
          content: "우천 시 일부 공연이 지연될 수 있습니다.",
          updatedAt: "52분 전",
        },
        "/home/emergencyNotice",
      ),
    ).toEqual({
      id: 1,
      content: "우천 시 일부 공연이 지연될 수 있습니다.",
      updatedAt: "52분 전",
    });
  });

  it("홈 긴급 공지의 updatedAt 누락을 허용한다", () => {
    expect(
      parseEmergencyNoticeContract(
        {
          id: 1,
          content: "공지 내용",
        },
        "/home/emergencyNotice",
      ),
    ).toEqual({
      id: 1,
      content: "공지 내용",
      updatedAt: null,
    });
  });

  it("홈 긴급 공지 204(empty string) 응답을 허용한다", () => {
    expect(parseEmergencyNoticeContract("", "/home/emergencyNotice")).toBeNull();
  });

  it("필수 필드 누락 시 HomeContractError를 던진다", () => {
    expect(() => parseHomeImagesContract([{ id: 1 }], "/home/images")).toThrow(HomeContractError);
  });
});
