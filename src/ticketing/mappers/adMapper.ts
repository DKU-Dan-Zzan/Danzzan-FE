import type { PlacementAdDto } from "@/ticketing/types/dto/ad.dto";
import type { AdPlacementKey, PlacementAd } from "@/ticketing/types/model/ad.model";

const DEFAULT_PLACEMENT: AdPlacementKey = "WAITING_ROOM_MAIN";

const toPlacementKey = (value?: string): AdPlacementKey => {
  return value === "WAITING_ROOM_MAIN" ? value : DEFAULT_PLACEMENT;
};

export const mapPlacementAdDtoToModel = (dto: PlacementAdDto): PlacementAd => {
  return {
    placement: toPlacementKey(dto.placement),
    imageUrl: dto.imageUrl ?? "",
    linkUrl: dto.linkUrl ?? null,
    altText: dto.altText ?? "?⑥쭬 ?湲곗뿴 愿묎퀬",
    isActive: dto.isActive ?? false,
    updatedAt: dto.updatedAt ?? "",
  };
};
