// 역할: boothmap 화면의 날짜 탭 활성 색상 스타일을 검증합니다.
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import FestivalDateTabs from "@/components/app/boothmap/FestivalDateTabs";

describe("FestivalDateTabs", () => {
  it("선택된 날짜 탭은 주점 마커 토큰 색상을 사용한다", () => {
    const markup = renderToStaticMarkup(
      <FestivalDateTabs
        dates={[
          { label: "9/9", value: "2026-09-09" },
          { label: "9/10", value: "2026-09-10" },
        ]}
        selectedDate="2026-09-09"
        onChange={vi.fn()}
      />,
    );

    expect(markup).toContain("bg-[var(--boothmap-chip-selected-bg)]");
  });
});
