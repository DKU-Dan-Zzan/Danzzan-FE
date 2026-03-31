// 역할: 티켓팅 대기실/내티켓 광고 슬롯 데이터를 조회하는 API 어댑터를 제공합니다.
import { adGateway } from "@/api/common/adGateway";
import { mapPlacementAdDtoToModel } from "@/lib/ticketing/mappers/adMapper";
import type { AdPlacementKey, PlacementAd } from "@/types/ticketing/model/ad.model";
import { env } from "@/utils/common/env";

const mockWaitingRoomAd: PlacementAd = {
  placement: "WAITING_ROOM_MAIN",
  imageUrl: "/ads/waiting-room-sample-banner.svg",
  linkUrl: "https://danzzan.example.com/notice",
  altText: "단짠 축제 공지 배너",
  isActive: true,
  updatedAt: "2026-03-04T00:00:00Z",
};

const mockMyTicketAd: PlacementAd = {
  placement: "MY_TICKET",
  imageUrl: "/ads/waiting-room-sample-banner.svg",
  linkUrl: "https://danzzan.example.com/notice",
  altText: "단짠 내 티켓 광고 배너",
  isActive: true,
  updatedAt: "2026-03-04T00:00:00Z",
};

export const adApi = {
  getPlacementAd: async (
    placement: AdPlacementKey,
    signal?: AbortSignal,
  ): Promise<PlacementAd | null> => {
    if (env.apiMode === "mock") {
      return placement === "MY_TICKET" ? mockMyTicketAd : mockWaitingRoomAd;
    }

    const ad = await adGateway.getPlacementAd(placement, {
      signal,
      prefer: "ticketing",
    });
    if (!ad) {
      return null;
    }

    const mapped = mapPlacementAdDtoToModel({
      placement: ad.placement,
      imageUrl: ad.imageUrl,
      linkUrl: ad.linkUrl,
      altText: ad.altText ?? ad.title ?? "단짠 대기열 광고",
      isActive: ad.isActive,
      updatedAt: ad.updatedAt ?? undefined,
    });

    if (!mapped.isActive || !mapped.imageUrl) {
      return null;
    }

    return mapped;
  },
};
