// 역할: noticeContract 모듈의 API 계약과 예외 처리를 검증하는 테스트다.

import { describe, expect, it } from "vitest";
import {
  NoticeContractError,
  parseNoticeDetailContract,
  parseNoticeListContract,
} from "@/api/app/notice/noticeContract";

describe("noticeContract", () => {
  it("공지 목록 계약을 파싱한다", () => {
    const payload = {
      content: [
        {
          id: 3,
          title: "공지",
          content: "내용",
          author: "관리자",
          category: null,
          isPinned: false,
          thumbnailImageUrl: null,
          imageUrls: [],
          createdAt: "2026-03-22T00:00:00Z",
          updatedAt: "2026-03-22T00:00:00Z",
        },
      ],
      totalElements: 1,
      totalPages: 1,
      size: 10,
      number: 0,
      first: true,
      last: true,
      numberOfElements: 1,
      empty: false,
    };

    expect(parseNoticeListContract(payload, "/notices")).toEqual(payload);
  });

  it("공지 상세 계약을 파싱한다", () => {
    const payload = {
      id: 3,
      title: "공지",
      content: "내용",
      author: "관리자",
      category: null,
      isPinned: false,
      thumbnailImageUrl: null,
      imageUrls: [],
      createdAt: "2026-03-22T00:00:00Z",
      updatedAt: "2026-03-22T00:00:00Z",
    };

    expect(parseNoticeDetailContract(payload, "/notices/3")).toEqual(payload);
  });

  it("목록 content가 배열이 아니면 NoticeContractError를 던진다", () => {
    expect(() =>
      parseNoticeListContract(
        {
          content: null,
          totalElements: 0,
          totalPages: 0,
          size: 10,
          number: 0,
          first: true,
          last: true,
          numberOfElements: 0,
          empty: true,
        },
        "/notices",
      ),
    ).toThrow(NoticeContractError);
  });
});

