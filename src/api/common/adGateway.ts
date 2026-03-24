// 역할: ad gateway 모듈의 API/계약 기능을 제공한다.

import axios from "axios";
import { getApiBaseUrl, getTicketingApiBaseUrl } from "@/api/common/baseUrl";
import { getErrorStatus } from "@/api/common/fetchAuth";
import { createHttpClient, HttpError } from "@/api/common/httpClient";
import { http } from "@/lib/http";
import { authStore } from "@/store/common/authStore";

export type AdGatewayPlacement = "HOME_BOTTOM" | "MY_TICKET" | "WAITING_ROOM_MAIN";

export type UnifiedPlacementAd = {
  id: number | null;
  title: string | null;
  imageUrl: string;
  placement: AdGatewayPlacement;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  linkUrl: string | null;
  altText: string | null;
};

type Source = "web" | "ticketing";

type GetPlacementAdOptions = {
  signal?: AbortSignal;
  prefer?: Source;
};

const FALLBACK_STATUSES = new Set([404, 405]);

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
};

const toStringOrNull = (value: unknown): string | null => {
  return typeof value === "string" && value.trim() ? value : null;
};

const toNumberOrNull = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const unwrapEnvelope = (payload: unknown): Record<string, unknown> | null => {
  const record = asRecord(payload);
  if (!record) {
    return null;
  }
  const data = asRecord(record.data);
  return data ?? record;
};

const normalizePlacement = (
  value: string | null,
  fallback: AdGatewayPlacement,
): AdGatewayPlacement => {
  if (
    value === "HOME_BOTTOM" ||
    value === "MY_TICKET" ||
    value === "WAITING_ROOM_MAIN"
  ) {
    return value;
  }
  return fallback;
};

const normalizeAdPayload = (
  payload: unknown,
  fallbackPlacement: AdGatewayPlacement,
  source: Source,
): UnifiedPlacementAd | null => {
  const record = unwrapEnvelope(payload);
  if (!record) {
    return null;
  }

  const imageUrl = toStringOrNull(record.imageUrl);
  if (!imageUrl) {
    return null;
  }

  const isActiveRaw = record.isActive;
  const isActive =
    typeof isActiveRaw === "boolean"
      ? isActiveRaw
      : source === "web";

  return {
    id: toNumberOrNull(record.id),
    title: toStringOrNull(record.title),
    imageUrl,
    placement: normalizePlacement(toStringOrNull(record.placement), fallbackPlacement),
    isActive,
    createdAt: toStringOrNull(record.createdAt),
    updatedAt: toStringOrNull(record.updatedAt),
    linkUrl: toStringOrNull(record.linkUrl),
    altText: toStringOrNull(record.altText),
  };
};

const getTicketingClient = () =>
  createHttpClient({
    baseUrl: getTicketingApiBaseUrl() || getApiBaseUrl(),
    getAccessToken: authStore.getAccessToken,
    refreshAccessToken: authStore.refreshAccessToken,
    clearSession: authStore.clear,
    refreshKey: "ticketing-auth",
  });

const requestWebAd = async (
  placement: AdGatewayPlacement,
  signal?: AbortSignal,
): Promise<UnifiedPlacementAd | null> => {
  const res = await http.get<unknown>("/api/ads", {
    params: { placement },
    signal,
  });

  if (res.status === 204 || res.data == null) {
    return null;
  }

  return normalizeAdPayload(res.data, placement, "web");
};

const requestTicketingAd = async (
  placement: AdGatewayPlacement,
  signal?: AbortSignal,
): Promise<UnifiedPlacementAd | null> => {
  const client = getTicketingClient();
  const payload = await client.get<unknown>(`/ads/placements/${placement}`, { signal });
  return normalizeAdPayload(payload, placement, "ticketing");
};

const getErrorHttpStatus = (error: unknown): number | null => {
  if (error instanceof HttpError) {
    return error.status;
  }
  if (axios.isAxiosError(error)) {
    return error.response?.status ?? null;
  }
  return getErrorStatus(error);
};

const isCompatibilityFallbackError = (error: unknown): boolean => {
  const status = getErrorHttpStatus(error);
  return status !== null && FALLBACK_STATUSES.has(status);
};

const resolvePreferredSource = (placement: AdGatewayPlacement): Source => {
  return placement === "WAITING_ROOM_MAIN" ? "ticketing" : "web";
};

const requestBySource = (
  source: Source,
  placement: AdGatewayPlacement,
  signal?: AbortSignal,
) => {
  if (source === "web") {
    return requestWebAd(placement, signal);
  }
  return requestTicketingAd(placement, signal);
};

export const adGateway = {
  getPlacementAd: async (
    placement: AdGatewayPlacement,
    options: GetPlacementAdOptions = {},
  ): Promise<UnifiedPlacementAd | null> => {
    const firstSource = options.prefer ?? resolvePreferredSource(placement);
    const secondSource: Source = firstSource === "web" ? "ticketing" : "web";

    try {
      const first = await requestBySource(firstSource, placement, options.signal);
      if (first) {
        return first;
      }
    } catch (error) {
      if (!isCompatibilityFallbackError(error)) {
        throw error;
      }
    }

    try {
      return await requestBySource(secondSource, placement, options.signal);
    } catch (error) {
      if (isCompatibilityFallbackError(error)) {
        return null;
      }
      throw error;
    }
  },
};
