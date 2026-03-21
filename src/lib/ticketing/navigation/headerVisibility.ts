import { hasRequiredRole, resolveRoleFromAccessToken, type AuthRole } from "@/api/common/authCore";

type HeaderVisibilityOptions = {
  pathname: string;
  accessToken?: string | null;
  role?: AuthRole | null;
};

const isTicketingAuthPage = (pathname: string): boolean => {
  return pathname === "/ticket/login" || pathname === "/ticket/signup";
};

export const shouldShowTicketingHeader = ({
  pathname,
  accessToken,
  role,
}: HeaderVisibilityOptions): boolean => {
  if (isTicketingAuthPage(pathname)) {
    return false;
  }

  if (!accessToken) {
    return false;
  }

  const tokenRole = resolveRoleFromAccessToken(accessToken);
  return hasRequiredRole("student", tokenRole ?? role ?? null);
};
