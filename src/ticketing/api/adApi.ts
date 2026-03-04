import { createHttpClient } from "@/ticketing/api/httpClient";
import { mapPlacementAdDtoToModel } from "@/ticketing/mappers/adMapper";
import { authStore } from "@/ticketing/store/authStore";
import type { PlacementAdDto } from "@/ticketing/types/dto/ad.dto";
import type { AdPlacementKey, PlacementAd } from "@/ticketing/types/model/ad.model";
import { env, requireEnv } from "@/ticketing/utils/env";

const getAdClient = () =>
  createHttpClient({
    baseUrl: requireEnv(
      env.ticketingApiBaseUrl,
      "VITE_TICKETING_API_BASE_URL (or VITE_API_BASE_URL)",
    ),
    getAccessToken: authStore.getAccessToken,
  });

type ApiEnvelope<T> = {
  data?: T | null;
} & Record<string, unknown>;

const unwrapApiData = <T>(
  payload: T | ApiEnvelope<T> | null | undefined,
): T | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const maybeData = record.data;
  if (maybeData && typeof maybeData === "object") {
    return maybeData as T;
  }

  return payload as T;
};

const mockWaitingRoomAd: PlacementAd = {
  placement: "WAITING_ROOM_MAIN",
  imageUrl: "/ads/waiting-room-sample-banner.svg",
  linkUrl: "https://danzzan.example.com/notice",
  altText: "?⑥쭬 異뺤젣 怨듭? 諛곕꼫",
  isActive: true,
  updatedAt: "2026-03-04T00:00:00Z",
};

export const adApi = {
  getPlacementAd: async (
    placement: AdPlacementKey,
    signal?: AbortSignal,
  ): Promise<PlacementAd | null> => {
    if (env.apiMode === "mock") {
      return placement === "WAITING_ROOM_MAIN" ? mockWaitingRoomAd : null;
    }

    const client = getAdClient();
    const dto = await client.get<PlacementAdDto | ApiEnvelope<PlacementAdDto> | null>(
      `/ads/placements/${placement}`,
      { signal },
    );

    const normalized = unwrapApiData(dto);
    if (!normalized) {
      return null;
    }

    const mapped = mapPlacementAdDtoToModel(normalized);
    if (!mapped.isActive || !mapped.imageUrl) {
      return null;
    }

    return mapped;
  },
};
