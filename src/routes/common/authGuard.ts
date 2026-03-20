import { hasRequiredRole, type AuthRole } from "@/api/common/authCore";
import type { UserRole } from "@/types/ticketing/model/auth.model";

const DUMMY_ORIGIN = "http://dummy-auth";

const isSafeInternalPath = (rawPath: string): boolean => {
  if (!rawPath.startsWith("/") || rawPath.startsWith("//")) {
    return false;
  }

  const pathOnly = rawPath.split(/[?#]/, 1)[0] ?? rawPath;
  const rawSegments = pathOnly.split("/");
  for (const segment of rawSegments) {
    if (!segment) {
      continue;
    }
    if (segment === "." || segment === "..") {
      return false;
    }
    const decoded = decodeURIComponent(segment);
    if (decoded === "." || decoded === "..") {
      return false;
    }
  }

  try {
    const url = new URL(rawPath, DUMMY_ORIGIN);
    if (url.origin !== DUMMY_ORIGIN) {
      return false;
    }

    const segments = url.pathname.split("/");
    for (const segment of segments) {
      if (!segment) {
        continue;
      }
      if (segment === "." || segment === "..") {
        return false;
      }
      const decoded = decodeURIComponent(segment);
      if (decoded === "." || decoded === "..") {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
};

const isWithinScope = (path: string, scope: string): boolean => {
  const escapedScope = scope.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escapedScope}(?:/|$|[?#])`).test(path);
};

export const resolveScopedRedirect = (
  redirectParam: string | null,
  options: {
    scope: string;
    fallback: string;
  },
): string => {
  const trimmed = redirectParam?.trim() ?? "";
  if (!trimmed) {
    return options.fallback;
  }
  if (!isSafeInternalPath(trimmed)) {
    return options.fallback;
  }
  if (!isWithinScope(trimmed, options.scope)) {
    return options.fallback;
  }
  return trimmed;
};

export const buildReturnTo = (pathname: string, search = ""): string => {
  const path = `${pathname}${search}`;
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }
  return path;
};

export const buildLoginRedirectPath = (
  loginPath: string,
  returnTo: string,
): string => {
  return `${loginPath}?redirect=${encodeURIComponent(returnTo)}`;
};

export const isRoleAuthenticated = (options: {
  accessToken?: string | null;
  role?: UserRole | null;
  requiredRole: AuthRole;
}): boolean => {
  if (!options.accessToken) {
    return false;
  }
  return hasRequiredRole(options.requiredRole, options.role ?? null);
};
