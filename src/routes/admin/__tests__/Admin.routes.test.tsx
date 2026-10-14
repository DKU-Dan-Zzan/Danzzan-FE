// @vitest-environment jsdom
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "@/App";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const session = vi.hoisted(() => ({ role: "manager", permissions: ["OPERATIONS"] as string[], authenticated: true }));
const restore = vi.hoisted(() => vi.fn().mockResolvedValue(true));
vi.mock("@/store/common/authStore", () => ({ authStore: { subscribe: () => () => {}, getSnapshot: () => session } }));
vi.mock("@/hooks/app/admin/useAdminAuth", () => ({ useAdminAuth: () => ({ isAuthenticated: session.authenticated, tryRestoreSession: restore }) }));
vi.mock("@/hooks/app/festival/useLoadFestivalSettings", () => ({ useLoadFestivalSettings: vi.fn() }));
vi.mock("@/lib/navigation/routePreload", () => ({ registerRoutePreloader: vi.fn(), preloadBottomNavLazyRoutes: vi.fn() }));
vi.mock("@/lib/query/prefetchTabData", () => ({ prefetchBottomNavTabData: vi.fn() }));
vi.mock("@/lib/perf/navTiming", () => ({ markBottomNavTransitionComplete: vi.fn() }));
vi.mock("@/components/common/AnalyticsTracker", () => ({ default: () => null }));
vi.mock("@/components/layout/AdminLayout", async () => ({ default: (await import("react-router-dom")).Outlet }));
vi.mock("@/components/layout/AppLayout", async () => ({ default: (await import("react-router-dom")).Outlet }));
vi.mock("@/routes/home/Home", () => ({ default: () => null }));
vi.mock("@/routes/timetable/Timetable", () => ({ default: () => null }));
vi.mock("@/routes/ticketing/TicketingApp", () => ({ default: () => null }));
vi.mock("@/routes/legal/LegalDocument", () => ({ default: () => null }));
vi.mock("@/routes/admin/Admin", () => ({ default: () => <div>통합 공지·광고 페이지</div> }));
vi.mock("@/routes/admin/AdminSettings", () => ({ default: () => <div>설정 페이지</div> }));
vi.mock("@/routes/admin/AdminLogin", () => ({ default: () => <div>로그인 페이지</div> }));
let root: Root;
let host: HTMLDivElement;
let path = "";
function LocationReporter() {
  const location = useLocation();
  useEffect(() => { path = `${location.pathname}${location.hash}`; }, [location]);
  return null;
}
beforeEach(() => {
  session.role = "manager"; session.permissions = ["OPERATIONS"]; session.authenticated = true;
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); });
async function render(initialPath: string) {
  await act(async () => root.render(<MemoryRouter initialEntries={[initialPath]}><LocationReporter /><App /></MemoryRouter>));
  for (let index = 0; index < 5; index++) await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
}
describe("Unified admin notice routes", () => {
  it.each(["/admin/notices", "/admin/ads"])("allows OPERATIONS users at %s and redirects legacy ads to the anchor", async route => {
    await render(route);
    expect(host.textContent).toContain("통합 공지·광고 페이지");
    expect(path).toBe(route === "/admin/ads" ? "/admin/notices#ad-banners" : "/admin/notices");
  });
  it.each(["/admin/notices", "/admin/ads"])("keeps %s inaccessible to TICKETING-only users", async route => {
    session.permissions = ["TICKETING"];
    await render(route);
    expect(host.textContent).not.toContain("통합 공지·광고 페이지");
    expect(host.textContent).toContain("설정 페이지");
    expect(path).toBe("/admin");
  });
  it("keeps the legacy ads route behind login", async () => {
    session.authenticated = false;
    await render("/admin/ads");
    expect(path).toBe("/admin/login");
    expect(host.textContent).not.toContain("통합 공지·광고 페이지");
  });
});
