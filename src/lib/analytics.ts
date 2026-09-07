import { normalizeEnvValue } from "@/lib/env";
import { getCurrentLanguage, type Language } from "@/store/common/languageStore";

const GA_SCRIPT_SRC_BASE = "https://www.googletagmanager.com/gtag/js?id=";

declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = normalizeEnvValue(import.meta.env.VITE_GA_MEASUREMENT_ID);
const ENABLE_GA = import.meta.env.VITE_ENABLE_GA === "true";

let initialized = false;
let lastTrackedPageKey: string | null = null;

const canUseDom = (): boolean => {
  return typeof window !== "undefined" && typeof document !== "undefined";
};

export const isAnalyticsEnabled = (): boolean => {
  return ENABLE_GA && GA_MEASUREMENT_ID.length > 0;
};

const ensureDataLayerAndGtag = (): void => {
  if (!canUseDom()) {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  if (typeof window.gtag === "function") {
    return;
  }

  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
};

const injectGaScript = (): void => {
  if (!canUseDom()) {
    return;
  }

  const scriptSrc = `${GA_SCRIPT_SRC_BASE}${encodeURIComponent(GA_MEASUREMENT_ID)}`;
  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[src="${scriptSrc}"]`,
  );

  if (existingScript) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = scriptSrc;
  script.onerror = () => {
    // Keep the app stable even when GA is blocked or fails to load.
  };

  document.head.appendChild(script);
};

export const initializeAnalytics = (): void => {
  if (!isAnalyticsEnabled() || initialized || !canUseDom()) {
    return;
  }

  try {
    ensureDataLayerAndGtag();
    injectGaScript();

    if (typeof window.gtag !== "function") {
      return;
    }

    window.gtag("js", new Date());
    window.gtag("set", "user_properties", {
      app_language: getCurrentLanguage(),
    });
    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
    });

    initialized = true;
  } catch {
    // Ignore analytics failures so routing/rendering continues normally.
  }
};

export const trackPageView = (pagePath: string): void => {
  if (!isAnalyticsEnabled() || !pagePath || !canUseDom() || lastTrackedPageKey === pagePath) {
    return;
  }

  try {
    initializeAnalytics();

    if (typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", "page_view", {
      send_to: GA_MEASUREMENT_ID,
      page_path: pagePath,
      page_location: `${window.location.origin}${pagePath}`,
      page_title: document.title,
      app_language: getCurrentLanguage(),
    });

    lastTrackedPageKey = pagePath;
  } catch {
    // Ignore analytics failures so routing/rendering continues normally.
  }
};

export const trackLanguageChange = (fromLanguage: Language, toLanguage: Language): void => {
  if (!isAnalyticsEnabled() || !canUseDom() || fromLanguage === toLanguage) {
    return;
  }

  try {
    initializeAnalytics();

    if (typeof window.gtag !== "function") {
      return;
    }

    window.gtag("set", "user_properties", { app_language: toLanguage });
    window.gtag("event", "language_change", {
      send_to: GA_MEASUREMENT_ID,
      from_language: fromLanguage,
      to_language: toLanguage,
      app_language: toLanguage,
    });
  } catch {
    // Analytics failures must not interrupt language selection.
  }
};
