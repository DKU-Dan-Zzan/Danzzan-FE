// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminSettings from "@/routes/admin/AdminSettings";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const state = vi.hoisted(() => ({ role: "manager", permissions: ["OPERATIONS"] as string[] }));
const api = vi.hoisted(() => ({ get: vi.fn(), metadata: vi.fn(), ticketing: vi.fn() }));
vi.mock("@/store/common/authStore", () => ({ authStore: { subscribe: () => () => {}, getSnapshot: () => state } }));
vi.mock("@/api/app/festival/festivalSettingsApi", () => ({ getFestivalSettings: api.get, updateFestivalMetadata: api.metadata, updateFestivalTicketingSettings: api.ticketing, isRequestAborted: () => false }));
vi.mock("@/lib/app/festival/festivalCalendar", () => ({ setFestivalDates: vi.fn() }));
const settings = { schoolName: "단국대학교", festivalName: "축제", startDate: "2027-05-14", endDate: "2027-05-16", operationDates: ["2027-05-14", "2027-05-15", "2027-05-16"], ticketingEnabled: true, ticketingRounds: [{ id: 1, ticketingAt: "2027-05-01T18:00:00", capacity: 10, performanceDate: "2027-05-15" }] };
let root: Root; let container: HTMLDivElement;
const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); };
beforeEach(() => { vi.clearAllMocks(); state.role = "manager"; state.permissions = ["OPERATIONS"]; api.get.mockResolvedValue(settings); api.metadata.mockResolvedValue(settings); api.ticketing.mockResolvedValue(settings); container = document.createElement("div"); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function render() { await act(async () => { root.render(<AdminSettings />); }); await settle(); }
describe("AdminSettings permission split", () => {
  it("operations-only never calls ticketing API", async () => { await render(); await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent?.includes("수정"))!.click()); expect([...container.querySelectorAll("button")].some(button => button.textContent?.includes("티켓팅 저장"))).toBe(false); expect(api.ticketing).not.toHaveBeenCalled(); });
  it("ticketing-only never calls metadata API", async () => { state.permissions = ["TICKETING"]; await render(); await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent?.includes("수정"))!.click()); expect([...container.querySelectorAll("button")].some(button => button.textContent?.includes("기본 정보 저장"))).toBe(false); expect(api.metadata).not.toHaveBeenCalled(); });
  it("metadata save sends only metadata and keeps an unsaved ticketing draft", async () => {
    state.permissions = ["OPERATIONS", "TICKETING"]; await render();
    await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent?.includes("수정"))!.click());
    await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent === "OFF")!.click());
    await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent?.includes("기본 정보 저장"))!.click()); await settle();
    expect(api.metadata).toHaveBeenCalledWith({ schoolName: "단국대학교", festivalName: "축제", startDate: "2027-05-14", endDate: "2027-05-16" });
    expect(api.ticketing).not.toHaveBeenCalled(); expect(container.textContent).not.toContain("티켓팅 5/1");
  });
  it("ticketing save sends only ticketing payload and keeps an unsaved metadata draft", async () => {
    state.permissions = ["OPERATIONS", "TICKETING"]; await render();
    await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent?.includes("수정"))!.click());
    const festivalName = container.querySelector<HTMLInputElement>('input[type="text"]')!;
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(festivalName, "임시 축제명"); festivalName.dispatchEvent(new Event("input", { bubbles: true })); });
    await act(async () => [...container.querySelectorAll("button")].find(button => button.textContent?.includes("티켓팅 저장"))!.click()); await settle();
    expect(api.ticketing).toHaveBeenCalledWith(expect.objectContaining({ ticketingEnabled: true, ticketingRounds: [expect.objectContaining({ id: 1 })] }));
    expect(api.metadata).not.toHaveBeenCalled(); expect(festivalName.value).toBe("임시 축제명");
  });
});
