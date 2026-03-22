// 역할: 티켓팅 관리자 팔찌 운영(조회·지급·통계) API를 제공합니다.
import { createHttpClient } from "@/api/ticketing/httpClient";
import { wristbandMock } from "@/mocks/ticketing/wristband.mock";
import {
  mapEventSummaryToSession,
  mapEventStatsToWristbandStats,
  mapTicketSearchItemToAttendee,
} from "@/lib/ticketing/mappers/wristbandMapper";
import { authStore } from "@/store/common/authStore";
import type {
  ApiResponse,
  EventListResponseDto,
  EventStatsResponseDto,
  TicketSearchResponseDto,
  IssueTicketResponseDto,
} from "@/types/ticketing/dto/wristband.dto";
import type {
  WristbandAttendee,
  WristbandSession,
  WristbandStats,
} from "@/types/ticketing/model/wristband.model";
import { env, requireEnv } from "@/utils/common/env";

const isMockMode = env.apiMode === "mock";
type RequestOptions = {
  signal?: AbortSignal;
};

const getClient = () =>
  createHttpClient({
    baseUrl: requireEnv(
      env.apiBaseUrl || env.ticketingApiBaseUrl,
      "VITE_API_BASE_URL (or VITE_API_URL)",
    ),
    getAccessToken: authStore.getAccessToken,
    refreshAccessToken: authStore.refreshAccessToken,
    clearSession: authStore.clear,
    refreshKey: "ticketing-auth",
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
  getStats: async (eventId: string, options?: RequestOptions): Promise<WristbandStats> => {
    if (isMockMode) {
      return wristbandMock.getStats(eventId);
    }
    const client = getClient();
    const raw = await client.get<ApiResponse<EventStatsResponseDto>>(
      `/api/admin/events/${eventId}/stats`,
      { signal: options?.signal },
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

  /** 팔찌 지급 취소 (mock 모드 우선 지원) */
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
