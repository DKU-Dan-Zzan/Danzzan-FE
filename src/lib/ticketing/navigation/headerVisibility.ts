// 역할: 현재 티켓팅 경로에서 헤더 표시 여부를 판별하는 규칙을 제공합니다.
import { hasRequiredRole, resolveRoleFromAccessToken, type AuthRole } from "@/api/common/authCore";

type HeaderVisibilityOptions = {
  pathname: string;
  accessToken?: string | null;
  role?: AuthRole | null;
};

const isTicketingAuthPage = (pathname: string): boolean => {
  return (
    pathname === "/ticket/login" ||
    pathname === "/ticket/signup" ||
    pathname.startsWith("/ticket/reset-password")
  );
};

export const shouldShowTicketingHeader = ({
  pathname,
  accessToken,
  role,
}: HeaderVisibilityOptions): boolean => {
  if (isTicketingAuthPage(pathname)) {
    return true;
  }

  if (!accessToken) {
    return false;
  }

  const tokenRole = resolveRoleFromAccessToken(accessToken);
  return hasRequiredRole("student", tokenRole ?? role ?? null);
};
