import { createContext, useContext } from "react";
import type { FestivalBranding } from "@/api/app/festival/festivalBrandingApi";

export const FestivalBrandingContext = createContext<FestivalBranding | null>(null);

export function useFestivalBranding() {
  return useContext(FestivalBrandingContext);
}
