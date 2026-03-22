import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../../..");

function readSource(relativePath: string) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  return fs.readFileSync(absolutePath, "utf8");
}

describe("BottomNav preload policy", () => {
  it("BottomNav는 탭 intent 이벤트에서 라우트 preload를 호출한다", () => {
    const source = readSource("src/components/layout/BottomNav.tsx");

    expect(source).toContain('import { prefetchTabDataByPath } from "@/lib/query/prefetchTabData";');
    expect(source).toContain("const warmTabRoute = (routePath: string) => {");
    expect(source).toContain("onPointerEnter={() =>");
    expect(source).toContain("onFocus={() =>");
    expect(source).toContain("onTouchStart={() =>");
    expect(source).toContain("onClick={() =>");
    expect(source).toContain("markBottomNavTransitionStart(to);");
    expect(source).toContain("warmTabRoute(to);");
    expect(source).toContain("void preloadRouteByPath(routePath);");
    expect(source).toContain("void prefetchTabDataByPath(routePath);");
  });

  it("routePreload 유틸은 하단 탭 lazy 대상 경로를 관리한다", () => {
    const source = readSource("src/lib/navigation/routePreload.ts");

    expect(source).toContain("const BOTTOM_NAV_LAZY_PATHS = [\"/notice\", \"/map\", \"/mypage\"] as const;");
    expect(source).toContain("export const preloadBottomNavLazyRoutes");
    expect(source).toContain("export const registerRoutePreloader");
    expect(source).toContain("export const preloadRouteByPath");
  });

  it("App은 lazy 라우트 preload 함수를 등록하고 초기 warmup을 호출한다", () => {
    const source = readSource("src/App.tsx");

    expect(source).toContain("registerRoutePreloader(\"/notice\", Notice.preload)");
    expect(source).toContain("registerRoutePreloader(\"/map\", BoothMap.preload)");
    expect(source).toContain("registerRoutePreloader(\"/mypage\", MyPage.preload)");
    expect(source).toContain("void preloadBottomNavLazyRoutes()");
    expect(source).toContain("void prefetchBottomNavTabData()");
  });
});
