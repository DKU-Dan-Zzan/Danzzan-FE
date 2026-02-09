import type {
  LostFoundItemDto,
  LostFoundListResponseDto,
  NoticeDto,
  NoticeListResponseDto,
} from "@/types/dto/board.dto";
import type { LostFoundItem, Notice } from "@/types/model/board.model";

export const mapNoticeDtoToModel = (dto: NoticeDto): Notice => {
  return {
    id: dto.id?.toString() ?? "",
    title: dto.title ?? "",
    content: dto.content ?? "",
    author: dto.author ?? "",
    createdAt: dto.createdAt ?? "",
    isUrgent: dto.isUrgent ?? false,
    imageUrl: dto.imageUrl ?? "",
  };
};

export const mapNoticeListDtoToModel = (
  dto: NoticeListResponseDto,
): Notice[] => {
  const items = dto.items ?? [];
  return items.map((item) => mapNoticeDtoToModel(item));
};

export const mapLostFoundItemDtoToModel = (
  dto: LostFoundItemDto,
): LostFoundItem => {
  return {
    id: dto.id?.toString() ?? "",
    name: dto.name ?? "",
    description: dto.description ?? "",
    imageUrl: dto.imageUrl ?? "",
    foundLocation: dto.foundLocation ?? "",
    foundDate: dto.foundDate ?? "",
    isClaimed: dto.isClaimed ?? false,
  };
};

export const mapLostFoundListDtoToModel = (
  dto: LostFoundListResponseDto,
): LostFoundItem[] => {
  const items = dto.items ?? [];
  return items.map((item) => mapLostFoundItemDtoToModel(item));
};
