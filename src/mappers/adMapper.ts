import type { PlacementAdDto } from "@/types/dto/ad.dto";
import type { AdPlacementKey, PlacementAd } from "@/types/model/ad.model";

const DEFAULT_PLACEMENT: AdPlacementKey = "WAITING_ROOM_MAIN";

const toPlacementKey = (value?: string): AdPlacementKey => {
  return value === "WAITING_ROOM_MAIN" ? value : DEFAULT_PLACEMENT;
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
