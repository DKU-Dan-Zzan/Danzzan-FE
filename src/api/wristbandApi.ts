import { createHttpClient } from "@/api/httpClient";
import { wristbandMock } from "@/mocks/wristband.mock";
import {
  mapWristbandAttendeeDtoToModel,
  mapWristbandSessionDtoToModel,
  mapWristbandStatsDtoToModel,
} from "@/mappers/wristbandMapper";
import { authStore } from "@/store/authStore";
import type {
  WristbandAttendeeDto,
  WristbandSessionDto,
  WristbandStatsDto,
} from "@/types/dto/wristband.dto";
import type {
  WristbandAttendee,
  WristbandSession,
  WristbandStats,
} from "@/types/model/wristband.model";
import { env, requireEnv } from "@/utils/env";

const isMockMode = env.apiMode === "mock";

const getWristbandClient = () =>
  createHttpClient({
    baseUrl: requireEnv(
      env.ticketingApiBaseUrl,
      "VITE_TICKETING_API_BASE_URL",
    ),
    getAccessToken: authStore.getAccessToken,
  });

export const wristbandApi = {
  listSessions: async (): Promise<WristbandSession[]> => {
    if (isMockMode) {
      return wristbandMock.listSessions();
    }
    const client = getWristbandClient();
    // TODO: Confirm wristband session endpoint.
    const dto = await client.get<{ items?: WristbandSessionDto[] }>(
      "/wristband/sessions",
    );
    const items = dto?.items ?? [];
    return items.map((item) => mapWristbandSessionDtoToModel(item));
  },
  getStats: async (date: string): Promise<WristbandStats> => {
    if (isMockMode) {
      return wristbandMock.getStats(date);
    }
    const client = getWristbandClient();
    // TODO: Confirm wristband stats endpoint.
    const dto = await client.get<WristbandStatsDto>("/wristband/stats", {
      params: { date },
    });
    return mapWristbandStatsDtoToModel(dto);
  },
  findAttendee: async (
    keyword: string,
    date: string,
  ): Promise<WristbandAttendee | null> => {
    if (isMockMode) {
      return wristbandMock.findAttendee(keyword, date);
    }
    const client = getWristbandClient();
    // TODO: Confirm wristband attendee lookup endpoint + param name (studentId/ticketId).
    const dto = await client.get<WristbandAttendeeDto | null>(
      "/wristband/attendees/search",
      {
        params: { studentId: keyword, date },
      },
    );
    if (!dto) {
      return null;
    }
    return mapWristbandAttendeeDtoToModel(dto);
  },
  issueWristband: async (keyword: string, date: string): Promise<void> => {
    if (isMockMode) {
      wristbandMock.issueWristband(keyword, date);
      return;
    }
    const client = getWristbandClient();
    // TODO: Confirm wristband issuance endpoint + payload shape.
    await client.post<void>("/wristband/issue", { studentId: keyword, date });
  },
};
