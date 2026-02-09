import { useSyncExternalStore } from "react";
import { adminSystemStore } from "@/store/adminSystemStore";

export const useAdminSystem = () => {
  return useSyncExternalStore(
    adminSystemStore.subscribe,
    adminSystemStore.getSnapshot,
    adminSystemStore.getSnapshot,
  );
};
