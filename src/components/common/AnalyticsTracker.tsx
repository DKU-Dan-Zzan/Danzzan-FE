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
      trackPageView(location.pathname);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.pathname]);

  return null;
}
