// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FestivalBrandingContext } from "@/lib/app/festival/festivalBrandingContext";
import { FestivalBrandingImage } from "@/components/layout/FestivalBrandingImage";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const branding = { festivalSettingId: 1, logoImageUrl: "https://cdn.example.com/logo.png", posterImageUrl: "http://localhost:8080/uploads/festival/1/poster/test.jpg" };
let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});

async function render(value: typeof branding | null, kind: "logo" | "poster") {
  await act(async () => root.render(<FestivalBrandingContext.Provider value={value}>
    <FestivalBrandingImage kind={kind} className="h-7 w-[98px] object-contain" decorative={kind === "poster"} />
  </FestivalBrandingContext.Provider>));
  return host.querySelector("img")!;
}

describe("FestivalBrandingImage", () => {
  it("uses the uploaded logo and falls back if it fails to load", async () => {
    const image = await render(branding, "logo");
    expect(image.getAttribute("src")).toBe(branding.logoImageUrl);
    expect(image.alt).toBe("축제 로고");
    expect(image.className).toContain("object-contain");
    await act(async () => image.dispatchEvent(new Event("error")));
    expect(host.querySelector("img")?.getAttribute("src")).toBe("/legend-logo.png");
    expect(host.querySelector("img")?.alt).toBe("LEGEND");
  });

  it("uses the official poster, then the original poster on image failure", async () => {
    const image = await render(branding, "poster");
    expect(image.getAttribute("src")).toBe(branding.posterImageUrl);
    expect(image.getAttribute("aria-hidden")).toBe("true");
    document.documentElement.style.setProperty("--theme-brand-strong", "#123456");
    expect(image.getAttribute("src")).toBe(branding.posterImageUrl);
    document.documentElement.style.removeProperty("--theme-brand-strong");
    await act(async () => image.dispatchEvent(new Event("error")));
    expect(host.querySelector("img")?.getAttribute("src")).toBe("/posters/legend-poster-vertical.jpeg");
  });

  it("uses bundled images when the API has no branding and accepts a changed URL", async () => {
    expect((await render(null, "logo")).getAttribute("src")).toBe("/legend-logo.png");
    const image = await render(branding, "logo");
    await act(async () => image.dispatchEvent(new Event("error")));
    const next = { ...branding, logoImageUrl: "https://cdn.example.com/new-logo.png" };
    expect((await render(next, "logo")).getAttribute("src")).toBe(next.logoImageUrl);
  });
});
