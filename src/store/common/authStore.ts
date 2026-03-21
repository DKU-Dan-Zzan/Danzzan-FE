import { resolveRoleFromAccessToken } from "@/api/common/authCore";
import { logAuthWarn } from "@/api/common/authLogger";
import {
  refreshAccessTokenWithCookie,
  refreshAccessTokenWithToken,
} from "@/api/common/authRefresh";
import type {
  AuthSession,
  AuthTokens,
  AuthUser,
  UserRole,
} from "@/types/common/auth.model";
import { env } from "@/utils/common/env";

const STORAGE_KEY = "danzzan.auth";
const LEGACY_ACCESS_TOKEN_KEYS = [
  "danzzan.accessToken",
  "danzzan.admin.accessToken",
  "accessToken",
] as const;

type RefreshMode = "cookie" | "token";

type AuthState = {
  tokens: AuthTokens | null;
  user: AuthUser | null;
  role: UserRole | null;
  refreshMode: RefreshMode | null;
  persisted: boolean;
};

type SerializedAuthState = {
  tokens?: AuthTokens | null;
  user?: AuthUser | null;
  role?: UserRole | null;
  refreshMode?: RefreshMode | null;
};

type SetSessionOptions = {
  persist?: boolean;
  refreshMode?: RefreshMode;
};

const emptyState: AuthState = {
  tokens: null,
  user: null,
  role: null,
  refreshMode: null,
  persisted: false,
};

const listeners = new Set<() => void>();

const toSerializable = (next: AuthState): SerializedAuthState => ({
  tokens: next.tokens,
  user: next.user,
  role: next.role,
  refreshMode: next.refreshMode,
});

const resolveRole = (options: {
  roleOverride?: UserRole;
  user?: AuthUser | null;
  accessToken?: string;
}): UserRole | null => {
  if (options.roleOverride) {
    return options.roleOverride;
  }

  if (options.user?.role === "student" || options.user?.role === "admin") {
    return options.user.role;
  }

  const fromToken = resolveRoleFromAccessToken(options.accessToken);
  return fromToken ?? null;
};

const resolveRefreshMode = (
  tokens: AuthTokens | null | undefined,
  modeOverride?: RefreshMode,
): RefreshMode | null => {
  if (modeOverride) {
    return modeOverride;
  }
  if (!tokens) {
    return null;
  }
  return tokens.refreshToken ? "token" : "cookie";
};

const buildTokenState = (accessToken: string, persisted = false): AuthState => {
  return {
    tokens: {
      accessToken,
      refreshToken: "",
      expiresIn: null,
    },
    user: null,
    role: resolveRole({
      accessToken,
    }),
    refreshMode: "cookie",
    persisted,
  };
};

const loadLegacyAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of LEGACY_ACCESS_TOKEN_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (raw?.trim()) {
      return raw.trim();
    }
  }
  return null;
};

const loadState = (): AuthState => {
  if (typeof window === "undefined") {
    return emptyState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SerializedAuthState;
      const accessToken = parsed.tokens?.accessToken ?? "";
      return {
        tokens: parsed.tokens ?? null,
        user: parsed.user ?? null,
        role: resolveRole({
          roleOverride: parsed.role ?? undefined,
          user: parsed.user ?? null,
          accessToken,
        }),
        refreshMode: resolveRefreshMode(parsed.tokens ?? null, parsed.refreshMode ?? undefined),
        persisted: true,
      };
    }
  } catch {
    return emptyState;
  }

  const legacyAccessToken = loadLegacyAccessToken();
  if (legacyAccessToken) {
    logAuthWarn("legacy-token-fallback", {
      storageKey: STORAGE_KEY,
    });
    return buildTokenState(legacyAccessToken, false);
  }

  return emptyState;
};

const persistState = (next: AuthState) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!next.persisted) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSerializable(next)));
};

const buildDevSession = (token: string): AuthState => {
  return {
    ...buildTokenState(token, true),
    role: "admin",
  };
};

const injectDevToken = (current: AuthState): AuthState => {
  if (!env.isDev || !env.devAccessToken) {
    return current;
  }
  if (current.tokens?.accessToken) {
    return current;
  }
  if (typeof window === "undefined") {
    return current;
  }

  const nextState = buildDevSession(env.devAccessToken);
  persistState(nextState);
  return nextState;
};

let state: AuthState = injectDevToken(loadState());

const notify = () => {
  listeners.forEach((listener) => listener());
};

const updateState = (next: AuthState) => {
  state = next;
  persistState(next);
  notify();
};

export const authStore = {
  getSnapshot: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);

    if (typeof window === "undefined") {
      return () => {
        listeners.delete(listener);
      };
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }
      state = injectDevToken(loadState());
      notify();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
    };
  },
  setSession: (
    session: AuthSession,
    roleOverride?: UserRole,
    options: SetSessionOptions = {},
  ) => {
    const persist = options.persist ?? true;
    const accessToken = session.tokens?.accessToken ?? "";

    const nextState: AuthState = {
      tokens: session.tokens,
      user: session.user,
      role: resolveRole({
        roleOverride,
        user: session.user,
        accessToken,
      }),
      refreshMode: resolveRefreshMode(session.tokens, options.refreshMode),
      persisted: persist,
    };

    updateState(nextState);
  },
  setAccessToken: (accessToken: string) => {
    if (!state.tokens) {
      return;
    }

    const nextRole =
      resolveRoleFromAccessToken(accessToken) ??
      state.role;

    updateState({
      ...state,
      tokens: {
        ...state.tokens,
        accessToken,
      },
      role: nextRole,
    });
  },
  clear: () => {
    updateState(emptyState);
  },
  getAccessToken: () => state.tokens?.accessToken ?? null,
  getRefreshToken: () => state.tokens?.refreshToken ?? null,
  getRole: () => state.role,
  refreshAccessToken: async (): Promise<string | null> => {
    const snapshot = state;
    const refreshMode = snapshot.refreshMode ?? resolveRefreshMode(snapshot.tokens);
    if (!refreshMode) {
      return null;
    }

    try {
      const refreshed =
        refreshMode === "token" && snapshot.tokens?.refreshToken
          ? await refreshAccessTokenWithToken(snapshot.tokens.refreshToken)
          : await refreshAccessTokenWithCookie();

      const nextTokens: AuthTokens = {
        accessToken: refreshed.accessToken,
        refreshToken:
          refreshed.refreshToken ??
          snapshot.tokens?.refreshToken ??
          "",
        expiresIn:
          refreshed.expiresIn ??
          snapshot.tokens?.expiresIn ??
          null,
      };

      updateState({
        ...snapshot,
        tokens: nextTokens,
        role:
          snapshot.role ??
          resolveRoleFromAccessToken(refreshed.accessToken),
        refreshMode:
          refreshed.refreshToken != null
            ? "token"
            : refreshMode,
      });

      return refreshed.accessToken;
    } catch {
      logAuthWarn("refresh-access-token-failed", {
        refreshMode,
        role: snapshot.role,
      });
      authStore.clear();
      return null;
    }
  },
};
