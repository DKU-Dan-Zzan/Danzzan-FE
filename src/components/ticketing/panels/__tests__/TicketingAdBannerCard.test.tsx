// 역할: 광고 배너 카드의 토큰 기반 스타일과 링크 접근성을 검증하는 테스트입니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TicketingAdBannerCard } from "@/components/ticketing/panels/TicketingAdBannerCard";

describe("TicketingAdBannerCard", () => {
  it("광고 슬롯 폭을 디자인 토큰으로 고정한다", () => {
    const markup = renderToStaticMarkup(<TicketingAdBannerCard ads={[]} />);

    expect(markup).toContain("max-w-[var(--ticketing-ad-slot-max-width)]");
    expect(markup).not.toContain("max-w-[18rem]");
  });

  it("링크 광고는 키보드 focus-visible 링을 제공한다", () => {
    const markup = renderToStaticMarkup(
      <TicketingAdBannerCard
        ads={[
          {
            imageUrl: "https://example.com/ad.png",
            linkUrl: "https://example.com",
            alt: "테스트 광고 배너",
            updatedAt: "2026-03-22T00:00:00Z",
          },
        ]}
      />,
    );

    expect(markup).toContain('href="https://example.com"');
    expect(markup).toContain("target=\"_blank\"");
    expect(markup).toContain("rel=\"noreferrer\"");
  });

  it("내 티켓용 imageOnly 변형은 이미지 단독 배너 스타일을 사용한다", () => {
    const markup = renderToStaticMarkup(<TicketingAdBannerCard ads={[]} variant="imageOnly" />);

    expect(markup).toContain("border-[var(--timetable-card-border)]");
    expect(markup).toContain("h-[70px]");
    expect(markup).not.toContain("max-w-[var(--ticketing-ad-slot-max-width)]");
  });
});
