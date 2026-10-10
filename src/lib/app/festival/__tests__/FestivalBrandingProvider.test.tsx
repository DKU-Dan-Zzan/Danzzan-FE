// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { festivalBrandingApi } from "@/api/app/festival/festivalBrandingApi";
import { FestivalBrandingProvider } from "@/lib/app/festival/FestivalBrandingProvider";
import { useFestivalBranding } from "@/lib/app/festival/festivalBrandingContext";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
vi.mock("@/api/app/festival/festivalBrandingApi", () => ({ festivalBrandingApi: { get: vi.fn() } }));
const branding = { festivalSettingId: 1, logoImageUrl: "https://cdn.example.com/logo.png", posterImageUrl: "https://cdn.example.com/poster.png" };
let host: HTMLDivElement;
let root: Root;
let client: QueryClient;

function Screen() {
  const value = useFestivalBranding();
  const navigate = useNavigate();
  return <><span data-testid="logo-url">{value?.logoImageUrl ?? "fallback"}</span>
    <button onClick={() => navigate("/timetable")}>시간표</button></>;
}

beforeEach(() => {
  vi.mocked(festivalBrandingApi.get).mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  host.remove();
});

async function render(path: string) {
  await act(async () => root.render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>
    <FestivalBrandingProvider><Screen /></FestivalBrandingProvider>
  </MemoryRouter></QueryClientProvider>));
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
}

it("fetches public branding once for user routes and shares it across navigation", async () => {
  vi.mocked(festivalBrandingApi.get).mockResolvedValue(branding);
  await render("/map");
  expect(host.querySelector('[data-testid="logo-url"]')?.textContent).toBe(branding.logoImageUrl);
  await act(async () => host.querySelector("button")!.click());
  expect(host.querySelector('[data-testid="logo-url"]')?.textContent).toBe(branding.logoImageUrl);
  expect(festivalBrandingApi.get).toHaveBeenCalledOnce();
  expect(vi.mocked(festivalBrandingApi.get).mock.calls[0][0]).toBe(1);
});

it("keeps bundled fallbacks when the public request fails", async () => {
  vi.mocked(festivalBrandingApi.get).mockRejectedValue(new Error("offline"));
  await render("/mypage");
  expect(host.querySelector('[data-testid="logo-url"]')?.textContent).toBe("fallback");
});

it("does not start an extra public request on the admin route", async () => {
  await render("/admin/theme");
  expect(festivalBrandingApi.get).not.toHaveBeenCalled();
});
