import { http } from "@/lib/http";

export type ThemeData = {
  brand: {
    primary: string;
    secondary: string;
    accent: string;
    strong: string;
  };
  status: {
    success: string;
    warning: string;
    danger: string;
    pending: string;
  };
  category: {
    pub: string;
    foodTruck: string;
    experience: string;
    event: string;
    restArea: string;
    facility: string;
  };
};

export type ActiveThemeResponse = {
  id: number;
  festivalSettingId: number;
  name: string;
  themeData: ThemeData;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  /** Admin Theme responses include provenance; the public active endpoint omits it. */
  sourcePosterUrl?: string | null;
  selectedBaseColor?: string | null;
  sourceColors?: string[] | null;
};

/** A 204 response returns null so callers restore the bundled Theme Core. */
export async function getActiveTheme(festivalSettingId: number): Promise<ActiveThemeResponse | null> {
  const response = await http.get<ActiveThemeResponse>(
    `/festival/${festivalSettingId}/themes/active`,
    { timeout: 5000 },
  );
  return response.status === 204 ? null : response.data;
}
