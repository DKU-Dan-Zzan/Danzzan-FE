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
    expect(source).toContain("const MyPage = lazyWithPreload(() => import(\"./routes/mypage/MyPage\"));");

    expect(source).toContain("registerRoutePreloader(\"/notice\", Notice.preload);");
    expect(source).toContain("registerRoutePreloader(\"/map\", BoothMap.preload);");
    expect(source).toContain("registerRoutePreloader(\"/mypage\", MyPage.preload);");
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

  it("Ticketing router keeps student ticketing path eager", () => {
    const source = readSource("src/routes/ticketing/TicketingApp.tsx");

    expect(source).toContain('import { UserLayout } from "@/components/ticketing/layout/UserLayout";');
    expect(source).toContain('import Ticketing from "@/routes/ticketing/ticketing/Ticketing";');

    expect(source).not.toContain("const UserLayout = lazy(() =>");
    expect(source).not.toContain("const Ticketing = lazy(() =>");
  });
});
