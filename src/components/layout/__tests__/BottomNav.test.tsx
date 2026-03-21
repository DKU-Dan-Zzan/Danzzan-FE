import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import BottomNav from "@/components/layout/BottomNav";

function renderBottomNav(location: string) {
  return renderToStaticMarkup(
    <StaticRouter location={location}>
      <BottomNav />
    </StaticRouter>,
  );
}

describe("BottomNav", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("SSR 렌더링에서 useLayoutEffect 경고를 출력하지 않는다", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    renderBottomNav("/map");

    const hasUseLayoutEffectWarning = errorSpy.mock.calls.some(([firstArg]) =>
      String(firstArg).includes("useLayoutEffect does nothing on the server"),
    );
    expect(hasUseLayoutEffectWarning).toBe(false);
  });

  it("활성 탭 인디케이터가 활성 아이콘/텍스트와 같은 토큰을 사용한다", () => {
    const markup = renderBottomNav("/map");

    expect(markup).toContain("text-[var(--app-nav-text-active)]");
    expect(markup).toContain("bg-[var(--app-nav-text-active)]");
    expect(markup).not.toContain("bg-[var(--accent)]");
  });

  it("활성 상태 전환용 마이크로 애니메이션 클래스를 포함한다", () => {
    const markup = renderBottomNav("/notice");

    expect(markup).toContain("active:scale-[0.97]");
    expect(markup).toContain("motion-reduce:transform-none");
    expect(markup).toContain("-translate-y-[1px] scale-[1.04]");
    expect(markup).toContain("opacity-100 scale-x-100");
    expect(markup).toContain("opacity-0 scale-x-50");
  });
});
