import type { AuthSession, AuthUser, AuthTokens, UserRole } from "@/ticketing/types/model/auth.model";
import { env } from "@/ticketing/utils/env";

const STORAGE_KEY = "danzzan.auth";

type AuthState = {
  tokens: AuthTokens | null;
  user: AuthUser | null;
  role: UserRole | null;
};

const emptyState: AuthState = {
  tokens: null,
  user: null,
  role: null,
};

const listeners = new Set<() => void>();

const loadState = (): AuthState => {
  if (typeof window === "undefined") {
    return emptyState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyState;
    }
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return {
      tokens: parsed.tokens ?? null,
      user: parsed.user ?? null,
      role: parsed.role ?? null,
    };
  } catch {
    return emptyState;
  }
};

const persistState = (next: AuthState) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};

const buildDevSession = (token: string): AuthState => {
  return {
    tokens: {
      accessToken: token,
      refreshToken: "",
      expiresIn: null,
    },
    user: null,
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
      state = loadState();
      listener();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", handleStorage);
    };
  },
  setSession: (session: AuthSession, roleOverride?: UserRole) => {
    const nextState: AuthState = {
      tokens: session.tokens,
      user: session.user,
      role: roleOverride ?? (session.user?.role === "student" || session.user?.role === "admin" ? session.user.role : null),
    };
    state = nextState;
    persistState(nextState);
    notify();
  },
  clear: () => {
    state = emptyState;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    notify();
  },
  getAccessToken: () => state.tokens?.accessToken ?? null,
  getRefreshToken: () => state.tokens?.refreshToken ?? null,
};
