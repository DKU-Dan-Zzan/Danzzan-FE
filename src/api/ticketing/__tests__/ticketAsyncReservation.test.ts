// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ticketApi } from "@/api/ticketing/ticketApi";
const client = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock("@/api/ticketing/httpClient", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/api/ticketing/httpClient")>(),
  createHttpClient: () => client,
}));
vi.mock("@/utils/common/env", () => ({ env: { apiMode: "real", ticketingApiBaseUrl: "/api" }, requireEnv: (value: string) => value }));
beforeEach(() => { vi.resetAllMocks(); vi.useFakeTimers(); });
afterEach(() => vi.useRealTimers());

it("202 PROCESSING에서는 성공하지 않고 발급 상태 SUCCESS까지 기다린다", async () => {
  client.post.mockResolvedValue({ status: "PROCESSING", requestId: "request-9" });
  client.get.mockResolvedValueOnce({ status: "PROCESSING" }).mockResolvedValueOnce({ status: "SUCCESS" });
  let completed = false;
  const result = ticketApi.reserveTicket("9").then(value => { completed = true; return value; });
  const assertion = expect(result).resolves.toMatchObject({ status: "SUCCESS" });
  await vi.advanceTimersByTimeAsync(0);
  expect(completed).toBe(false);
  await vi.runAllTimersAsync();
  await assertion;
  expect(client.get).toHaveBeenCalledWith("/tickets/9/requests/request-9", { signal: undefined });
  expect(client.post).toHaveBeenCalledTimes(1);
});
it("비동기 발급 실패를 성공으로 표시하지 않는다", async () => {
  client.post.mockResolvedValue({ status: "PROCESSING", requestId: "request-9" });
  client.get.mockResolvedValue({ status: "FAILED", errorCode: "RESERVE_PROCESSING_FAILED" });
  await expect(ticketApi.reserveTicket("9")).rejects.toMatchObject({ payload: { code: "RESERVE_PROCESSING_FAILED" } });
});
it("이미 접수된 요청으로 재진입하면 재예매 없이 완료를 확인한다", async () => {
  client.post.mockResolvedValue({ status: "PROCESSING", requestId: "request-9" });
  client.get.mockResolvedValue({ status: "SUCCESS" });
  await expect(ticketApi.enterTicketQueue("9")).resolves.toMatchObject({ status: "SUCCESS" });
  expect(client.post).toHaveBeenCalledTimes(1);
});
it("처리가 길어지면 실패나 성공으로 단정하지 않고 확인 중 상태를 돌려준다", async () => {
  client.post.mockResolvedValue({ status: "PROCESSING", requestId: "request-9" });
  client.get.mockResolvedValue({ status: "PROCESSING" });
  const assertion = expect(ticketApi.reserveTicket("9")).rejects.toMatchObject({ payload: { code: "RESERVE_PROCESSING_PENDING" } });
  await vi.runAllTimersAsync();
  await assertion;
});
it("동기 예매 응답도 계속 지원한다", async () => {
  client.post.mockResolvedValue({ ticket: { id: "123", status: "issued", eventName: "공연" }, queueNumber: 3 });
  await expect(ticketApi.reserveTicket("9")).resolves.toMatchObject({ ticket: { id: "123" }, queueNumber: 3 });
  expect(client.get).not.toHaveBeenCalled();
});
