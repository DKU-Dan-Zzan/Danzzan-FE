// 역할: adminContract 모듈의 API 계약과 예외 처리를 검증하는 테스트다.

import { describe, expect, it } from "vitest";
import {
  AdminContractError,
  normalizeEnglish,
  parseAdImageUploadContract,
  parseNoticeImagePresignContract,
} from "@/api/app/admin/adminContract";

describe("normalizeEnglish", () => {
  it("빈 문자열은 undefined로 정규화한다", () => {
    expect(normalizeEnglish("")).toBeUndefined();
  });

  it("공백만 있는 문자열은 undefined로 정규화한다", () => {
    expect(normalizeEnglish("   ")).toBeUndefined();
  });

  it("null과 undefined는 undefined로 정규화한다", () => {
    expect(normalizeEnglish(null)).toBeUndefined();
    expect(normalizeEnglish(undefined)).toBeUndefined();
  });

  it("앞뒤 공백을 제거한 값을 반환한다", () => {
    expect(normalizeEnglish("  Hello World  ")).toBe("Hello World");
  });

  it("정상 값은 그대로 반환한다", () => {
    expect(normalizeEnglish("Notice Title")).toBe("Notice Title");
  });
});

describe("adminContract", () => {
  it("공지 presign 응답이 data envelope에 감싸져 있어도 파싱한다", () => {
    const parsed = parseNoticeImagePresignContract(
      {
        data: {
          presignedUrl: "https://s3.example.com/presigned",
          fileUrl: "https://cdn.example.com/image.jpg",
          method: "PUT",
        },
      },
      "/api/admin/notices/images/presign",
    );

    expect(parsed).toEqual({
      presignedUrl: "https://s3.example.com/presigned",
      fileUrl: "https://cdn.example.com/image.jpg",
      imageUrl: undefined,
      method: "PUT",
      expiresAt: undefined,
    });
  });

  it("공지 presign 응답에서 fileUrl이 없으면 imageUrl을 fallback으로 사용한다", () => {
    const parsed = parseNoticeImagePresignContract(
      {
        presignedUrl: "https://s3.example.com/presigned",
        imageUrl: "https://cdn.example.com/image.jpg",
      },
      "/api/admin/notices/images/presign",
    );

    expect(parsed.fileUrl).toBe("https://cdn.example.com/image.jpg");
    expect(parsed.imageUrl).toBe("https://cdn.example.com/image.jpg");
  });

  it("공지 presign 응답에 presignedUrl이 없으면 계약 오류를 던진다", () => {
    expect(() =>
      parseNoticeImagePresignContract(
        {
          fileUrl: "https://cdn.example.com/image.jpg",
        },
        "/api/admin/notices/images/presign",
      ),
    ).toThrowError(AdminContractError);
  });

  it("광고 업로드 응답에서 fileUrl fallback을 허용한다", () => {
    const parsed = parseAdImageUploadContract(
      {
        data: {
          presignedUrl: "https://s3.example.com/presigned",
          fileUrl: "https://cdn.example.com/ad.jpg",
        },
      },
      "/api/admin/ads/images/presign",
    );

    expect(parsed).toEqual({
      presignedUrl: "https://s3.example.com/presigned",
      imageUrl: "https://cdn.example.com/ad.jpg",
      method: "PUT",
      expiresAt: undefined,
    });
  });

  it("광고 업로드 응답이 객체가 아니면 계약 오류를 던진다", () => {
    expect(() =>
      parseAdImageUploadContract(
        "invalid",
        "/api/admin/ads/upload-url",
      ),
    ).toThrowError(AdminContractError);
  });
});
