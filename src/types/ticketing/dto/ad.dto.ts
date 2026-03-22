// 역할: 티켓팅 도메인 타입 계약(DTO/Model)을 정의하는 모듈입니다.
export interface PlacementAdDto {
  placement?: string;
  imageUrl?: string;
  linkUrl?: string | null;
  altText?: string;
  isActive?: boolean;
  updatedAt?: string;
}
