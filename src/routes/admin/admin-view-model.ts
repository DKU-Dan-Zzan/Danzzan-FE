import type { AdvertisementPlacement } from "@/api/app/admin/adminApi";

export type NoticeAuthor = "개발팀" | "총학생회";

export type NoticeFormState = {
  id?: number;
  title: string;
  content: string;
  author: NoticeAuthor;
  isPinned: boolean;
  thumbnailImageUrl: string;
  images: string[];
};

export type AdFormState = {
  id?: number;
  title: string;
  imageUrl: string;
  placement: AdvertisementPlacement;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}.${month}.${day}`;
};
