import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { initializeAnalytics, isAnalyticsEnabled, trackLanguageChange, trackPageView } from "@/lib/analytics";
import { getCurrentLanguage, languageStore } from "@/store/common/languageStore";

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!isAnalyticsEnabled()) {
      return;
    }

    initializeAnalytics();

    // Initial language belongs to the first page view; only subsequent changes are selections.
    let previousLanguage = getCurrentLanguage();
    return languageStore.subscribe(() => {
      const nextLanguage = getCurrentLanguage();
      trackLanguageChange(previousLanguage, nextLanguage);
      previousLanguage = nextLanguage;
    });
  }, []);

  useEffect(() => {
    if (!isAnalyticsEnabled()) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      trackPageView(location.pathname + location.search);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.pathname, location.search]);

  return null;
}
