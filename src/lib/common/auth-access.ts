import {
  hasRequiredRole,
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

  // Token claim should be source of truth when available.
  const tokenRole = resolveRoleFromAccessToken(options.accessToken);
  return hasRequiredRole(options.requiredRole, tokenRole ?? options.role ?? null);
};
