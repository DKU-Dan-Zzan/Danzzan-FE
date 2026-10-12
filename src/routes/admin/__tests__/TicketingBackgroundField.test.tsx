// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import TicketingBackgroundField from "@/routes/admin/TicketingBackgroundField"
import { recommendPosterBackground } from "@/api/app/festival/posterBackgroundApi"
import { festivalBrandingApi } from "@/api/app/festival/festivalBrandingApi"
import { toast } from "sonner"

vi.mock("@/api/app/festival/posterBackgroundApi", async importOriginal => ({ ...await importOriginal<typeof import("@/api/app/festival/posterBackgroundApi")>(), recommendPosterBackground: vi.fn() }))
vi.mock("@/api/app/festival/festivalBrandingApi", () => ({ festivalBrandingApi: { get: vi.fn().mockResolvedValue({ festivalSettingId: 1, posterImageUrl: "https://example.com/saved-poster.jpg", logoImageUrl: null }) } }))
vi.mock("@/components/ticketing/panels/PaperTicketCard", async () => {
  const { useFestivalBranding } = await import("@/lib/app/festival/festivalBrandingContext")
  return { PaperTicketCard: () => <div data-poster={useFestivalBranding()?.posterImageUrl} /> }
})
vi.mock("@/routes/common/ServiceClosedNotice", () => ({ default: () => <div /> }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let root: Root | undefined
let container: HTMLDivElement
async function render(mode: "ticket" | "closed", onFile: (file: File) => void) {
  container = document.createElement("div"); document.body.append(container); root = createRoot(container)
  await act(async () => root!.render(<TicketingBackgroundField mode={mode} file={null} disabled={false} onFile={onFile} onReset={() => {}} />))
}
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; container?.remove(); vi.clearAllMocks() })
describe("AI poster background draft", () => {
  it("loads saved official branding when the admin context is null", async () => {
    await render("ticket", vi.fn())
    expect(festivalBrandingApi.get).toHaveBeenCalledWith(undefined, expect.any(AbortSignal))
    expect(container.querySelector("[data-poster]")?.getAttribute("data-poster")).toBe("https://example.com/saved-poster.jpg")
  })
  for (const mode of ["ticket", "closed"] as const) it(`stages ${mode} recommendation through unchanged onFile`, async () => {
    vi.mocked(recommendPosterBackground).mockResolvedValue({ target: mode, mimeType: "image/jpeg", imageBase64: "/9j/2Q==", width: 800, height: 360, focusX: .5, focusY: .5, reason: "차분한 포스터 여백" })
    const onFile = vi.fn()
    await render(mode, onFile)
    expect(container.querySelector("input")?.getAttribute("aria-label")).toBe(mode === "ticket" ? "발급 티켓 배경 사진 선택" : "입장 안내 배경 사진 선택")
    const button = [...container.querySelectorAll("button")].find(button => button.textContent === "포스터로 AI 배경 추천")!
    await act(async () => button.click())
    expect(recommendPosterBackground).toHaveBeenCalledWith(mode, expect.any(AbortSignal))
    expect(onFile).toHaveBeenCalledOnce()
    expect(onFile.mock.calls[0][0]).toBeInstanceOf(File)
    expect(container.textContent).toContain("차분한 포스터 여백")
  })
  it("leaves draft unchanged on AI failure and re-enables retry", async () => {
    vi.mocked(recommendPosterBackground).mockRejectedValue(new Error("공식 포스터를 먼저 저장해 주세요."))
    const onFile = vi.fn(); await render("ticket", onFile)
    const button = [...container.querySelectorAll("button")].find(button => button.textContent === "포스터로 AI 배경 추천")!
    await act(async () => button.click())
    expect(onFile).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("공식 포스터를 먼저 저장해 주세요.")
    expect(button.disabled).toBe(false)
  })
})
