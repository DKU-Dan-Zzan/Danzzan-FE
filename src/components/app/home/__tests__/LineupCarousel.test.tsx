// 역할: home 화면 Lineup Carousel 카드 비율/배치 스타일을 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LineupCarousel from "@/components/app/home/LineupCarousel";

describe("LineupCarousel", () => {
  it("라인업 카드는 314.4x210 비율과 peeking 배치를 사용한다", () => {
    const markup = renderToStaticMarkup(
      <LineupCarousel
        banners={[
          { id: "l1", imageUrl: "/lineup-1.jpg", alt: "lineup 1" },
          { id: "l2", imageUrl: "/lineup-2.jpg", alt: "lineup 2" },
        ]}
      />,
    );

    expect(markup).toContain("touch-pan-y overflow-hidden px-[14px]");
    expect(markup).toContain("flex gap-3 transition-transform");
    expect(markup).toContain("rounded-[1.85rem]");
    expect(markup).toContain("scale-100 opacity-100 shadow-[var(--home-lineup-card-shadow)]");
    expect(markup).toContain("scale-[0.67] opacity-82");
    expect(markup).toContain("origin-right");
    expect(markup).toContain("origin-left");
    expect(markup).toContain("transition-[transform,opacity] duration-500");
    expect(markup).toContain("radial-gradient(118%_94%_at_50%_42%");
    expect(markup).toContain("inset_0_0_0_1px_rgba(255,255,255,0.24)");
    expect(markup).toContain("aspect-ratio:314.4/210");
    expect(markup).toContain("width:314.4px");
    expect(markup).toContain("transform:translateX(calc(50% - 157.2px - 1 * (314.4px + 12px)))");
  });

  it("첫 카드가 활성이어도 좌측에 마지막 카드 peeking이 가능하도록 클론 트랙을 렌더링한다", () => {
    const markup = renderToStaticMarkup(
      <LineupCarousel
        banners={[
          { id: "l1", imageUrl: "/lineup-1.jpg", alt: "lineup 1" },
          { id: "l2", imageUrl: "/lineup-2.jpg", alt: "lineup 2" },
          { id: "l3", imageUrl: "/lineup-3.jpg", alt: "lineup 3" },
        ]}
      />,
    );

    const firstImageCount = (markup.match(/\/lineup-1\.jpg/g) ?? []).length;
    const lastImageCount = (markup.match(/\/lineup-3\.jpg/g) ?? []).length;

    expect(firstImageCount).toBe(2);
    expect(lastImageCount).toBe(2);
  });
});
