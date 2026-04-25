// 역할: 티켓팅 대기실/내티켓 광고 슬롯 데이터를 조회하는 API 어댑터를 제공합니다.
import { adGateway } from "@/api/common/adGateway";
import { getPlacementAds as getAppPlacementAds } from "@/api/app/ad/adApi";
import { mapPlacementAdDtoToModel } from "@/lib/ticketing/mappers/adMapper";
import type { AdPlacementKey, PlacementAd } from "@/types/ticketing/model/ad.model";
import type { AdSlide } from "@/components/common/AdCarousel";
import { env } from "@/utils/common/env";

const mockWaitingRoomAd: PlacementAd = {
  placement: "WAITING_ROOM_MAIN",
  imageUrl: "/ads/waiting-room-sample-banner.svg",
  linkUrl: "https://danzzan.example.com/notice",
  altText: "단짠 축제 공지 배너",
  isActive: true,
  updatedAt: "2026-03-04T00:00:00Z",
};

export const adApi = {
  getPlacementAd: async (
    placement: AdPlacementKey,
    signal?: AbortSignal,
  ): Promise<PlacementAd | null> => {
    if (env.apiMode === "mock") {
      return mockWaitingRoomAd;
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

  getMyTicketAds: async (signal?: AbortSignal): Promise<AdSlide[]> => {
    const ads = await getAppPlacementAds("MY_TICKET", { signal });
    return ads.map((ad) => ({
      imageUrl: ad.imageUrl,
      alt: ad.title,
      updatedAt: ad.updatedAt,
    }));
  },
};
