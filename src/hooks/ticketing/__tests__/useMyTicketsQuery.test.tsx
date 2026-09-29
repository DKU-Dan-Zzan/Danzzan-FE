// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMyTicketsQuery } from "@/hooks/ticketing/useMyTicketsQuery";
import { authStore } from "@/store/common/authStore";
import type { AuthSession } from "@/types/common/auth.model";
import type { Ticket } from "@/types/ticketing/model/ticket.model";

const getMyTickets = vi.hoisted(() => vi.fn());
vi.mock("@/api/ticketing/ticketApi", () => ({ ticketApi: { getMyTickets } }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const session = (id: string): AuthSession => ({
  tokens: { accessToken: `header.${btoa(JSON.stringify({ sub: id, role: "ROLE_USER", exp: 9999999999 }))}.signature`, refreshToken: "refresh", expiresIn: null },
  user: null,
});
const tickets = (id: string): Ticket[] => [{ id, status: "issued", eventName: id, eventDate: "2026-09-29", issuedAt: "2026-09-28", seat: "1", qrCodeUrl: "" }];
const deferred = () => {
  let resolve!: (value: Ticket[]) => void;
  const promise = new Promise<Ticket[]>(done => { resolve = done; });
  return { promise, resolve };
};
function Harness() {
  const query = useMyTicketsQuery();
  return <div>{query.data?.map(ticket => ticket.id).join(",") ?? "empty"}</div>;
}
let root: Root;
let container: HTMLDivElement;
let client: QueryClient;
const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); }); };
const render = async () => {
  await act(async () => { root.render(<QueryClientProvider client={client}><Harness /></QueryClientProvider>); });
  await settle();
};
beforeEach(() => {
  localStorage.clear();
  authStore.clear();
  authStore.setSession(session("A"));
  getMyTickets.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  container.remove();
  authStore.clear();
});

describe("내 티켓 세션별 캐시", () => {
  it.each(["account-switch", "logout", "storage"])("fresh 캐시도 %s 이후 새 세션에 표시하지 않는다", async boundary => {
    getMyTickets.mockResolvedValueOnce(tickets("A-ticket"));
    await render();
    expect(container.textContent).toBe("A-ticket");
    const next = deferred();
    getMyTickets.mockReturnValueOnce(next.promise);
    await act(async () => {
      if (boundary === "storage") {
        localStorage.setItem("danzzan.auth", JSON.stringify(session("B")));
        window.dispatchEvent(new StorageEvent("storage", { key: "danzzan.auth" }));
      } else if (boundary === "logout") authStore.clear();
      else authStore.setSession(session("B"));
    });
    expect(container.textContent).toBe("empty");
    if (boundary === "logout") {
      expect(getMyTickets).toHaveBeenCalledTimes(1);
      await act(async () => authStore.setSession(session("B")));
    }
    expect(getMyTickets).toHaveBeenCalledTimes(2);
    await act(async () => next.resolve(tickets("B-ticket")));
    await settle();
    expect(container.textContent).toBe("B-ticket");
  });

  it("이전 세션의 진행 중 요청이 늦게 끝나도 새 티켓을 덮지 않는다", async () => {
    const old = deferred();
    getMyTickets.mockReturnValueOnce(old.promise).mockResolvedValueOnce(tickets("B-ticket"));
    await render();
    const oldSignal = getMyTickets.mock.calls[0][0].signal as AbortSignal;
    await act(async () => authStore.setSession(session("B")));
    await settle();
    expect(container.textContent).toBe("B-ticket");
    expect(oldSignal.aborted).toBe(true);
    await act(async () => old.resolve(tickets("A-ticket")));
    await settle();
    expect(container.textContent).toBe("B-ticket");
  });

  it("같은 세션의 토큰 갱신은 fresh 티켓 캐시를 유지한다", async () => {
    getMyTickets.mockResolvedValue(tickets("A-ticket"));
    await render();
    await act(async () => authStore.setAccessToken(session("A").tokens.accessToken));
    await settle();
    expect(container.textContent).toBe("A-ticket");
    expect(getMyTickets).toHaveBeenCalledTimes(1);
  });
});
