// 역할: home 화면 Lineup Section 캡션 텍스트 스타일을 검증합니다.
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import LineupSection from "@/components/app/home/LineupSection";

describe("LineupSection", () => {
  it("기본 캡션을 bold 스타일로 렌더링한다", () => {
    const markup = renderToStaticMarkup(
      <LineupSection banners={[{ id: "b1", imageUrl: "/lineup-1.jpg", alt: "lineup 1" }]} />,
    );

    expect(markup).toContain("올해 축제를 빛낼 아티스트들을 지금 확인하세요");
    expect(markup).toContain("font-bold text-[var(--home-lineup-caption-color)]");
  });
});
