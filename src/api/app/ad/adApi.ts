// 역할: 광고 관련 HTTP 요청 함수를 제공하는 API 어댑터다.

import { http } from "@/lib/http";
import { adGateway } from "@/api/common/adGateway";

type RequestOptions = {
  signal?: AbortSignal;
};

export type PlacementKey = "HOME_BOTTOM" | "MY_TICKET";

export type ClientAdDto = {
  id: number;
  title: string;
  imageUrl: string;
  objectPosition?: string;
  placement: PlacementKey;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getPlacementAd(
  placement: PlacementKey,
  options?: RequestOptions,
): Promise<ClientAdDto | null> {
  const ad = await adGateway.getPlacementAd(placement, {
    prefer: "web",
    signal: options?.signal,
  });
  if (!ad) {
    return null;
  }

  return {
    id: ad.id ?? 0,
    title: ad.title ?? ad.altText ?? "광고 배너",
    imageUrl: ad.imageUrl,
    placement,
    isActive: ad.isActive,
    createdAt: ad.createdAt ?? "",
    updatedAt: ad.updatedAt ?? "",
  };
}

const parseAdList = (data: unknown): ClientAdDto[] => {
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[])
    .map((item) => ({
      id: Number(item.id ?? 0),
      title: String(item.title ?? "광고 배너"),
      imageUrl: String(item.imageUrl ?? ""),
      objectPosition: item.objectPosition ? String(item.objectPosition) : undefined,
      placement: (item.placement as PlacementKey) ?? "HOME_BOTTOM",
      isActive: Boolean(item.isActive ?? true),
      createdAt: String(item.createdAt ?? ""),
      updatedAt: String(item.updatedAt ?? ""),
    }))
    .filter((ad) => Boolean(ad.imageUrl));
};

/**
 * 활성화된 모든 광고를 배열로 반환합니다.
 */
export async function getAllActiveAds(options?: RequestOptions): Promise<ClientAdDto[]> {
  const res = await http.get<unknown>("/api/ads/list", {
    signal: options?.signal,
  });
  return parseAdList(res.data);
}

/**
 * placement별 활성화된 광고 목록을 반환합니다 (홈/내티켓 캐러셀용).
 */
export async function getPlacementAds(
  placement: PlacementKey,
  options?: RequestOptions,
): Promise<ClientAdDto[]> {
  const res = await http.get<unknown>("/api/ads/list", {
    params: { placement },
    signal: options?.signal,
  });
  return parseAdList(res.data);
}
