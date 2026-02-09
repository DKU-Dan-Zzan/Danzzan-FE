export interface NoticeDto {
  id?: string | number;
  title?: string;
  content?: string;
  author?: string;
  createdAt?: string;
  isUrgent?: boolean;
  imageUrl?: string;
}

export interface LostFoundItemDto {
  id?: string | number;
  name?: string;
  description?: string;
  imageUrl?: string;
  foundLocation?: string;
  foundDate?: string;
  isClaimed?: boolean;
}

export interface NoticeListResponseDto {
  items?: NoticeDto[];
}

export interface LostFoundListResponseDto {
  items?: LostFoundItemDto[];
}
