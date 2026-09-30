// 역할: 접수된 비동기 예매 요청을 재전송하지 않고 최종 발급 결과를 확인합니다.
import { HttpError, type createHttpClient } from "@/api/ticketing/httpClient";
import { TicketContractError, unwrapApiObjectEnvelope } from "@/api/ticketing/ticketContract";

type IssueStatus = { status: "PROCESSING" | "SUCCESS" | "FAILED"; errorCode?: string };
const pendingError = () => new HttpError("발급 결과를 확인 중입니다.", 202, { code: "RESERVE_PROCESSING_PENDING" });

const waitForPoll = (signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const abort = () => {
    clearTimeout(timer);
    reject(new DOMException("요청이 취소되었습니다.", "AbortError"));
  };
  const timer = setTimeout(() => {
    signal?.removeEventListener("abort", abort);
    resolve();
  }, 1000);
  if (signal?.aborted) abort();
  else signal?.addEventListener("abort", abort, { once: true });
});

export const waitForTicketIssue = async (
  client: Pick<ReturnType<typeof createHttpClient>, "get">,
  eventId: string,
  requestId?: string,
  signal?: AbortSignal,
): Promise<{ status: "SUCCESS" }> => {
  if (!requestId?.trim()) throw pendingError();
  const endpoint = `/tickets/${eventId}/requests/${encodeURIComponent(requestId)}`;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    signal?.throwIfAborted();
    let raw: IssueStatus;
    try {
      raw = await client.get<IssueStatus>(endpoint, { signal });
    } catch (error) {
      if (signal?.aborted || (error instanceof HttpError && [401, 403].includes(error.status))) throw error;
      // 접수 이후 통신 오류만으로 발급 실패로 판단하거나 재예매하지 않는다.
      throw pendingError();
    }
    const result = unwrapApiObjectEnvelope<IssueStatus>(raw, endpoint);
    if (result.status === "SUCCESS") return { status: "SUCCESS" };
    if (result.status === "FAILED") {
      throw new HttpError("티켓 발급에 실패했습니다.", 409, { code: result.errorCode || "RESERVE_PROCESSING_FAILED" });
    }
    if (result.status !== "PROCESSING") throw new TicketContractError(endpoint, "발급 상태가 유효하지 않습니다.");
    if (attempt < 29) await waitForPoll(signal);
  }
  throw pendingError();
};
