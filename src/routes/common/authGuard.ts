import { type AuthRole } from "@/api/common/authCore";
import { hasAuthenticatedRole } from "@/lib/common/auth-access";
export {
  buildLoginRedirectPath,
  buildReturnTo,
  resolveScopedRedirect,
} from "@/lib/common/auth-redirect";

export const isRoleAuthenticated = (options: {
  accessToken?: string | null;
  role?: AuthRole | null;
  requiredRole: AuthRole;
}): boolean => {
  return hasAuthenticatedRole(options);
};
