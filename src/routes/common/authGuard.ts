// 역할: 인증 필요 라우트의 로그인 리다이렉트 경로를 생성하는 공용 유틸입니다.
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
