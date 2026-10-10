// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it } from "vitest";
import { AppHeaderLogo } from "@/components/layout/AppHeaderLogo";
import { FestivalBrandingContext } from "@/lib/app/festival/FestivalBrandingProvider";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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

async function render(logoImageUrl: string | null) {
  await act(async () => root.render(<FestivalBrandingContext.Provider value={{ festivalSettingId: 1, posterImageUrl: null, logoImageUrl }}>
    <AppHeaderLogo />
  </FestivalBrandingContext.Provider>));
  return host.querySelector("img")!;
}

async function loadAtSize(image: HTMLImageElement, width: number, height: number) {
  Object.defineProperties(image, { naturalWidth: { configurable: true, value: width }, naturalHeight: { configurable: true, value: height } });
  await act(async () => image.dispatchEvent(new Event("load")));
}

it("gives a moderately wide uploaded logo a bounded larger box without stretching it", async () => {
  const image = await render("https://cdn.example.com/wide-logo.png");
  await loadAtSize(image, 2079, 775);
  expect(image.className).toContain("h-11 w-[120px]");
  expect(image.className).toContain("object-contain object-left");
  expect(image.className).toContain("left-4 top-1/2");
  await act(async () => image.dispatchEvent(new Event("error")));
  expect(image.getAttribute("src")).toBe("/legend-logo.png");
  expect(image.className).toContain("h-7 w-[98px]");
});

it("keeps square and extra-long uploaded logos inside the original-size box", async () => {
  const square = await render("https://cdn.example.com/square.png");
  await loadAtSize(square, 800, 800);
  expect(square.className).toContain("h-7 w-[98px]");
  const long = await render("https://cdn.example.com/long.png");
  await loadAtSize(long, 2000, 300);
  expect(long.className).toContain("h-7 w-[98px]");
});
