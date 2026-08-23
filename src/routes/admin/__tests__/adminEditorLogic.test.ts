// 역할: 관리자 공지/광고 에디터 유효성·payload 변환 로직을 단위 테스트합니다.
import { describe, expect, it, vi } from "vitest";
import type { NoticeResponse } from "@/api/app/admin/adminApi";
import {
  DEFAULT_ADMIN_AD_PLACEMENT,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_NOTICE_IMAGE_COUNT,
  buildAdPayload,
  buildEmergencyPayload,
  buildNoticePayload,
  createEmptyNoticeForm,
  createNoticeEditForm,
  createUploadFailureMessage,
  validateAdPayload,
  validateImageFile,
  validateNoticePayload,
} from "@/routes/admin/adminEditorLogic";

describe("adminEditorLogic", () => {
  it("새 공지 기본 폼을 생성한다", () => {
    expect(createEmptyNoticeForm()).toEqual({
      title: "",
      content: "",
      author: "개발팀",
      isPinned: false,
      thumbnailImageUrl: "",
      images: [],
      titleEn: "",
      contentEn: "",
      enIsManual: false,
    });
  });

  it("기존 공지에서 수정 폼을 생성한다", () => {
    const notice: NoticeResponse = {
      id: 1,
      title: "공지",
      content: "내용",
      author: "총학생회",
      category: null,
      isPinned: undefined,
      isEmergency: true,
      thumbnailImageUrl: null,
      imageUrls: ["https://cdn.example.com/1.png"],
      createdAt: "2026-03-22T00:00:00Z",
      updatedAt: "2026-03-22T00:00:00Z",
      titleEn: "Notice",
      contentEn: "Content",
      enIsManual: true,
    };

    expect(createNoticeEditForm(notice)).toEqual({
      id: 1,
      title: "공지",
      content: "내용",
      author: "총학생회",
      isPinned: true,
      thumbnailImageUrl: "",
      images: ["https://cdn.example.com/1.png"],
      titleEn: "Notice",
      contentEn: "Content",
      enIsManual: true,
    });
  });

  it("영문 필드가 비어있는 공지는 빈 문자열과 enIsManual false로 폼을 만든다", () => {
    const notice: NoticeResponse = {
      id: 2,
      title: "공지2",
      content: "내용2",
      author: "개발팀",
      createdAt: "2026-03-22T00:00:00Z",
      updatedAt: "2026-03-22T00:00:00Z",
    };

    const form = createNoticeEditForm(notice);
    expect(form.titleEn).toBe("");
    expect(form.contentEn).toBe("");
    expect(form.enIsManual).toBe(false);
  });

  it("공지 폼에서 요청 payload를 만든다", () => {
    const payload = buildNoticePayload({
      title: " 제목 ",
      content: " 내용 ",
      author: "개발팀",
      isPinned: false,
      thumbnailImageUrl: " ",
      images: ["a"],
      titleEn: "",
      contentEn: "",
      enIsManual: false,
    });

    expect(payload).toEqual({
      title: "제목",
      content: "내용",
      author: "개발팀",
      isPinned: false,
      thumbnailImageUrl: null,
      images: ["a"],
      titleEn: undefined,
      contentEn: undefined,
    });
  });

  it("영문 필드가 비어 있으면 payload에서 undefined로 보내 자동 번역을 유지한다", () => {
    const payload = buildNoticePayload({
      title: "제목",
      content: "내용",
      author: "개발팀",
      isPinned: false,
      thumbnailImageUrl: "",
      images: [],
      titleEn: "   ",
      contentEn: "",
      enIsManual: false,
    });

    expect(payload.titleEn).toBeUndefined();
    expect(payload.contentEn).toBeUndefined();
    expect("titleEn" in payload).toBe(true);
    expect(JSON.stringify(payload)).not.toContain('"titleEn":""');
  });

  it("영문 필드를 직접 입력하면 앞뒤 공백만 제거한 값이 payload에 실린다", () => {
    const payload = buildNoticePayload({
      title: "제목",
      content: "내용",
      author: "개발팀",
      isPinned: false,
      thumbnailImageUrl: "",
      images: [],
      titleEn: "  Manual Title  ",
      contentEn: "  Manual Content  ",
      enIsManual: true,
    });

    expect(payload.titleEn).toBe("Manual Title");
    expect(payload.contentEn).toBe("Manual Content");
  });

  it("광고 폼에서 요청 payload를 만든다", () => {
    const payload = buildAdPayload({
      title: " 배너 ",
      imageUrl: " https://cdn.example.com/banner.png ",
      linkUrl: " https://example.com/landing ",
      placement: "HOME_BOTTOM",
    });

    expect(payload).toEqual({
      title: "배너",
      imageUrl: "https://cdn.example.com/banner.png",
      linkUrl: "https://example.com/landing",
      placement: DEFAULT_ADMIN_AD_PLACEMENT,
    });
  });

  it("긴급 공지 payload는 빈 입력도 명시적으로 초기화한다", () => {
    expect(buildEmergencyPayload("   ", true)).toEqual({
      message: "",
      isActive: true,
    });
  });

  it("필수 필드 누락시 검증 메시지를 반환한다", () => {
    expect(
      validateNoticePayload({
        title: "",
        content: "내용",
        author: "개발팀",
        isPinned: false,
        thumbnailImageUrl: null,
        images: [],
      }),
    ).toBe("제목과 내용을 모두 입력해 주세요.");

    expect(
      validateAdPayload({
        title: "배너",
        imageUrl: "",
        linkUrl: null,
        placement: DEFAULT_ADMIN_AD_PLACEMENT,
      }),
    ).toBe("이미지를 업로드해 주세요.");
  });

  it("광고 이동 URL은 https 형식을 검증한다", () => {
    expect(
      validateAdPayload({
        title: "배너",
        imageUrl: "https://cdn.example.com/banner.png",
        linkUrl: "http://example.com",
        placement: DEFAULT_ADMIN_AD_PLACEMENT,
      }),
    ).toBe("광고 이동 URL은 https 주소만 입력할 수 있습니다.");

    expect(
      validateAdPayload({
        title: "배너",
        imageUrl: "https://cdn.example.com/banner.png",
        linkUrl: "not-a-url",
        placement: DEFAULT_ADMIN_AD_PLACEMENT,
      }),
    ).toBe("광고 이동 URL 형식이 올바르지 않습니다.");
  });

  it("이미지 파일 타입과 용량을 검증한다", () => {
    const wrongType = new File(["x"], "wrong.gif", { type: "image/gif" });
    expect(validateImageFile(wrongType)).toBe(
      "이미지는 JPG, JPEG, PNG, WEBP 형식만 업로드할 수 있습니다.",
    );

    const tooLarge = new File([new Uint8Array(MAX_IMAGE_UPLOAD_BYTES + 1)], "large.jpg", {
      type: "image/jpeg",
    });
    expect(validateImageFile(tooLarge, "이미지 크기는 최대 5MB까지 업로드할 수 있습니다.")).toBe(
      "이미지 크기는 최대 5MB까지 업로드할 수 있습니다.",
    );
  });

  it("S3 업로드 실패 메시지를 생성한다", async () => {
    const errorTextSpy = vi.fn(async () => "signature mismatch");
    const response = {
      ok: false,
      status: 403,
      statusText: "Forbidden",
      text: errorTextSpy,
    } as unknown as Response;

    await expect(createUploadFailureMessage("광고 이미지 업로드 실패", response)).resolves.toContain(
      "403 Forbidden",
    );
  });

  it("공지 이미지 최대 개수를 노출한다", () => {
    expect(MAX_NOTICE_IMAGE_COUNT).toBe(10);
  });
});
