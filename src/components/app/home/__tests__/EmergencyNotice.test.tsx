// 역할: 홈 긴급공지 컴포넌트가 기본 구조로 렌더링되는지 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import EmergencyNotice from "@/components/app/home/EmergencyNotice";

describe("EmergencyNotice", () => {
  it("긴급공지 카드는 no-line 규칙을 유지하고 라운드/그라디언트 표면을 적용한다", () => {
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

    expect(markup).toContain("rounded-[var(--radius-xl)]");
    expect(markup).toContain("bg-[linear-gradient(145deg,var(--home-notice-bg-start)_0%,var(--home-notice-bg-end)_100%)]");
    expect(markup).not.toContain("border-[var(--home-notice-border)]");
  });
});
