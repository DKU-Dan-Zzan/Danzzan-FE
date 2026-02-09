export type AdminSystem = "wristband" | "board";

const STORAGE_KEY = "danzzan.adminSystem";

const isAdminSystem = (value: unknown): value is AdminSystem =>
  value === "wristband" || value === "board";

const listeners = new Set<() => void>();

const loadState = (): AdminSystem | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return isAdminSystem(raw) ? raw : null;
  } catch {
    return null;
  }
};

const persistState = (next: AdminSystem | null) => {
  if (typeof window === "undefined") {
    return;
  }
  if (!next) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, next);
};

let state: AdminSystem | null = loadState();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const adminSystemStore = {
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
  setSystem: (system: AdminSystem) => {
    state = system;
    persistState(system);
    notify();
  },
  clear: () => {
    state = null;
    persistState(null);
    notify();
  },
};
