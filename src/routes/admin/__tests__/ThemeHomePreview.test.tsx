// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ThemeScreenPreview } from "@/routes/admin/ThemeScreenPreview";
import { readBundledThemeData } from "@/routes/admin/themeEditor";
import { setTicketingEnabled } from "@/lib/app/festival/festivalCalendar";
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
describe("home theme preview", () => {
  it("uses the live bundled fallback when an empty home list is kept", async () => {
    const host = document.createElement("div"); const root = createRoot(host);
    try {
      await act(async () => root.render(<MemoryRouter><ThemeScreenPreview data={readBundledThemeData()} homeImageUrl={null} /></MemoryRouter>));
      await act(async () => [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === "홈")!.click());
      expect(host.querySelector('img[alt="홈 대표 이미지 미리보기"]')?.getAttribute('src')).toBe('/posters/legend-poster-vertical.jpeg');
    } finally { await act(async () => root.unmount()); }
  });

  it.each([true, false])("shows the staged home image without changing global theme when ticketing=%s", async enabled => {
    setTicketingEnabled(enabled);
    const host = document.createElement("div"); document.body.append(host);
    const root = createRoot(host);
    const before = document.documentElement.style.cssText;
    try {
      await act(async () => root.render(<MemoryRouter><ThemeScreenPreview data={readBundledThemeData()} homeImageUrl="/staged-home.jpg" /></MemoryRouter>));
      const home = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')].find(tab => tab.textContent === "홈");
      expect(home).toBeDefined();
      await act(async () => home!.click());
      const image = host.querySelector<HTMLImageElement>('img[alt="홈 대표 이미지 미리보기"]');
      expect(image?.getAttribute('src')).toBe('/staged-home.jpg');
      expect(image?.className).toContain('object-contain');
      expect(host.querySelector('[role="tabpanel"]')?.getAttribute('aria-label')).toBe('홈 화면 샘플');
      expect(document.documentElement.style.cssText).toBe(before);
    } finally { await act(async () => root.unmount()); host.remove(); }
  });
});
