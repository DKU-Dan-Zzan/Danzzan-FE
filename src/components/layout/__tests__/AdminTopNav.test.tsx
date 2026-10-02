// @vitest-environment jsdom
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminTopNav from "@/components/layout/AdminTopNav";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const state = vi.hoisted(() => ({ role: "admin" as "admin" | "manager", permissions: ["OPERATIONS", "TICKETING"] as string[] }));
vi.mock("@/store/common/authStore", () => ({
  authStore: {
    getSnapshot: () => state,
    subscribe: () => () => {},
  },
}));
vi.mock("@/hooks/app/admin/useAdminAuth", () => ({ useAdminAuth: () => ({ logout: vi.fn() }) }));

let root: Root;
let container: HTMLDivElement;
let locationPath = "";

function LocationReporter() {
  const location = useLocation();
  useEffect(() => {
    locationPath = `${location.pathname}${location.hash}`;
  }, [location.hash, location.pathname]);
  return null;
}

async function render(initialPath = "/admin") {
  locationPath = "";
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => {
    root.render(<MemoryRouter initialEntries={[initialPath]}><LocationReporter /><AdminTopNav /></MemoryRouter>);
  });
}

async function settle() {
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
}

function button(label: string) {
  return [...container.querySelectorAll("button")].find(element =>
    element.textContent === label || element.querySelector("span")?.textContent === label,
  )!;
}

async function openManagerMenuWithHover() {
  await act(async () => {
    button("운영진 관리").dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  });
  await settle();
}

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  state.role = "admin";
  state.permissions = ["OPERATIONS", "TICKETING"];
});

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  vi.restoreAllMocks();
});

describe("AdminTopNav staff menu", () => {
  it("opens ticket settings and wristband links on click for touch users", async () => {
    await render();
    await act(async () => button("티켓팅").click());
    expect(button("티켓팅").getAttribute("aria-expanded")).toBe("true");
    expect(button("티켓 설정")).toBeDefined();
    expect(button("팔찌 배부").querySelector("svg")).not.toBeNull();
    await act(async () => button("티켓 설정").click());
    expect(locationPath).toBe("/admin/ticketing");
  });
  it("previews sections on hover and navigates to the page top when the parent is clicked", async () => {
    await render("/admin/invite#manager-list");
    await openManagerMenuWithHover();
    const trigger = button("운영진 관리");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe("managers-submenu");
    expect(container.textContent).toContain("새 매니저 초대");
    expect(container.textContent).toContain("매니저 목록");

    await act(async () => trigger.click());
    await settle();
    expect(locationPath).toBe("/admin/invite");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: "instant" });
    vi.mocked(window.scrollTo).mockClear();
    await act(async () => trigger.click());
    expect(window.scrollTo).toHaveBeenCalledOnce();
  });

  it("opens on keyboard focus, Escape closes it and restores focus to its trigger", async () => {
    await render();
    const trigger = button("운영진 관리");
    await act(async () => trigger.focus());
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    const firstChild = button("새 매니저 초대");
    await act(async () => firstChild.focus());
    await act(async () => firstChild.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("navigates between unified-page anchors and marks the current child", async () => {
    await render("/admin/invite#manager-list");
    await openManagerMenuWithHover();
    expect(button("운영진 관리").className).toContain("bg-[var(--surface-subtle)]");
    const list = button("매니저 목록");
    expect(list.getAttribute("aria-current")).toBe("page");
    await act(async () => button("새 매니저 초대").click());
    await settle();
    expect(locationPath).toBe("/admin/invite#invite-manager");

    await openManagerMenuWithHover();
    expect(button("새 매니저 초대").getAttribute("aria-current")).toBe("page");
    await act(async () => button("매니저 목록").click());
    await settle();
    expect(locationPath).toBe("/admin/invite#manager-list");
  });

  it("keeps existing top-level navigation and hides staff management from managers", async () => {
    await render("/admin/theme");
    await act(async () => button("축제 설정").click());
    await settle();
    expect(locationPath).toBe("/admin");

    await act(async () => root.unmount());
    container.remove();
    state.role = "manager";
    await render();
    expect(container.textContent).not.toContain("운영진 관리");
  });
});
