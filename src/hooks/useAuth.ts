import { useCallback, useSyncExternalStore } from "react";
import { authApi } from "@/api/authApi";
import { adminAuthApi } from "@/api/adminAuthApi";
import { authStore } from "@/store/authStore";
import type { AuthCredentials, UserRole } from "@/types/model/auth.model";

export const useAuth = () => {
  const state = useSyncExternalStore(
    authStore.subscribe,
    authStore.getSnapshot,
    authStore.getSnapshot,
  );

  const isAuthenticated = Boolean(state.tokens?.accessToken);

  const login = useCallback(
    async (payload: AuthCredentials, role: UserRole) => {
      if (role === "admin") {
        const session = await adminAuthApi.login(payload);
        authStore.setSession(session, "admin");
        return session;
      }

      const session = await authApi.login(payload);
      authStore.setSession(session, role);
      return session;
    },
    [],
  );

  const refresh = useCallback(async () => {
    const session = await authApi.refresh();
    authStore.setSession(session, state.role ?? undefined);
    return session;
  }, [state.role]);

  const logout = useCallback(() => {
    authStore.clear();
  }, []);

  return {
    session: state,
    isAuthenticated,
    role: state.role,
    login,
    refresh,
    logout,
  };
};
