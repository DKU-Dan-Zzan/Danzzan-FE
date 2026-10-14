// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { FestivalBrandingContext } from "@/lib/app/festival/festivalBrandingContext"
import { FestivalBrandingImage } from "@/components/layout/FestivalBrandingImage"
import ServiceClosedNotice from "@/routes/common/ServiceClosedNotice"

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const uploadedLogo = "https://cdn.example.com/blue-transparent-logo.png"
let host: HTMLDivElement
let root: Root

beforeEach(() => {
  host = document.createElement("div")
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
})

async function render(logoImageUrl: string | null, preview = false) {
  await act(async () => root.render(
    <FestivalBrandingContext.Provider value={{ festivalSettingId: 1, posterImageUrl: null, logoImageUrl }}>
      <header style={{ backgroundColor: "white" }}>
        <FestivalBrandingImage kind="logo" className="object-contain" />
      </header>
      <MemoryRouter>
        <ServiceClosedNotice preview={preview} titleKey="closed.ticketing.title" descriptionKey="closed.ticketing.description" actionKey="closed.ticketing.action" actionTo="/" />
      </MemoryRouter>
    </FestivalBrandingContext.Provider>,
  ))
}
const darkLogo = () => host.querySelector<HTMLImageElement>("section img:not([aria-hidden])")!
const lightLogo = () => host.querySelector<HTMLImageElement>("header img")!
function expectBrightMonochrome(image: HTMLImageElement) {
  // RGB-only filters retain the source's alpha silhouette; shadow comes after recoloring.
  expect(image.style.filter).toMatch(/^brightness\(0\) invert\(1\) drop-shadow\(/)
  expect(image.style.filter).toContain("rgba(0, 0, 0, 0.35)")
  expect(image.className).toContain("object-contain")
}

describe("ServiceClosedNotice logo on dark backgrounds", () => {
  it.each([false, true])("brightens the original uploaded logo only in the dark notice (preview=%s)", async preview => {
    await render(uploadedLogo, preview)
    expect(darkLogo().getAttribute("src")).toBe(uploadedLogo)
    expect(darkLogo().alt).toBe("축제 로고")
    expectBrightMonochrome(darkLogo())
    expect(lightLogo().getAttribute("src")).toBe(uploadedLogo)
    expect(lightLogo().style.filter).toBe("")
    expect(host.querySelector("section")?.style.color).toBe("var(--poster-closed-copy)")
    expect(host.querySelector("section a")?.getAttribute("style")).toContain("var(--poster-closed-ink)")
  })

  it("uses the same bright treatment for the bundled fallback without recoloring the light header", async () => {
    await render(null)
    expect(darkLogo().getAttribute("src")).toBe("/legend-logo.png")
    expectBrightMonochrome(darkLogo())
    expect(lightLogo().getAttribute("src")).toBe("/legend-logo.png")
    expect(lightLogo().style.filter).toBe("")
  })

  it("retains the bright treatment after an uploaded logo fails and falls back", async () => {
    await render(uploadedLogo)
    await act(async () => darkLogo().dispatchEvent(new Event("error")))
    expect(darkLogo().getAttribute("src")).toBe("/legend-logo.png")
    expect(darkLogo().alt).toBe("LEGEND")
    expectBrightMonochrome(darkLogo())
    expect(lightLogo().getAttribute("src")).toBe(uploadedLogo)
    expect(lightLogo().style.filter).toBe("")
  })
})
