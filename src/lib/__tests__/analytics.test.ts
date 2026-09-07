// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const GA_MEASUREMENT_ID = "G-TEST123456";

describe("analytics", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_ENABLE_GA", "true");
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", GA_MEASUREMENT_ID);
    window.localStorage.setItem("danzzan.lang", "ko");

    delete window.dataLayer;
    delete window.gtag;
    document.title = "DAN-ZZAN";
    document
      .querySelectorAll(`script[src*="googletagmanager.com/gtag/js"]`)
      .forEach((script) => script.remove());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    window.localStorage.clear();
    delete window.dataLayer;
    delete window.gtag;
    document.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')
      .forEach((script) => script.remove());
  });

  it("sends an explicit page_view event when automatic page views are disabled", async () => {
    const { trackPageView } = await import("@/lib/analytics");

    trackPageView("/notice?lang=ko");

    const gtagCalls = window.dataLayer?.map((args) => Array.from(args));

    expect(gtagCalls).toContainEqual([
      "event",
      "page_view",
      {
        send_to: GA_MEASUREMENT_ID,
        page_path: "/notice?lang=ko",
        page_location: `${window.location.origin}/notice?lang=ko`,
        page_title: "DAN-ZZAN",
        app_language: "ko",
      },
    ]);
  });

  it("records restored English on the initial page view without a language change", async () => {
    window.localStorage.setItem("danzzan.lang", "en");
    const { trackPageView } = await import("@/lib/analytics");

    trackPageView("/");

    const calls = window.dataLayer!.map((args) => Array.from(args));
    expect(calls).toContainEqual(["set", "user_properties", { app_language: "en" }]);
    expect(calls).toContainEqual(["event", "page_view", expect.objectContaining({ app_language: "en" })]);
    expect(calls.filter((args) => args[1] === "language_change")).toHaveLength(0);
    expect(calls.findIndex((args) => args[1] === "user_properties"))
      .toBeLessThan(calls.findIndex((args) => args[1] === "page_view"));
  });

  it("records automatically selected English on first access", async () => {
    window.localStorage.clear();
    const browserLanguages = vi.spyOn(window.navigator, "languages", "get")
      .mockReturnValue(["en-US"]);
    try {
      const { trackPageView } = await import("@/lib/analytics");
      trackPageView("/");
      expect(window.dataLayer!.map((args) => Array.from(args))).toContainEqual([
        "event", "page_view", expect.objectContaining({ app_language: "en" }),
      ]);
    } finally {
      browserLanguages.mockRestore();
    }
  });

  it("sends both language changes and uses the current language on the next page", async () => {
    const { initializeAnalytics, trackLanguageChange, trackPageView } = await import("@/lib/analytics");
    const { languageStore } = await import("@/store/common/languageStore");
    initializeAnalytics();
    languageStore.setLanguage("en");
    trackLanguageChange("ko", "en");
    trackPageView("/map");
    languageStore.setLanguage("ko");
    trackLanguageChange("en", "ko");
    trackPageView("/notice");

    const calls = window.dataLayer!.map((args) => Array.from(args));
    expect(calls.filter((args) => args[1] === "language_change")).toEqual([
      ["event", "language_change", expect.objectContaining({
        send_to: GA_MEASUREMENT_ID, from_language: "ko", to_language: "en", app_language: "en",
      })],
      ["event", "language_change", expect.objectContaining({
        send_to: GA_MEASUREMENT_ID, from_language: "en", to_language: "ko", app_language: "ko",
      })],
    ]);
    expect(calls).toContainEqual(["event", "page_view", expect.objectContaining({ page_path: "/map", app_language: "en" })]);
    expect(calls).toContainEqual(["event", "page_view", expect.objectContaining({ page_path: "/notice", app_language: "ko" })]);
    expect(calls.filter((args) => args[1] === "user_properties")).toEqual([
      ["set", "user_properties", { app_language: "ko" }],
      ["set", "user_properties", { app_language: "en" }],
      ["set", "user_properties", { app_language: "ko" }],
    ]);
    expect(calls.filter((args) => args[0] === "config")).toEqual([
      ["config", GA_MEASUREMENT_ID, { send_page_view: false }],
    ]);
  });

  it.each([
    ["false", GA_MEASUREMENT_ID],
    ["true", ""],
  ])("does not initialize or send data when disabled (%s, %s)", async (enabled, id) => {
    vi.stubEnv("VITE_ENABLE_GA", enabled);
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", id);
    const { trackPageView, trackLanguageChange } = await import("@/lib/analytics");
    trackPageView("/");
    trackLanguageChange("ko", "en");
    expect(window.dataLayer).toBeUndefined();
    expect(document.querySelector('script[src*="googletagmanager.com"]')).toBeNull();
  });

  it("ignores a language selection that does not change the language", async () => {
    const { trackLanguageChange } = await import("@/lib/analytics");
    trackLanguageChange("en", "en");
    expect(window.dataLayer).toBeUndefined();
  });

  it("does not let a blocked analytics call break language selection", async () => {
    const { initializeAnalytics, trackLanguageChange } = await import("@/lib/analytics");
    initializeAnalytics();
    window.gtag = () => { throw new Error("blocked"); };
    expect(() => trackLanguageChange("ko", "en")).not.toThrow();
  });
});
