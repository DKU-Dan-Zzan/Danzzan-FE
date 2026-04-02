// 역할: 티켓팅 대기실/내티켓 광고 슬롯 데이터를 조회하는 API 어댑터를 제공합니다.
import { adGateway } from "@/api/common/adGateway";
import { getPlacementAds as getPlacementAdsFromApp, type ClientAdDto } from "@/api/app/ad/adApi";
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

const mapClientAdDtoToPlacementAd = (
  placement: AdPlacementKey,
  ad: ClientAdDto,
): PlacementAd => ({
  placement,
  imageUrl: ad.imageUrl,
  linkUrl: null,
  altText: ad.title ?? "단짠 내 티켓 광고 배너",
  isActive: ad.isActive,
  updatedAt: ad.updatedAt,
});

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
      prefer: placement === "MY_TICKET" ? "web" : "ticketing",
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

  getPlacementAds: async (
    placement: Extract<AdPlacementKey, "MY_TICKET">,
    signal?: AbortSignal,
  ): Promise<PlacementAd[]> => {
    if (env.apiMode === "mock") {
      return [mockMyTicketAd];
    }

    const apiPlacement = placement === "MY_TICKET" ? "HOME_BOTTOM" : placement;
    const ads = await getPlacementAdsFromApp(apiPlacement, { signal });
    return ads
      .map((ad) => mapClientAdDtoToPlacementAd(placement, ad))
      .filter((item): item is PlacementAd => item.isActive && Boolean(item.imageUrl));
  },
};
