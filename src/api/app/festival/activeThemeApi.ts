import { http } from "@/lib/http";

export type ThemeData = {
  brand: {
    primary: string;
    secondary: string;
    accent: string;
    textEmphasis: string;
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
};

/** A 204 response intentionally returns null, leaving the bundled Theme Core untouched. */
export async function getActiveTheme(festivalSettingId: number): Promise<ActiveThemeResponse | null> {
  const response = await http.get<ActiveThemeResponse>(
    `/festival/${festivalSettingId}/themes/active`,
    { timeout: 5000 },
  );
  return response.status === 204 ? null : response.data;
}
