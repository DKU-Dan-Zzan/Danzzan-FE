// JWT 역할을 기준으로 세션을 복원하며 계정 전환 전의 비동기 응답을 폐기한다.
import { resolvePermissionsFromAccessToken, resolveRoleFromAccessToken, type AdminPermission } from "@/api/common/authCore";
import { refreshAccessTokenWithCookie, refreshAccessTokenWithToken } from "@/api/common/authRefresh";
import type { AuthSession, AuthTokens, AuthUser, UserRole } from "@/types/common/auth.model";
import { env } from "@/utils/common/env";

const STORAGE_KEY = "danzzan.auth";
const LEGACY_KEYS = ["danzzan.accessToken", "danzzan.admin.accessToken", "accessToken"];
type RefreshMode = "cookie" | "token";
type AuthState = { tokens: AuthTokens | null; user: AuthUser | null; role: UserRole | null; permissions: AdminPermission[]; refreshMode: RefreshMode | null; persisted: boolean };
type SetSessionOptions = { persist?: boolean; refreshMode?: RefreshMode };
const emptyState: AuthState = { tokens: null, user: null, role: null, permissions: [], refreshMode: null, persisted: false };
const listeners = new Set<() => void>();

function normalize(session: AuthSession, options: SetSessionOptions = {}): AuthState {
  const token = session.tokens?.accessToken;
  const role = typeof token === "string" ? resolveRoleFromAccessToken(token) : null;
  if (!role) return emptyState;
  const tokens = { ...session.tokens, refreshToken: session.tokens.refreshToken ?? "" };
  return {
    tokens, user: session.user ? { ...session.user, role } : null, role, permissions: resolvePermissionsFromAccessToken(token),
    refreshMode: options.refreshMode ?? (tokens.refreshToken ? "token" : "cookie"),
    persisted: options.persist ?? true,
  };
}
function loadState(): AuthState {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!parsed || (parsed.schemaVersion !== undefined && parsed.schemaVersion !== 2)) return emptyState;
      return normalize(parsed, { refreshMode: ["cookie", "token"].includes(parsed.refreshMode) ? parsed.refreshMode : undefined });
    }
    for (const key of LEGACY_KEYS) {
      const token = window.localStorage.getItem(key);
      if (token) return normalize({ tokens: { accessToken: token, refreshToken: "", expiresIn: null }, user: null });
    }
  } catch { return emptyState; }
  return emptyState;
}
function persist(next: AuthState) {
  if (typeof window === "undefined") return;
  try {
    for (const key of LEGACY_KEYS) window.localStorage.removeItem(key);
    if (!next.persisted || !next.tokens) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, tokens: next.tokens, user: next.user, role: next.role, permissions: next.permissions, refreshMode: next.refreshMode }));
  } catch { /* Storage restrictions must not interrupt an in-memory logout. */ }
}
let state = loadState();
if (!state.tokens && env.isDev && env.devAccessToken) {
  state = normalize({ tokens: { accessToken: env.devAccessToken, refreshToken: "", expiresIn: null }, user: null });
}
persist(state);
let sessionEpoch = 0;
let refreshFlight: { epoch: number; promise: Promise<string | null> } | null = null;
const notify = () => listeners.forEach(listener => listener());
const update = (next: AuthState, newSession = false) => {
  if (newSession) sessionEpoch += 1;
  state = next;
  persist(next);
  notify();
};
const handleStorage = (event: StorageEvent) => {
  if (event.key !== null && event.key !== STORAGE_KEY && !LEGACY_KEYS.includes(event.key)) return;
  sessionEpoch += 1;
  state = loadState();
  persist(state);
  notify();
};

export const authStore = {
  getSnapshot: () => state,
  getSessionEpoch: () => sessionEpoch,
  getAccessToken: () => state.tokens?.accessToken ?? null,
  getRefreshToken: () => state.tokens?.refreshToken ?? null,
  getRole: () => state.role,
  getPermissions: () => state.permissions,
  subscribe(listener: () => void) {
    if (listeners.size === 0 && typeof window !== "undefined") window.addEventListener("storage", handleStorage);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && typeof window !== "undefined") window.removeEventListener("storage", handleStorage);
    };
  },
  setSession(session: AuthSession, options: SetSessionOptions = {}) { update(normalize(session, options), true); },
  setAccessToken(accessToken: string) {
    if (!state.tokens) return;
    const next = normalize({ tokens: { ...state.tokens, accessToken }, user: state.user }, { persist: state.persisted, refreshMode: state.refreshMode ?? undefined });
    update(next, !next.tokens);
  },
  updateUser(user: AuthUser, expectedEpoch: number) {
    if (sessionEpoch !== expectedEpoch || !state.tokens || !state.role) return false;
    update({ ...state, user: { ...user, role: state.role } });
    return true;
  },
  clear() { update(emptyState, true); },
  refreshAccessToken(): Promise<string | null> {
    const snapshot = state;
    const epoch = sessionEpoch;
    if (!snapshot.tokens || !snapshot.refreshMode) return Promise.resolve(null);
    if (refreshFlight?.epoch === epoch) return refreshFlight.promise;
    const promise = (async () => {
      try {
        const refreshed = snapshot.refreshMode === "token"
          ? await refreshAccessTokenWithToken(snapshot.tokens!.refreshToken, snapshot.tokens!.accessToken)
          : await refreshAccessTokenWithCookie(snapshot.tokens!.refreshToken || undefined);
        if (epoch !== sessionEpoch) return null;
        const next = normalize({ tokens: { ...snapshot.tokens!, ...refreshed }, user: snapshot.user }, { persist: snapshot.persisted, refreshMode: snapshot.refreshMode! });
        update(next, !next.tokens);
        return next.tokens?.accessToken ?? null;
      } catch {
        if (epoch === sessionEpoch) authStore.clear();
        return null;
      } finally {
        if (refreshFlight?.epoch === epoch) refreshFlight = null;
      }
    })();
    refreshFlight = { epoch, promise };
    return promise;
  },
};
