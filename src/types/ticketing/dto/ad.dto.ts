// 역할: 티켓팅 광고 API 송수신 DTO 타입을 정의합니다.
export interface PlacementAdDto {
  placement?: string;
  imageUrl?: string;
  linkUrl?: string | null;
  altText?: string;
  isActive?: boolean;
  updatedAt?: string;
}
