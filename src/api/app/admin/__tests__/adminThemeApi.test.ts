import { beforeEach, describe, expect, it, vi } from "vitest";
import { CURRENT_FESTIVAL_SETTING_ID } from "@/config/festivalSetting";
import { adminThemeApi } from "@/api/app/admin/adminThemeApi";
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
  it("uses the existing authenticated API client for all Theme endpoints", async () => {
    const signal = new AbortController().signal;
    const payload = { name: "테스트", themeData };
    await adminThemeApi.list(signal);
    await adminThemeApi.get(7, signal);
    await adminThemeApi.create(payload);
    await adminThemeApi.update(7, payload);
    await adminThemeApi.delete(7);
    await adminThemeApi.activate(7);

    expect(request.mock.calls).toEqual([
      [base, { signal }],
      [`${base}/7`, { signal }],
      [base, { method: "POST", body: JSON.stringify(payload) }],
      [`${base}/7`, { method: "PUT", body: JSON.stringify(payload) }],
      [`${base}/7`, { method: "DELETE" }],
      [`${base}/7/activate`, { method: "PUT" }],
    ]);
    expect(Object.values(themeData).flatMap((group) => Object.values(group))).toHaveLength(14);
  });
});
