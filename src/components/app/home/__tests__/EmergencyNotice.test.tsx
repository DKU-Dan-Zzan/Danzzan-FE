// 역할: 홈 긴급공지 컴포넌트가 기본 구조로 렌더링되는지 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import EmergencyNotice from "@/components/app/home/EmergencyNotice";

describe("EmergencyNotice", () => {
  it("긴급공지 카드는 기본 notice border 토큰을 적용하고 하단 전용 구분선은 사용하지 않는다", () => {
    const markup = renderToStaticMarkup(
      <EmergencyNotice
        notice={{
          id: 1,
          title: "긴급공지 및 내용",
          content: "단국존 입장 시 우산 반입이 불가합니다.",
          updatedAt: "2026-05-12T09:00:00+09:00",
        }}
      />,
    );

    expect(markup).toContain("border-[var(--home-notice-border)]");
    expect(markup).not.toContain("border-b-[var(--home-notice-bottom-divider)]");
  });
});
