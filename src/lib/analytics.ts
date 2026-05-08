import { normalizeEnvValue } from "@/lib/env";

const GA_SCRIPT_ID = "ga4-gtag-script";
const GA_SRC_BASE = "https://www.googletagmanager.com/gtag/js?id=";

declare global {
  interface Window {
    dataLayer?: Array<IArguments | Record<string, unknown> | Date | string>;
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = normalizeEnvValue(import.meta.env.VITE_GA_MEASUREMENT_ID);
const isGaEnabled = import.meta.env.VITE_ENABLE_GA === "true" && measurementId.length > 0;

let initialized = false;
let lastTrackedPagePath: string | null = null;

const canUseDom = (): boolean => {
  return typeof window !== "undefined" && typeof document !== "undefined";
};

const ensureGtagStub = (): void => {
  if (!canUseDom()) {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];
  window.gtag =
    window.gtag ??
    function gtag() {
      window.dataLayer?.push(arguments);
    };
};

const injectGaScript = (): void => {
  if (!canUseDom()) {
    return;
  }

  if (document.getElementById(GA_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement("script");
  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `${GA_SRC_BASE}${encodeURIComponent(measurementId)}`;
  script.onerror = () => {
    // Keep the app stable even when GA is blocked or fails to load.
  };

  document.head.appendChild(script);
};

export const isAnalyticsEnabled = (): boolean => {
  return isGaEnabled;
};

export const initializeAnalytics = (): void => {
  if (!isGaEnabled || initialized) {
    return;
  }

  try {
    ensureGtagStub();
    injectGaScript();

    window.gtag?.("js", new Date());
    window.gtag?.("config", measurementId, {
      send_page_view: false,
    });

    initialized = true;
  } catch {
    // Ignore analytics failures so routing/rendering continues normally.
  }
};

export const trackPageView = (pagePath: string): void => {
  if (!isGaEnabled || !pagePath || lastTrackedPagePath === pagePath) {
    return;
  }

  try {
    initializeAnalytics();
    const pageLocation = canUseDom() ? `${window.location.origin}${pagePath}` : undefined;
    const pageTitle = canUseDom() ? document.title : undefined;

    window.gtag?.("event", "page_view", {
      send_to: measurementId,
      page_path: pagePath,
      page_location: pageLocation,
      page_title: pageTitle,
    });
    lastTrackedPagePath = pagePath;
  } catch {
    // Ignore analytics failures so routing/rendering continues normally.
  }
};
