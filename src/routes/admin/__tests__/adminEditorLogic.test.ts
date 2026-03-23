// 역할: 관리자 공지/광고 에디터 유효성·payload 변환 로직을 단위 테스트합니다.
import { describe, expect, it, vi } from "vitest";
import type { NoticeResponse } from "@/api/app/admin/adminApi";
import {
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
    };

    expect(createNoticeEditForm(notice)).toEqual({
      id: 1,
      title: "공지",
      content: "내용",
      author: "총학생회",
      isPinned: true,
      thumbnailImageUrl: "",
      images: ["https://cdn.example.com/1.png"],
    });
  });

  it("공지 폼에서 요청 payload를 만든다", () => {
    const payload = buildNoticePayload({
      title: " 제목 ",
      content: " 내용 ",
      author: "개발팀",
      isPinned: false,
      thumbnailImageUrl: " ",
      images: ["a"],
    });

    expect(payload).toEqual({
      title: "제목",
      content: "내용",
      author: "개발팀",
      isPinned: false,
      thumbnailImageUrl: null,
      images: ["a"],
    });
  });

  it("광고 폼에서 요청 payload를 만든다", () => {
    const payload = buildAdPayload({
      title: " 배너 ",
      imageUrl: " https://cdn.example.com/banner.png ",
      placement: "HOME_BOTTOM",
    });

    expect(payload).toEqual({
      title: "배너",
      imageUrl: "https://cdn.example.com/banner.png",
      placement: "HOME_BOTTOM",
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
        placement: "MY_TICKET",
      }),
    ).toBe("제목과 이미지를 모두 입력해 주세요.");
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
