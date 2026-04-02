// 역할: boothmap 화면 컴포넌트의 Primary Filter Chips.test 동작을 검증하는 테스트입니다.
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PrimaryFilterChips from "@/components/app/boothmap/PrimaryFilterChips";

describe("PrimaryFilterChips", () => {
  it("칩 버튼에 키보드 포커스 링 클래스를 포함한다", () => {
    const markup = renderToStaticMarkup(
      <PrimaryFilterChips
        value="ALL"
        onChange={vi.fn()}
      />,
    );

    expect(markup).toContain("focus-visible:outline-none");
    expect(markup).toContain("focus-visible:ring-2");
    expect(markup).toContain("focus-visible:ring-[var(--ring)]");
  });

  it("활성 칩은 주점 마커 토큰 색상을 사용한다", () => {
    const markup = renderToStaticMarkup(
      <PrimaryFilterChips
        value="ALL"
        onChange={vi.fn()}
      />,
    );

    expect(markup).toContain("border-[var(--boothmap-chip-selected-border)]");
    expect(markup).toContain("bg-[var(--boothmap-chip-selected-bg)]");
  });
});
