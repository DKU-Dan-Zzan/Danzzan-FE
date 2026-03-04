export type AdPlacementKey = "WAITING_ROOM_MAIN";

export interface PlacementAd {
  placement: AdPlacementKey;
  imageUrl: string;
  linkUrl: string | null;
  altText: string;
  isActive: boolean;
  updatedAt: string;
}
