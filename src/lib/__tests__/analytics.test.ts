// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const GA_MEASUREMENT_ID = "G-TEST123456";

describe("trackPageView", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_ENABLE_GA", "true");
    vi.stubEnv("VITE_GA_MEASUREMENT_ID", GA_MEASUREMENT_ID);

    delete window.dataLayer;
    delete window.gtag;
    document.title = "DAN-ZZAN";
    document
      .querySelectorAll(`script[src*="googletagmanager.com/gtag/js"]`)
      .forEach((script) => script.remove());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
      },
    ]);
  });
});
