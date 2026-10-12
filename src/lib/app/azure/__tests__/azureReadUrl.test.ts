import { afterEach, describe, expect, it, vi } from "vitest";

const adminAuth = vi.hoisted(() => ({
  accessToken: "admin-token" as string | null,
  reissue: vi.fn<() => Promise<string | null>>(),
  clear: vi.fn(),
}));

vi.mock("@/api/common/baseUrl", () => ({ getApiBaseUrl: () => "https://api.example.test" }));
vi.mock("@/lib/app/admin/admin-auth-session", () => ({
  getAdminAccessToken: () => adminAuth.accessToken,
  reissueAdminToken: () => adminAuth.reissue(),
  clearAdminSession: () => adminAuth.clear(),
}));
vi.mock("@/store/common/authStore", () => ({ authStore: { getSessionEpoch: () => 0 } }));

import {
  isAzureBlobReadUrl,
  isAzureReadUrlExpiringSoon,
  renewAzureReadUrl,
} from "@/lib/app/azure/azureReadUrl";

const currentUrl = "https://danzzandemo2026.blob.core.windows.net/images/poster.png?sv=2024-11-04&se=2026-10-12T00%3A01%3A00Z&sig=current";
const nextUrl = "https://danzzandemo2026.blob.core.windows.net/images/poster.png?sv=2024-11-04&se=2026-10-12T01%3A00%3A00Z&sig=next";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  adminAuth.accessToken = "admin-token";
});

describe("Azure read URL renewal", () => {
  it("recognizes only signed Azure Blob URLs and detects approaching expiry", () => {
    expect(isAzureBlobReadUrl(currentUrl)).toBe(true);
    expect(isAzureBlobReadUrl("https://cdn.example.com/image.png?sig=x")).toBe(false);
    expect(isAzureReadUrlExpiringSoon(currentUrl, Date.parse("2026-10-12T00:00:00Z"))).toBe(true);
    expect(isAzureReadUrlExpiringSoon("/posters/legend.jpg", Date.now())).toBe(false);
  });

  it("posts the current URL to the API once and can use an existing admin draft token", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ imageUrl: nextUrl }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(Promise.all([renewAzureReadUrl(currentUrl), renewAzureReadUrl(currentUrl)])).resolves.toEqual([nextUrl, nextUrl]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://api.example.test/images/read-url", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ imageUrl: currentUrl }),
    }));
    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer admin-token");
  });

  it("reuses the admin refresh path once after a 401", async () => {
    adminAuth.reissue.mockResolvedValue("refreshed-token");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "expired" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ imageUrl: nextUrl }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(renewAzureReadUrl(currentUrl)).resolves.toBe(nextUrl);

    expect(adminAuth.reissue).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retryHeaders = new Headers(fetchMock.mock.calls[1]?.[1]?.headers);
    expect(retryHeaders.get("Authorization")).toBe("Bearer refreshed-token");
  });

  it("does not call the API for non-Azure URLs", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(renewAzureReadUrl("https://cdn.example.com/image.png")).resolves.toBe("https://cdn.example.com/image.png");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses an anonymous API request for public image pages", async () => {
    adminAuth.accessToken = null;
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ imageUrl: nextUrl }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(renewAzureReadUrl(currentUrl)).resolves.toBe(nextUrl);

    const headers = new Headers(fetchMock.mock.calls[0]?.[1]?.headers);
    expect(headers.get("Authorization")).toBeNull();
  });
});
