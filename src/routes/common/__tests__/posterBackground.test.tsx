// @vitest-environment jsdom
import { act, type CSSProperties } from "react"
import { createRoot, type Root } from "react-dom/client"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { FestivalBrandingContext } from "@/lib/app/festival/festivalBrandingContext"
import { PaperTicketCard, DEFAULT_TICKET_CARD_BACKGROUND } from "@/components/ticketing/panels/PaperTicketCard"
import ServiceClosedNotice from "@/routes/common/ServiceClosedNotice"
import { DEFAULT_FESTIVAL_POSTER } from "@/lib/app/festival/brandingImageSource"
import { setTicketCardBackgroundImageUrl } from "@/lib/app/festival/festivalCalendar"
import { recommendationFile, type PosterBackgroundRecommendation } from "@/api/app/festival/posterBackgroundApi"

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

let root: Root | undefined
let container: HTMLDivElement
async function render(mode: "ticket" | "closed", custom?: string | null, poster: string | null = "https://example.com/official.jpg", theme = "#7342c8") {
  if (!root) { container = document.createElement("div"); document.body.append(container); root = createRoot(container) }
  await act(async () => root!.render(<FestivalBrandingContext.Provider value={{ festivalSettingId: 1, posterImageUrl: poster, logoImageUrl: null }}>
    <div data-theme-preview style={{ "--theme-brand-primary": theme, "--theme-brand-accent": theme, "--theme-brand-strong": theme } as CSSProperties}><MemoryRouter>{mode === "ticket"
      ? <PaperTicketCard backgroundImageUrl={custom} ticket={{ id: "a", status: "issued", eventName: "DAY 1", eventDate: "2026-05-06", issuedAt: "", seat: "", qrCodeUrl: "" }} />
      : <ServiceClosedNotice backgroundImageUrl={custom} titleKey="closed.ticketing.title" descriptionKey="closed.ticketing.description" actionKey="closed.ticketing.action" actionTo="/" />}
    </MemoryRouter></div>
  </FestivalBrandingContext.Provider>))
}
function image(mode: "ticket" | "closed") { return container.querySelector(mode === "ticket" ? "svg image" : "section > img") }
function source(mode: "ticket" | "closed") { return image(mode)?.getAttribute(mode === "ticket" ? "href" : "src") }
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; container?.remove(); setTicketCardBackgroundImageUrl(null) })

// CSS color-mix(in srgb) is channel-linear; luminance is then calculated per WCAG.
// Every channel and luminance is monotonic, so black/white extrema bound all opaque theme colors.
function mixExtreme(expression: string, themeChannel: number) {
  const match = expression.match(/^color-mix\(in srgb, var\(--theme-brand-\w+, [^)]+\) (\d+)%, (white|black) (\d+)%\)$/)
  expect(match, expression).not.toBeNull()
  const weight = Number(match![1]) / 100
  expect(Number(match![1]) + Number(match![3])).toBe(100)
  const channel = themeChannel * weight + (match![2] === "white" ? 255 : 0) * (1 - weight)
  return [channel, channel, channel]
}
function luminance(rgb: number[]) {
  return rgb.map(value => {
    const s = value / 255
    return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4
  }).reduce((total, value, index) => total + value * [.2126, .7152, .0722][index], 0)
}
function contrast(light: number[], dark: number[]) {
  return (luminance(light) + .05) / (luminance(dark) + .05)
}

describe("poster background source priority and failures", () => {
  for (const mode of ["ticket", "closed"] as const) {
    it(`${mode}: custom → official → bundle → solid on actual image errors`, async () => {
      await render(mode, "https://example.com/custom.jpg")
      expect(source(mode)).toBe("https://example.com/custom.jpg")
      await act(async () => image(mode)!.dispatchEvent(new Event("error")))
      expect(source(mode)).toBe("https://example.com/official.jpg")
      await act(async () => image(mode)!.dispatchEvent(new Event("error")))
      expect(source(mode)).toBe(mode === "ticket" ? DEFAULT_TICKET_CARD_BACKGROUND : DEFAULT_FESTIVAL_POSTER)
      await act(async () => image(mode)!.dispatchEvent(new Event("error")))
      expect(image(mode)).toBeNull()
      expect(container.querySelector(mode === "ticket" ? "p" : "a")?.textContent).toBeTruthy()
      await render(mode, "https://example.com/new.jpg")
      expect(source(mode)).toBe("https://example.com/new.jpg")
    })
    it(`${mode}: missing custom uses official, missing official uses bundle`, async () => {
      await render(mode, null)
      expect(source(mode)).toBe("https://example.com/official.jpg")
      await render(mode, null, null)
      expect(source(mode)).toBe(mode === "ticket" ? DEFAULT_TICKET_CARD_BACKGROUND : DEFAULT_FESTIVAL_POSTER)
    })
  }
  it("ticket: saved custom takes priority, explicit null previews reset to official", async () => {
    setTicketCardBackgroundImageUrl("https://example.com/saved.jpg")
    await render("ticket")
    expect(source("ticket")).toBe("https://example.com/saved.jpg")
    await render("ticket", null)
    expect(source("ticket")).toBe("https://example.com/official.jpg")
    expect(container.innerHTML).toContain("rgba(255,255,255,0.64)")
    expect(container.querySelector("p")?.style.color).toBe("var(--poster-ticket-ink)")
  })
  it("keeps theme-derived ticket text above 4.5:1 for every theme and poster", async () => {
    await render("ticket", "https://example.com/custom.jpg")
    const card = container.querySelector<HTMLElement>('[style*="--poster-ticket-ink:"]')!
    // The brightest possible dark mix is a pure-white strong color; any other color is darker.
    const brightestText = mixExtreme(card.style.getPropertyValue("--poster-ticket-ink"), 255)
    const stops = [...container.querySelectorAll("svg stop")]
    expect(stops).toHaveLength(2)
    for (const stop of stops) {
      const alpha = Number(stop.getAttribute("stop-color")!.match(/,([\d.]+)\)$/)![1])
      const darkestBackground = [alpha * 255, alpha * 255, alpha * 255]
      expect(contrast(darkestBackground, brightestText)).toBeGreaterThanOrEqual(4.5)
      expect(alpha).toBeLessThanOrEqual(.70)
    }
    for (const label of container.querySelectorAll("p")) expect(label.style.color).toBe("var(--poster-ticket-ink)")
    expect(container.querySelector("line")?.getAttribute("stroke")).toBe("var(--poster-ticket-ink)")
    // The status badge retains its distinct semantic palette.
    expect(container.querySelector("span")?.style.color).toBe("var(--ticket-badge-issued-text)")
    expect(container.querySelector("span")?.style.background).toBe("var(--ticket-badge-issued-bg)")
  })
  it("keeps closed copy, accent and CTA above 4.5:1 for every theme and poster", async () => {
    await render("closed", "https://example.com/custom.jpg")
    const section = container.querySelector("section")!
    const veil = section.querySelector<HTMLElement>(":scope > div[aria-hidden]")!
    const veils = [...veil.style.background.matchAll(/rgba\(([^)]+)\)/g)].map(match => match[1].split(",").map(Number))
    expect(veils).toHaveLength(2)
    for (const [r, g, b, alpha] of veils) {
      // White image under the veil is the lightest possible background.
      const lightestBackground = [r, g, b].map(value => value * alpha + 255 * (1 - alpha))
      for (const variable of ["--poster-closed-copy", "--poster-closed-accent"]) {
        const darkestText = mixExtreme(section.style.getPropertyValue(variable), 0)
        expect(contrast(darkestText, lightestBackground)).toBeGreaterThanOrEqual(4.5)
      }
    }
    const darkestButton = mixExtreme(section.style.getPropertyValue("--poster-closed-button-bg"), 0)
    const brightestInk = mixExtreme(section.style.getPropertyValue("--poster-closed-ink"), 255)
    expect(contrast(darkestButton, brightestInk)).toBeGreaterThanOrEqual(4.5)
    expect(section.style.color).toBe("var(--poster-closed-copy)")
    for (const paragraph of section.querySelectorAll("p")) expect(paragraph.style.color).toBe("var(--poster-closed-copy)")
    for (const highlight of section.querySelectorAll("strong")) expect(highlight.style.color).toBe("var(--poster-closed-accent)")
    const icon = section.querySelector("svg")?.parentElement
    expect(icon?.style.color).toBe("var(--poster-closed-accent)")
    expect(section.querySelector("a")?.style.color).toBe("var(--poster-closed-ink)")
    expect(section.querySelector("a")?.style.background).toBe("var(--poster-closed-button-bg)")
  })
  it.each(["ticket", "closed"] as const)("%s defines local mixes bound to the surrounding preview theme", async mode => {
    for (const theme of ["#ff1100", "#0044ff"]) {
      await render(mode, null, null, theme)
      const preview = container.querySelector<HTMLElement>("[data-theme-preview]")!
      const component = preview.firstElementChild as HTMLElement
      expect(preview.style.getPropertyValue("--theme-brand-strong")).toBe(theme)
      // Do not define brand tokens locally: the nearest preview/provider must supply them.
      expect(component.style.getPropertyValue("--theme-brand-strong")).toBe("")
      if (mode === "ticket") {
        expect(component.style.getPropertyValue("--poster-ticket-ink")).toContain("var(--theme-brand-strong,")
      } else {
        expect(component.style.getPropertyValue("--poster-closed-copy")).toContain("var(--theme-brand-primary,")
        expect(component.style.getPropertyValue("--poster-closed-accent")).toContain("var(--theme-brand-accent,")
        expect(component.style.getPropertyValue("--poster-closed-button-bg")).toContain("var(--theme-brand-accent,")
        expect(component.style.getPropertyValue("--poster-closed-ink")).toContain("var(--theme-brand-strong,")
      }
    }
  })
  it("converts the staged JPEG to File, refusing corrupt output", () => {
    const result: PosterBackgroundRecommendation = { target: "ticket", mimeType: "image/jpeg", imageBase64: "/9j/2Q==", width: 800, height: 360, focusX: .5, focusY: .5, reason: "여백" }
    const file = recommendationFile(result)
    expect(file.name).toBe("poster-ai-ticket.jpg")
    expect(file.type).toBe("image/jpeg")
    expect(file.size).toBe(4)
    expect(() => recommendationFile({ ...result, imageBase64: btoa("not an image") })).toThrow()
  })
})
