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
});
