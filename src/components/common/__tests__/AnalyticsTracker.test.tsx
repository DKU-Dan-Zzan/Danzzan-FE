// @vitest-environment jsdom

import { StrictMode, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Link, MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLDivElement;

const events = (name: string) => (window.dataLayer ?? [])
  .map((args) => Array.from(args))
  .filter((args) => args[0] === "event" && args[1] === name);

async function renderTracker() {
  const { default: AnalyticsTracker } = await import("@/components/common/AnalyticsTracker");
  const { default: LanguageToggle } = await import("@/components/layout/LanguageToggle");
  await act(async () => {
    root.render(
      <StrictMode>
        <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnalyticsTracker />
          <LanguageToggle />
          <Link to="/notice">Notice</Link>
        </MemoryRouter>
      </StrictMode>,
    );
  });
  await act(async () => { vi.runOnlyPendingTimers(); });
}

describe("AnalyticsTracker language tracking", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.stubEnv("VITE_ENABLE_GA", "true");
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", "G-TEST123456");
    window.localStorage.setItem("danzzan.lang", "ko");
    delete window.dataLayer;
    delete window.gtag;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
    document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')
      .forEach((script) => script.remove());
    window.localStorage.clear();
    delete window.dataLayer;
    delete window.gtag;
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("tracks each toggle once in StrictMode without adding page views", async () => {
    await renderTracker();
    expect(events("page_view")).toHaveLength(1);
    expect(events("language_change")).toHaveLength(0);

    await act(async () => { container.querySelector("button")!.click(); });
    await act(async () => { vi.runOnlyPendingTimers(); });
    expect(events("language_change")).toEqual([
      ["event", "language_change", expect.objectContaining({ from_language: "ko", to_language: "en", app_language: "en" })],
    ]);
    expect(events("page_view")).toHaveLength(1);

    await act(async () => { container.querySelector("a")!.click(); });
    await act(async () => { vi.runOnlyPendingTimers(); });
    expect(events("page_view")).toHaveLength(2);
    expect(events("page_view")[1][2]).toMatchObject({ page_path: "/notice", app_language: "en" });

    await act(async () => { container.querySelector("button")!.click(); });
    expect(events("language_change")).toHaveLength(2);
    expect(events("language_change")[1][2]).toMatchObject({ from_language: "en", to_language: "ko", app_language: "ko" });
    expect(events("page_view")).toHaveLength(2);
  });

  it("treats a saved English preference as an initial view, not a new selection", async () => {
    window.localStorage.setItem("danzzan.lang", "en");
    await renderTracker();
    expect(events("page_view")).toHaveLength(1);
    expect(events("page_view")[0][2]).toMatchObject({ app_language: "en" });
    expect(events("language_change")).toHaveLength(0);
  });

  it("unsubscribes when the tracker unmounts", async () => {
    await renderTracker();
    await act(async () => { root.render(null); });
    const { languageStore } = await import("@/store/common/languageStore");
    languageStore.setLanguage("en");
    expect(events("language_change")).toHaveLength(0);
  });

  it("keeps the language toggle working when analytics is disabled", async () => {
    vi.stubEnv("VITE_ENABLE_GA", "false");
    await renderTracker();
    await act(async () => { container.querySelector("button")!.click(); });
    expect(window.localStorage.getItem("danzzan.lang")).toBe("en");
    expect(window.dataLayer).toBeUndefined();
  });
});
