// 역할: 광고 API DTO를 화면에서 사용하는 광고 도메인 모델로 변환합니다.
import type { PlacementAdDto } from "@/types/ticketing/dto/ad.dto";
import type { AdPlacementKey, PlacementAd } from "@/types/ticketing/model/ad.model";

const DEFAULT_PLACEMENT: AdPlacementKey = "WAITING_ROOM_MAIN";

const toPlacementKey = (value?: string): AdPlacementKey => {
  return value === "WAITING_ROOM_MAIN" || value === "MY_TICKET"
    ? value
    : DEFAULT_PLACEMENT;
};

export const mapPlacementAdDtoToModel = (dto: PlacementAdDto): PlacementAd => {
  return {
    placement: toPlacementKey(dto.placement),
    imageUrl: dto.imageUrl ?? "",
    linkUrl: dto.linkUrl ?? null,
    altText: dto.altText ?? "단짠 대기열 광고",
    isActive: dto.isActive ?? false,
    updatedAt: dto.updatedAt ?? "",
  };
};
