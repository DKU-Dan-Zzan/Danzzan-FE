// @vitest-environment jsdom
import { act } from "react"
import { MemoryRouter } from "react-router-dom"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import AdminSettings from "@/routes/admin/AdminSettings"

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const state = vi.hoisted(() => ({ role: "manager", permissions: ["OPERATIONS"] as string[] }))
const api = vi.hoisted(() => ({ get: vi.fn(), metadata: vi.fn(), ticketing: vi.fn(), upload: vi.fn() }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }))

vi.mock("@/store/common/authStore", () => ({
  authStore: { subscribe: () => () => {}, getSnapshot: () => state },
}))
vi.mock("@/api/app/festival/festivalSettingsApi", () => ({
  uploadTicketingBackground: api.upload,
  getFestivalSettings: api.get,
  updateFestivalMetadata: api.metadata,
  updateFestivalTicketingSettings: api.ticketing,
  isRequestAborted: () => false,
}))
vi.mock("@/lib/app/festival/festivalCalendar", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/app/festival/festivalCalendar")>(),
  setFestivalDates: vi.fn(), setTicketingEnabled: vi.fn(), setTicketingBackgroundImageUrl: vi.fn(), setTicketCardBackgroundImageUrl: vi.fn(),
}))
vi.mock("sonner", () => ({ Toaster: () => null, toast }))

const settings = {
  schoolName: "단국대학교",
  festivalName: "축제",
  startDate: "2027-05-14",
  endDate: "2027-05-16",
  operationDates: ["2027-05-14", "2027-05-15", "2027-05-16"],
  ticketingEnabled: true,
  ticketingRounds: [
    { id: 1, ticketingAt: "2027-05-01T18:00:00", capacity: 10, performanceDate: "2027-05-15" },
  ],
}

let root: Root
let container: HTMLDivElement

const settle = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10))
  })
}

const findButton = (text: string) =>
  [...container.querySelectorAll<HTMLButtonElement>("button")].find((button) => button.textContent?.trim() === text)

const clickButton = async (text: string) => {
  const button = findButton(text)
  expect(button, `"${text}" 버튼을 찾을 수 있어야 합니다.`).toBeDefined()
  await act(async () => button?.click())
}

const setInputValue = async (input: HTMLInputElement, value: string) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value)
    input.dispatchEvent(new Event("input", { bubbles: true }))
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => "blob:background-preview")
    static revokeObjectURL = vi.fn()
  })
  api.upload.mockResolvedValue({url: "https://example.com/new-background.jpg", key: "background.jpg"})
  state.role = "manager"
  state.permissions = ["OPERATIONS"]
  api.get.mockResolvedValue(settings)
  api.metadata.mockImplementation(async (payload) => ({ ...settings, ...payload }))
  api.ticketing.mockImplementation(async (payload) => ({
    ...settings,
    ...payload,
    ticketingRounds: payload.ticketingRounds,
  }))
  container = document.createElement("div")
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

async function render() {
  await act(async () => root.render(<MemoryRouter><AdminSettings /></MemoryRouter>))
  await settle()
}

async function startEditing() {
  await clickButton("수정")
}

describe("AdminSettings unified save", () => {
  it.each([true, false])("toggles directly from saved %s, supports cancel, and only applies on save", async (initialValue) => {
    state.permissions = ["TICKETING"]
    api.get.mockResolvedValue({ ...settings, ticketingEnabled: initialValue })
    await render()
    const target = initialValue ? "OFF" : "ON"
    expect(findButton(target)?.disabled).toBe(false)
    await clickButton(target)
    expect(findButton(target)?.getAttribute("aria-pressed")).toBe("true")
    expect(findButton("저장")).toBeDefined()
    expect(api.ticketing).not.toHaveBeenCalled()
    await clickButton("취소")
    expect(findButton(initialValue ? "ON" : "OFF")?.getAttribute("aria-pressed")).toBe("true")
    expect(api.ticketing).not.toHaveBeenCalled()
    await clickButton(target)
    await clickButton("저장")
    await settle()
    expect(api.ticketing).toHaveBeenCalledWith(expect.objectContaining({ ticketingEnabled: !initialValue }))
    expect(api.metadata).not.toHaveBeenCalled()
  })

  it("uploads an issued-ticket background and previews the actual ticket card", async () => {
    state.permissions = ["TICKETING"]
    api.get.mockResolvedValue({ ...settings, ticketingBackgroundImageUrl: "https://example.com/off.png" })
    await render()
    expect(container.textContent).toContain("발급 티켓 배경")
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const file = new File(["image"], "card.jpg", { type: "image/jpeg" })
    await act(async () => {
      Object.defineProperty(input, "files", { value: [file], configurable: true })
      input.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(container.querySelector('image[href="blob:background-preview"]')).not.toBeNull()
    await clickButton("저장")
    await settle()
    expect(api.ticketing).toHaveBeenCalledWith(expect.objectContaining({
      ticketCardBackgroundImageUrl: "https://example.com/new-background.jpg",
      ticketingBackgroundImageUrl: "https://example.com/off.png",
    }))
  })

  it("changes the default background directly, previews the notice, and saves the uploaded URL", async () => {
    state.permissions = ["TICKETING"]
    api.get.mockResolvedValue({ ...settings, ticketingEnabled: false })
    await render()
    expect(findButton("배경 사진 변경")?.disabled).toBe(false)
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    expect(input.disabled).toBe(false)
    const file = new File(["image"], "new-background.jpg", { type: "image/jpeg" })
    await act(async () => {
      Object.defineProperty(input, "files", {value: [file], configurable: true})
      input.dispatchEvent(new Event("change", { bubbles: true }))
    })
    expect(container.querySelector('img[src="blob:background-preview"]')).not.toBeNull()
    expect(container.querySelector('img[alt="LEGEND"]')).not.toBeNull()
    expect(findButton("저장")).toBeDefined()
    await clickButton("저장")
    await settle()
    expect(api.upload).toHaveBeenCalledWith(file)
    expect(api.ticketing).toHaveBeenCalledWith(expect.objectContaining({ ticketingBackgroundImageUrl: "https://example.com/new-background.jpg" }))
    expect(container.querySelector('img[src="https://example.com/new-background.jpg"]')).not.toBeNull()
  })

  it("shows the OFF background editor only while ticketing is OFF", async () => {
    state.permissions = ["TICKETING"]
    await render()
    expect(container.textContent).not.toContain("티켓팅 OFF 안내 배경")
    await startEditing()
    await clickButton("OFF")
    expect(container.textContent).toContain("티켓팅 OFF 안내 배경")
    expect(container.querySelector('img[alt="LEGEND"]')).not.toBeNull()
    await clickButton("ON")
    expect(container.textContent).not.toContain("티켓팅 OFF 안내 배경")
  })

  it("restores the original OFF notice and saves a cleared custom background", async () => {
    state.permissions = ["TICKETING"]
    api.get.mockResolvedValue({ ...settings, ticketingEnabled: false, ticketingBackgroundImageUrl: "https://example.com/custom.png" })
    await render()
    await startEditing()
    await clickButton("기본 안내 화면 사용")
    expect(container.querySelector('img[src="https://example.com/custom.png"]')).toBeNull()
    expect(container.querySelector('img[alt="LEGEND"]')).not.toBeNull()
    await clickButton("저장")
    await settle()
    expect(api.ticketing).toHaveBeenCalledWith(expect.objectContaining({ ticketingBackgroundImageUrl: null, ticketingEnabled: false }))
  })

  it("edits a saved round in place and sends its original id", async () => {
    state.permissions = ["TICKETING"]
    await render()
    await startEditing()
    const capacity = container.querySelector<HTMLInputElement>('input[aria-label="1회차 티켓 수량"]')
    expect(capacity).not.toBeNull()
    await setInputValue(capacity!, "25")
    await clickButton("저장")
    await settle()
    expect(api.ticketing).toHaveBeenCalledWith(expect.objectContaining({
      ticketingRounds: [expect.objectContaining({id: 1, capacity: 25, performanceDate: "2027-05-15"})],
    }))
    expect(api.metadata).not.toHaveBeenCalled()
  })

  it("operations-only saves a changed festival name through only the metadata API", async () => {
    await render()
    expect([...container.querySelectorAll("h2")].map(heading => heading.textContent)).toEqual(["축제 기본 정보"])
    expect(findButton("ON")).toBeUndefined()
    expect(findButton("OFF")).toBeUndefined()
    await startEditing()
    expect(findButton("티켓팅 회차 추가")).toBeUndefined()
    expect(container.querySelector('[aria-label="1회차 삭제"]')).toBeNull()
    expect(container.textContent).not.toContain("티켓팅 5/1")
    await setInputValue(container.querySelector<HTMLInputElement>('input[type="text"]')!, "새 축제")

    await clickButton("저장")
    await settle()

    expect(api.metadata).toHaveBeenCalledWith({
      schoolName: "단국대학교",
      festivalName: "새 축제",
      startDate: "2027-05-14",
      endDate: "2027-05-16",
    })
    expect(api.ticketing).not.toHaveBeenCalled()
    expect(findButton("수정")).toBeDefined()
  })

  it("ticketing-only saves an OFF change through only the ticketing API", async () => {
    state.permissions = ["TICKETING"]
    await render()
    expect([...container.querySelectorAll("h2")].map(heading => heading.textContent)).toEqual(["티켓팅"])
    await startEditing()
    expect(container.querySelector('input[type="text"]')).toBeNull()
    expect(container.querySelector('input[type="date"]')).toBeNull()
    expect(container.textContent).not.toContain("운영 시작일")
    expect(container.textContent).not.toContain("운영 종료일")
    await clickButton("OFF")

    await clickButton("저장")
    await settle()

    expect(api.ticketing).toHaveBeenCalledWith({
      ticketingBackgroundImageUrl: null,
      ticketCardBackgroundImageUrl: null,
      ticketingEnabled: false,
      ticketingRounds: [],
      confirmedTicketCancelRoundIds: [],
    })
    expect(api.metadata).not.toHaveBeenCalled()
    expect(findButton("수정")).toBeDefined()
  })

  it("guides operations-only users to a ticket manager when changed dates conflict with hidden rounds", async () => {
    await render()
    await startEditing()
    const dates = container.querySelectorAll<HTMLInputElement>('input[type="date"]')
    await setInputValue(dates[0]!, "2027-05-16")
    await clickButton("저장")

    expect(api.metadata).not.toHaveBeenCalled()
    expect(api.ticketing).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("일부 티켓팅 공연 날짜가 운영 기간에서 제외됩니다. 운영 기간을 다시 확인하거나 티켓 매니저에게 문의해 주세요.")
    expect(findButton("티켓팅 회차 추가")).toBeUndefined()
  })

  it.each([
    { label: "both manager scopes", role: "manager", permissions: ["OPERATIONS", "TICKETING"] },
    { label: "an admin", role: "admin", permissions: [] },
  ])("saves changed metadata before changed ticketing settings for $label", async ({ role, permissions }) => {
    state.role = role
    state.permissions = permissions
    const metadataSaved = { ...settings, festivalName: "새 축제" }
    api.metadata.mockResolvedValue(metadataSaved)
    api.ticketing.mockResolvedValue({ ...metadataSaved, ticketingEnabled: false, ticketingRounds: [] })
    await render()
    await startEditing()
    await setInputValue(container.querySelector<HTMLInputElement>('input[type="text"]')!, "새 축제")
    await clickButton("OFF")

    await clickButton("저장")
    await settle()

    expect(api.metadata.mock.invocationCallOrder[0]).toBeLessThan(api.ticketing.mock.invocationCallOrder[0]!)
    expect(api.ticketing).toHaveBeenCalledWith({
      ticketingBackgroundImageUrl: null,
      ticketCardBackgroundImageUrl: null,
      ticketingEnabled: false,
      ticketingRounds: [],
      confirmedTicketCancelRoundIds: [],
    })
    expect(findButton("수정")).toBeDefined()
  })

  it("keeps both edits and does not call ticketing when metadata save fails", async () => {
    state.permissions = ["OPERATIONS", "TICKETING"]
    api.metadata.mockRejectedValueOnce(new Error("기본 정보 저장 실패"))
    await render()
    await startEditing()
    await setInputValue(container.querySelector<HTMLInputElement>('input[type="text"]')!, "새 축제")
    await clickButton("OFF")

    await clickButton("저장")
    await settle()

    expect(api.metadata).toHaveBeenCalledTimes(1)
    expect(api.ticketing).not.toHaveBeenCalled()
    expect(container.querySelector<HTMLInputElement>('input[type="text"]')?.value).toBe("새 축제")
    expect(findButton("저장")).toBeDefined()
  })

  it("does not call either API when no editable value changed", async () => {
    state.role = "admin"
    state.permissions = []
    await render()
    await startEditing()

    await clickButton("저장")
    await settle()

    expect(api.metadata).not.toHaveBeenCalled()
    expect(api.ticketing).not.toHaveBeenCalled()
    expect(toast.info).toHaveBeenCalledWith("변경된 내용이 없습니다.")
  })

  it("retains the ticketing draft after ticketing fails and retries only ticketing", async () => {
    state.permissions = ["OPERATIONS", "TICKETING"]
    const metadataSaved = { ...settings, festivalName: "새 축제" }
    api.metadata.mockResolvedValue(metadataSaved)
    api.ticketing
      .mockRejectedValueOnce(new Error("티켓팅 저장 실패"))
      .mockResolvedValueOnce({ ...metadataSaved, ticketingEnabled: false, ticketingRounds: [] })
    await render()
    await startEditing()
    await setInputValue(container.querySelector<HTMLInputElement>('input[type="text"]')!, "새 축제")
    await clickButton("OFF")

    await clickButton("저장")
    await settle()

    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("기본 정보는 저장했지만 티켓팅 설정은 저장하지 못했습니다."),
    )
    expect(container.querySelector<HTMLInputElement>('input[type="text"]')?.value).toBe("새 축제")
    expect(findButton("저장")).toBeDefined()
    expect(api.metadata).toHaveBeenCalledTimes(1)
    expect(api.ticketing).toHaveBeenCalledTimes(1)

    await clickButton("저장")
    await settle()

    expect(api.metadata).toHaveBeenCalledTimes(1)
    expect(api.ticketing).toHaveBeenCalledTimes(2)
    expect(findButton("수정")).toBeDefined()
  })

  it("does not save either scope when an enabled ticketing round falls outside the changed operating dates", async () => {
    state.permissions = ["OPERATIONS", "TICKETING"]
    await render()
    await startEditing()
    const dates = container.querySelectorAll<HTMLInputElement>('input[type="date"]')
    await setInputValue(dates[0]!, "2027-05-16")
    await setInputValue(dates[1]!, "2027-05-16")

    await clickButton("저장")
    await settle()

    expect(api.metadata).not.toHaveBeenCalled()
    expect(api.ticketing).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(
      "운영 날짜에 포함되지 않는 티켓팅 회차가 있습니다. 운영 날짜 또는 회차 날짜를 수정해 주세요.",
    )
  })

  it("blocks save while a ticketing round is still being written", async () => {
    state.permissions = ["OPERATIONS", "TICKETING"]
    await render()
    await startEditing()
    await clickButton("티켓팅 회차 추가")

    await clickButton("저장")
    await settle()

    expect(api.metadata).not.toHaveBeenCalled()
    expect(api.ticketing).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith("작성 중인 티켓팅 회차를 추가하거나 입력을 닫은 뒤 저장해 주세요.")
  })

  it("disables the form and actions while metadata is pending", async () => {
    state.permissions = ["OPERATIONS", "TICKETING"]
    let resolveMetadata: ((value: typeof settings) => void) | undefined
    api.metadata.mockImplementationOnce(
      () => new Promise<typeof settings>((resolve) => { resolveMetadata = resolve }),
    )
    await render()
    await startEditing()
    await setInputValue(container.querySelector<HTMLInputElement>('input[type="text"]')!, "새 축제")

    await clickButton("저장")
    await settle()

    expect(findButton("저장 중...")?.disabled).toBe(true)
    expect(findButton("취소")?.disabled).toBe(true)
    expect(container.querySelector<HTMLInputElement>('input[type="text"]')?.matches(":disabled")).toBe(true)
    await clickButton("저장 중...")
    expect(api.metadata).toHaveBeenCalledTimes(1)

    await act(async () => resolveMetadata?.({ ...settings, festivalName: "새 축제" }))
    await settle()
    expect(findButton("수정")).toBeDefined()
  })
})
