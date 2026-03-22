export const BOTTOM_NAV_LAZY_PATHS = ["/notice", "/map", "/mypage"] as const;

type BottomNavLazyPath = (typeof BOTTOM_NAV_LAZY_PATHS)[number];
type RoutePreloader = () => Promise<unknown>;

const preloadersByPath = new Map<BottomNavLazyPath, RoutePreloader>();
const preloadedPaths = new Set<BottomNavLazyPath>();

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

const resolveLazyPath = (value: string): BottomNavLazyPath | null => {
  const normalizedPath = normalizeRoutePath(value);
  const matched = BOTTOM_NAV_LAZY_PATHS.find((path) => {
    return normalizedPath === path || normalizedPath.startsWith(`${path}/`);
  });
  return matched ?? null;
};

export const registerRoutePreloader = (
  path: BottomNavLazyPath,
  preloader: RoutePreloader,
) => {
  preloadersByPath.set(path, preloader);
};

const runPreloader = async (path: BottomNavLazyPath): Promise<void> => {
  const preloader = preloadersByPath.get(path);
  if (!preloader || preloadedPaths.has(path)) {
    return;
  }

  preloadedPaths.add(path);
  try {
    await preloader();
  } catch {
    preloadedPaths.delete(path);
  }
};

export const preloadRouteByPath = async (routePath: string): Promise<void> => {
  const lazyPath = resolveLazyPath(routePath);
  if (!lazyPath) {
    return;
  }

  await runPreloader(lazyPath);
};

export const preloadBottomNavLazyRoutes = async (): Promise<void> => {
  await Promise.all(BOTTOM_NAV_LAZY_PATHS.map((path) => runPreloader(path)));
};
