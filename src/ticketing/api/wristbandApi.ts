import { createHttpClient } from "@/ticketing/api/httpClient";
import { wristbandMock } from "@/ticketing/mocks/wristband.mock";
import {
  mapEventSummaryToSession,
  mapEventStatsToWristbandStats,
  mapTicketSearchItemToAttendee,
} from "@/ticketing/mappers/wristbandMapper";
import { authStore } from "@/ticketing/store/authStore";
import type {
  ApiResponse,
  EventListResponseDto,
  EventStatsResponseDto,
  TicketSearchResponseDto,
  IssueTicketResponseDto,
} from "@/ticketing/types/dto/wristband.dto";
import type {
  WristbandAttendee,
  WristbandSession,
  WristbandStats,
} from "@/ticketing/types/model/wristband.model";
import { env, requireEnv } from "@/ticketing/utils/env";

const isMockMode = env.apiMode === "mock";

const getClient = () =>
  createHttpClient({
    baseUrl: requireEnv(
      env.apiBaseUrl || env.ticketingApiBaseUrl,
      "VITE_API_BASE_URL (or VITE_API_URL)",
    ),
    getAccessToken: authStore.getAccessToken,
  });

/** ApiResponse ?섑띁?먯꽌 data瑜?異붿텧 */
function unwrap<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === "object" && "success" in response) {
    const apiResp = response as ApiResponse<T>;
    if (!apiResp.success || apiResp.data == null) {
      const errorMsg = apiResp.error?.message ?? "?붿껌???ㅽ뙣?덉뒿?덈떎.";
      throw new Error(errorMsg);
    }
    return apiResp.data;
  }
  return response as T;
}

export const wristbandApi = {
  /** ?대깽??紐⑸줉 議고쉶 (= ?댁쁺 ?몄뀡 紐⑸줉) */
  listSessions: async (): Promise<WristbandSession[]> => {
    if (isMockMode) {
      return wristbandMock.listSessions();
    }
    const client = getClient();
    const raw = await client.get<ApiResponse<EventListResponseDto>>(
      "/api/admin/events",
    );
    const data = unwrap(raw);
    return (data.events ?? []).map(mapEventSummaryToSession);
  },

  /** ?대깽???듦퀎 議고쉶 (eventId 湲곕컲) */
  getStats: async (eventId: string): Promise<WristbandStats> => {
    if (isMockMode) {
      return wristbandMock.getStats(eventId);
    }
    const client = getClient();
    const raw = await client.get<ApiResponse<EventStatsResponseDto>>(
      `/api/admin/events/${eventId}/stats`,
    );
    const data = unwrap(raw);
    return mapEventStatsToWristbandStats(data);
  },

  /** ?숇쾲?쇰줈 ?곗폆 寃??*/
  findAttendee: async (
    studentId: string,
    eventId: string,
  ): Promise<WristbandAttendee | null> => {
    if (isMockMode) {
      return wristbandMock.findAttendee(studentId, eventId);
    }
    const client = getClient();
    const raw = await client.get<ApiResponse<TicketSearchResponseDto>>(
      `/api/admin/events/${eventId}/tickets/search`,
      { params: { studentId } },
    );
    const data = unwrap(raw);
    const results = data.results ?? [];
    if (results.length === 0) {
      return null;
    }
    return mapTicketSearchItemToAttendee(results[0]);
  },

  /** ?붿컡 吏湲?(eventId + ticketId) */
  issueWristband: async (eventId: string, ticketId: number): Promise<void> => {
    if (isMockMode) {
      wristbandMock.issueWristband(String(ticketId), eventId);
      return;
    }
    const client = getClient();
    await client.patch<ApiResponse<IssueTicketResponseDto>>(
      `/api/admin/events/${eventId}/tickets/${ticketId}/issue`,
    );
  },

  /** ?붿컡 吏湲?痍⑥냼 (mock 紐⑤뱶 ?곗꽑 吏?? */
  cancelWristband: async (eventId: string, ticketId: number): Promise<void> => {
    if (isMockMode) {
      wristbandMock.cancelWristband(String(ticketId), eventId);
      return;
    }

    const client = getClient();
    await client.patch<ApiResponse<IssueTicketResponseDto>>(
      `/api/admin/events/${eventId}/tickets/${ticketId}/cancel`,
    );
  },
};
