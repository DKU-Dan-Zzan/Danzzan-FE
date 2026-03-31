// 역할: 화면/도메인 계층에서 사용하는 광고 모델 타입을 정의합니다.
export type AdPlacementKey = "WAITING_ROOM_MAIN" | "MY_TICKET";

export interface PlacementAd {
  placement: AdPlacementKey;
  imageUrl: string;
  linkUrl: string | null;
  altText: string;
  isActive: boolean;
  updatedAt: string;
}
