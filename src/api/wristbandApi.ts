import { createHttpClient } from "@/api/httpClient";
import { wristbandMock } from "@/mocks/wristband.mock";
import {
  mapEventSummaryToSession,
  mapEventStatsToWristbandStats,
  mapTicketSearchItemToAttendee,
} from "@/mappers/wristbandMapper";
import { authStore } from "@/store/authStore";
import type {
  ApiResponse,
  EventListResponseDto,
  EventStatsResponseDto,
  TicketSearchResponseDto,
  IssueTicketResponseDto,
} from "@/types/dto/wristband.dto";
import type {
  WristbandAttendee,
  WristbandSession,
  WristbandStats,
} from "@/types/model/wristband.model";
import { env, requireEnv } from "@/utils/env";

const isMockMode = env.apiMode === "mock";

const getClient = () =>
  createHttpClient({
    baseUrl: requireEnv(
      env.apiBaseUrl || env.ticketingApiBaseUrl,
      "VITE_API_URL",
    ),
    getAccessToken: authStore.getAccessToken,
  });

/** ApiResponse 래퍼에서 data를 추출 */
function unwrap<T>(response: ApiResponse<T> | T): T {
  if (response && typeof response === "object" && "success" in response) {
    const apiResp = response as ApiResponse<T>;
    if (!apiResp.success || apiResp.data == null) {
      const errorMsg = apiResp.error?.message ?? "요청에 실패했습니다.";
      throw new Error(errorMsg);
    }
    return apiResp.data;
  }
  return response as T;
}

export const wristbandApi = {
  /** 이벤트 목록 조회 (= 운영 세션 목록) */
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

  /** 이벤트 통계 조회 (eventId 기반) */
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

  /** 학번으로 티켓 검색 */
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

  /** 팔찌 지급 (eventId + ticketId) */
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
};
