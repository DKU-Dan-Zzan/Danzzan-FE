// 역할: 권한 상태에 따른 접근 제어 판단 로직을 제공한다.

import {
  hasRequiredRole,
  isAccessTokenExpired,
  resolveRoleFromAccessToken,
  type AuthRole,
} from "@/api/common/authCore";

export const hasAuthenticatedRole = (options: {
  accessToken?: string | null;
  role?: AuthRole | null;
  requiredRole: AuthRole;
}): boolean => {
  if (!options.accessToken) {
    return false;
  }
  if (isAccessTokenExpired(options.accessToken)) {
    return false;
  }

  // Token claim should be source of truth when available.
  const tokenRole = resolveRoleFromAccessToken(options.accessToken);
  return hasRequiredRole(options.requiredRole, tokenRole ?? options.role ?? null);
};
