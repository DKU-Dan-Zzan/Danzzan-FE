import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { initializeAnalytics, isAnalyticsEnabled, trackPageView } from "@/lib/analytics";

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    if (!isAnalyticsEnabled()) {
      return;
    }

    initializeAnalytics();
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
