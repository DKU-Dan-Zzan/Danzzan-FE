// 역할: home 화면 Poster Carousel의 포스터 래퍼 보더 렌더링을 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PosterCarousel from "@/components/app/home/PosterCarousel";

describe("PosterCarousel", () => {
  it("포스터가 있을 때 래퍼에 home-card-border 보더를 적용하지 않는다", () => {
    const markup = renderToStaticMarkup(
      <PosterCarousel posters={[{ id: "p1", imageUrl: "/poster-1.jpg", alt: "poster 1" }]} />,
    );

    expect(markup).not.toContain("rounded-none border border-[var(--home-card-border)]");
  });

  it("포스터가 없을 때 placeholder 래퍼에도 home-card-border 보더를 적용하지 않는다", () => {
    const markup = renderToStaticMarkup(<PosterCarousel posters={[]} />);

    expect(markup).not.toContain("rounded-none border border-[var(--home-card-border)]");
  });
});
