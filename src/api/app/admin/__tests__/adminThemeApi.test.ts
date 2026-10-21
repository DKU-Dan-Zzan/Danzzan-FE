import { beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_FESTIVAL_SETTING_ID } from "@/config/festivalSetting";
import { adminThemeApi, parseThemeRecommendationResponse } from "@/api/app/admin/adminThemeApi";
import type { ThemeData } from "@/api/app/festival/activeThemeApi";

const request = vi.hoisted(() => vi.fn());
vi.mock("@/api/common/fetchAuth", () => ({ createFetchWithAuth: () => request }));

const themeData: ThemeData = {
  brand: { primary: "#111111", secondary: "#222222", accent: "#333333", strong: "#444444" },
  status: { success: "#555555", warning: "#666666", danger: "#777777", pending: "#888888" },
  category: { pub: "#999999", foodTruck: "#AAAAAA", experience: "#BBBBBB", event: "#CCCCCC", restArea: "#DDDDDD", facility: "#EEEEEE" },
};
const base = `/admin/festival/${CURRENT_FESTIVAL_SETTING_ID}/themes`;

beforeEach(() => { request.mockReset().mockResolvedValue({}); });

describe("adminThemeApi", () => {
  it("accepts the exact three-candidate JSON response and rejects a legacy bare ThemeData", async () => {
    const response = { candidates: (["balanced", "vibrant", "deep"] as const).map((id) => ({
      id, name: id, description: `${id} direction`, themeData,
    })) };
    request.mockResolvedValue(JSON.parse(JSON.stringify(response)) as unknown);
    await expect(adminThemeApi.recommend({ sourceColors: ["#4EB15E"], selectedBaseColor: "#4EB15E" }))
      .resolves.toEqual(response);
    expect(parseThemeRecommendationResponse(response).candidates).toHaveLength(3);
    expect(() => parseThemeRecommendationResponse(themeData)).toThrow("AI_THEME_RESPONSE_INVALID");
    expect(() => parseThemeRecommendationResponse({ data: response })).toThrow("AI_THEME_RESPONSE_INVALID");
    expect(() => parseThemeRecommendationResponse({ candidates: undefined })).toThrow("AI_THEME_RESPONSE_INVALID");
    expect(() => parseThemeRecommendationResponse({ candidates: [{ ...response.candidates[0], themeData: { brand: {} } }] }))
      .toThrow("AI_THEME_RESPONSE_INVALID");
    request.mockResolvedValue(themeData);
    await expect(adminThemeApi.recommend({ sourceColors: ["#4EB15E"], selectedBaseColor: "#4EB15E" }))
      .rejects.toThrow("AI_THEME_RESPONSE_INVALID");
  });

  it("accepts any unique one-to-three-candidate subset but not zero candidates", () => {
    const all = (["balanced", "vibrant", "deep"] as const).map((id) => ({
      id, name: id, description: `${id} direction`, themeData,
    }));
    for (const missing of ["balanced", "vibrant", "deep"] as const) {
      const candidates = all.filter((candidate) => candidate.id !== missing);
      expect(parseThemeRecommendationResponse({ candidates }).candidates).toEqual(candidates);
    }
    for (const candidate of all) {
      expect(parseThemeRecommendationResponse({ candidates: [candidate] }).candidates).toEqual([candidate]);
    }
    expect(() => parseThemeRecommendationResponse({ candidates: [] })).toThrow("AI_THEME_RESPONSE_INVALID");
    expect(() => parseThemeRecommendationResponse({ candidates: [all[0], all[0]] })).toThrow("AI_THEME_RESPONSE_INVALID");
  });

  it("uses the existing authenticated API client for all Theme endpoints", async () => {
    const signal = new AbortController().signal;
    const payload = { name: "테스트", themeData };
    await adminThemeApi.list(signal);
    await adminThemeApi.get(7, signal);
    await adminThemeApi.create(payload);
    await adminThemeApi.update(7, payload);
    await adminThemeApi.delete(7);
    await adminThemeApi.activate(7);
    await adminThemeApi.activateDefault();
    request.mockResolvedValue({ candidates: (["balanced", "vibrant", "deep"] as const).map((id) => ({
      id, name: id, description: id, themeData,
    })) });
    await adminThemeApi.recommend({ sourceColors: ["#4EB15E"], selectedBaseColor: "#4EB15E" });

    expect(request.mock.calls).toEqual([
      [base, { signal }],
      [`${base}/7`, { signal }],
      [base, { method: "POST", body: JSON.stringify(payload) }],
      [`${base}/7`, { method: "PUT", body: JSON.stringify(payload) }],
      [`${base}/7`, { method: "DELETE" }],
      [`${base}/7/activate`, { method: "PUT" }],
      [`${base}/default/activate`, { method: "PUT" }],
      [`${base}/recommend`, { method: "POST", body: JSON.stringify({ sourceColors: ["#4EB15E"], selectedBaseColor: "#4EB15E" }) }],
    ]);
    expect(Object.values(themeData).flatMap((group) => Object.values(group))).toHaveLength(14);
  });
});
