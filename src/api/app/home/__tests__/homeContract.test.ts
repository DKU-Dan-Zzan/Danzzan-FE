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

  it("필수 필드 누락 시 HomeContractError를 던진다", () => {
    expect(() => parseHomeImagesContract([{ id: 1 }], "/home/images")).toThrow(HomeContractError);
  });
});

