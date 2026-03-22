// 역할: 광고 배너 카드의 토큰 기반 스타일과 링크 접근성을 검증하는 테스트입니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TicketingAdBannerCard } from "@/components/ticketing/panels/TicketingAdBannerCard";

describe("TicketingAdBannerCard", () => {
  it("광고 슬롯 폭을 디자인 토큰으로 고정한다", () => {
    const markup = renderToStaticMarkup(<TicketingAdBannerCard ad={null} />);

    expect(markup).toContain("max-w-[var(--ticketing-ad-slot-max-width)]");
    expect(markup).not.toContain("max-w-[18rem]");
  });

  it("링크 광고는 키보드 focus-visible 링을 제공한다", () => {
    const markup = renderToStaticMarkup(
      <TicketingAdBannerCard
        ad={{
          placement: "WAITING_ROOM_MAIN",
          imageUrl: "https://example.com/ad.png",
          linkUrl: "https://example.com",
          altText: "테스트 광고 배너",
          updatedAt: "2026-03-22T00:00:00Z",
          isActive: true,
        }}
      />,
    );

    expect(markup).toContain("focus-visible:outline-none");
    expect(markup).toContain("focus-visible:ring-2");
    expect(markup).toContain("focus-visible:ring-[var(--ring)]");
  });
});
