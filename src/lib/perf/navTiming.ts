type NavTimingSummary = {
  route: string;
  samples: number;
  lastMs: number;
  p50Ms: number;
  p75Ms: number;
  p95Ms: number;
};

type NavTimingTrackerOptions = {
  enabled?: boolean;
  now?: () => number;
  log?: (message: string) => void;
  maxSamples?: number;
};

const DEFAULT_MAX_SAMPLES = 80;
const IS_DEV =
  typeof import.meta !== "undefined" &&
  typeof import.meta.env !== "undefined" &&
  Boolean(import.meta.env.DEV);

const normalizeRoutePath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return "/";
  }

  const withoutHash = trimmed.split("#", 1)[0] ?? "";
  const withoutQuery = withoutHash.split("?", 1)[0] ?? "";
  if (!withoutQuery || withoutQuery === "/") {
    return "/";
  }

  return withoutQuery.endsWith("/") ? withoutQuery.slice(0, -1) : withoutQuery;
};

const toRoundedMs = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value));
};

const percentileNearestRank = (values: number[], percentile: number): number => {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.ceil(percentile * sorted.length);
  const index = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return sorted[index] ?? 0;
};

export const createNavTimingTracker = ({
  enabled = IS_DEV,
  now = () => performance.now(),
  log = (message) => {
    console.info(message);
  },
  maxSamples = DEFAULT_MAX_SAMPLES,
}: NavTimingTrackerOptions = {}) => {
  const startByRoute = new Map<string, number>();
  const samplesByRoute = new Map<string, number[]>();

  const markStart = (routePath: string) => {
    if (!enabled) {
      return;
    }

    const route = normalizeRoutePath(routePath);
    startByRoute.set(route, now());
  };

  const markRenderComplete = (routePath: string): NavTimingSummary | null => {
    if (!enabled) {
      return null;
    }

    const route = normalizeRoutePath(routePath);
    const startedAt = startByRoute.get(route);
    if (startedAt === undefined) {
      return null;
    }
    startByRoute.delete(route);

    const elapsed = toRoundedMs(now() - startedAt);
    const previousSamples = samplesByRoute.get(route) ?? [];
    const nextSamples = [...previousSamples, elapsed];
    if (nextSamples.length > maxSamples) {
      nextSamples.splice(0, nextSamples.length - maxSamples);
    }
    samplesByRoute.set(route, nextSamples);

    const summary: NavTimingSummary = {
      route,
      samples: nextSamples.length,
      lastMs: elapsed,
      p50Ms: percentileNearestRank(nextSamples, 0.5),
      p75Ms: percentileNearestRank(nextSamples, 0.75),
      p95Ms: percentileNearestRank(nextSamples, 0.95),
    };

    log(
      `[nav-timing] route=${summary.route} samples=${summary.samples} ` +
        `last=${summary.lastMs}ms p50=${summary.p50Ms}ms p75=${summary.p75Ms}ms p95=${summary.p95Ms}ms`,
    );

    return summary;
  };

  return {
    markStart,
    markRenderComplete,
  };
};

const defaultNavTimingTracker = createNavTimingTracker();

export const markBottomNavTransitionStart = (routePath: string) => {
  defaultNavTimingTracker.markStart(routePath);
};

export const markBottomNavTransitionComplete = (routePath: string) => {
  return defaultNavTimingTracker.markRenderComplete(routePath);
};
