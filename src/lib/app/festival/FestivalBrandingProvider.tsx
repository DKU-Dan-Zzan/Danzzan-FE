import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { festivalBrandingApi } from "@/api/app/festival/festivalBrandingApi";
import { CURRENT_FESTIVAL_SETTING_ID } from "@/config/festivalSetting";
import { FestivalBrandingContext } from "@/lib/app/festival/festivalBrandingContext";

/** One public branding lookup shared by user and ticketing routes. Admin preview stays independent. */
export function FestivalBrandingProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const branding = useQuery({
    queryKey: ["festival", CURRENT_FESTIVAL_SETTING_ID, "branding"],
    queryFn: ({ signal }) => festivalBrandingApi.get(CURRENT_FESTIVAL_SETTING_ID, signal),
    enabled: !isAdminRoute,
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return <FestivalBrandingContext.Provider value={isAdminRoute ? null : branding.data ?? null}>{children}</FestivalBrandingContext.Provider>;
}
