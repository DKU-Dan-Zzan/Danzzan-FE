import { hasRequiredRole, resolveRoleFromAccessToken } from "@/api/common/authCore";
import { authStore } from "@/store/common/authStore";

export const requireAdminRole = (accessToken: string): void => {
  const role = resolveRoleFromAccessToken(accessToken);
  if (!hasRequiredRole("admin", role)) {
    throw new Error("관리자 권한이 없는 계정입니다.");
  }
};

export const getAdminSession = (): string | null => {
  return authStore.getRole() === "admin" ? authStore.getAccessToken() : null;
};

export const clearAdminSession = (): void => {
  authStore.clear();
};

export const getAdminAccessToken = (): string | null => {
  return authStore.getRole() === "admin" ? authStore.getAccessToken() : null;
};

export const reissueAdminToken = async (): Promise<string | null> => {
  const reissued = await authStore.refreshAccessToken();
  if (!reissued) {
    return null;
  }

  try {
    requireAdminRole(reissued);
    return reissued;
  } catch {
    authStore.clear();
    return null;
  }
};
