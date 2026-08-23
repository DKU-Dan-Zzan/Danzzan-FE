// 역할: 라우트 전환 로딩 정책(스피너/지연 렌더) 관련 소스 규칙이 깨지지 않았는지 검증합니다.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

function readSource(relativePath: string) {
  const absolutePath = path.join(PROJECT_ROOT, relativePath);
  return fs.readFileSync(absolutePath, "utf8");
}

describe("Route loading policy", () => {
  it("App router keeps home/timetable/ticketing routes eager", () => {
    const source = readSource("src/App.tsx");

    expect(source).toContain('import AppLayout from "./components/layout/AppLayout";');
    expect(source).toContain('import Home from "./routes/home/Home";');
    expect(source).toContain('import Timetable from "./routes/timetable/Timetable";');
    expect(source).toContain('import TicketingApp from "./routes/ticketing/TicketingApp";');

    expect(source).not.toContain('const AppLayout = lazy(() => import("./components/layout/AppLayout"))');
    expect(source).not.toContain('const Home = lazy(() => import("./routes/home/Home"))');
    expect(source).not.toContain('const Timetable = lazy(() => import("./routes/timetable/Timetable"))');
    expect(source).not.toContain('const TicketingApp = lazy(() => import("./routes/ticketing/TicketingApp"))');
  });

  it("App router preloads bottom-nav lazy routes and uses delayed fallback without loading text", () => {
    const source = readSource("src/App.tsx");

    expect(source).toContain("import DelayedSpinner from \"@/components/common/loading/DelayedSpinner\";");
    expect(source).toContain("const Notice = lazyWithPreload(() => import(\"./routes/notice/Notice\"));");
    expect(source).toContain("const BoothMap = lazyWithPreload(() => import(\"./routes/boothmap/BoothMap\"));");

    expect(source).toContain("registerRoutePreloader(\"/notice\", Notice.preload);");
    expect(source).toContain("registerRoutePreloader(\"/map\", BoothMap.preload);");
    // /mypage는 가을 축제 비활성 안내 화면으로 교체되어 더 이상 지연 로드/프리로드 대상이 아니다. (DANZ-358)
    expect(source).not.toContain("const MyPage = lazyWithPreload");
    expect(source).not.toContain("registerRoutePreloader(\"/mypage\"");
    expect(source).toContain("if (typeof window.requestIdleCallback === \"function\")");
    expect(source).toContain("window.requestIdleCallback(");
    expect(source).toContain("window.setTimeout(() => {");
    expect(source).toContain("void preloadBottomNavLazyRoutes();");
    expect(source).toContain("void prefetchBottomNavTabData();");
    expect(source).toContain("markBottomNavTransitionComplete(location.pathname);");

    expect(source).toContain("<DelayedSpinner delayMs={300}");
    expect(source).not.toContain("setVisibleFallback(true)");
    expect(source).not.toContain("화면 불러오는 중...");
  });

  it("Ticketing router keeps its layout eager", () => {
    const source = readSource("src/routes/ticketing/TicketingApp.tsx");

    expect(source).toContain('import { UserLayout } from "@/components/ticketing/layout/UserLayout";');
    expect(source).not.toContain("const UserLayout = lazy(() =>");
    // ticketing 경로는 가을 축제 비활성 안내 화면으로 교체되어 Ticketing 화면을 더 이상 라우팅에서 참조하지 않는다. (DANZ-358)
    expect(source).not.toContain('import Ticketing from "@/routes/ticketing/ticketing/Ticketing";');
  });
});
