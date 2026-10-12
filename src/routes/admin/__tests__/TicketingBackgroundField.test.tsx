// @vitest-environment jsdom
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it, vi } from "vitest"
import TicketingBackgroundField from "@/routes/admin/TicketingBackgroundField"
import { festivalBrandingApi } from "@/api/app/festival/festivalBrandingApi"
import { toast } from "sonner"

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
describe("Manual ticketing background draft", () => {
  it("loads saved official branding when the admin context is null", async () => {
    await render("ticket", vi.fn())
    expect(festivalBrandingApi.get).toHaveBeenCalledWith(undefined, expect.any(AbortSignal))
    expect(container.querySelector("[data-poster]")?.getAttribute("data-poster")).toBe("https://example.com/saved-poster.jpg")
  })
  it.each(["ticket", "closed"] as const)("stages a manual %s image without an AI action", async (mode) => {
    const onFile = vi.fn()
    await render(mode, onFile)
    expect(container.textContent).not.toContain("포스터로 AI 배경 추천")
    expect(container.textContent).toContain("AI 배경 추천은 테마 관리에서")
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const file = new File(["image"], "background.png", { type: "image/png" })
    await act(async () => {
      Object.defineProperty(input, "files", { value: [file] })
      input.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(onFile).toHaveBeenCalledExactlyOnceWith(file)
    expect(input.value).toBe("")
  })
  it.each([
    new File([], "empty.png", { type: "image/png" }),
    new File(["image"], "invalid.svg", { type: "image/svg+xml" }),
    new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }),
  ])("rejects invalid manual image $name without replacing the draft", async (file) => {
    const onFile = vi.fn()
    await render("ticket", onFile)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    await act(async () => {
      Object.defineProperty(input, "files", { value: [file] })
      input.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(onFile).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("10MB 이하의 JPG·PNG 이미지를 선택해 주세요.")
  })
})
