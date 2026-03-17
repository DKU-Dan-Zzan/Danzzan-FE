import { http } from "../lib/http";
import type { PageResponse } from "./admin";

export type NoticeDto = {
  id: number;
  title: string;
  content: string;
  author: string;
  category: string | null;
  isPinned: boolean;
  thumbnailImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoticeListParams = {
  keyword?: string;
  category?: string;
  page?: number;
  size?: number;
};

function buildQuery(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function getNotices(
  params: NoticeListParams,
): Promise<PageResponse<NoticeDto>> {
  const query = buildQuery({
    keyword: params.keyword,
    category: params.category,
    page: params.page ?? 0,
    size: params.size ?? 10,
  });

  const res = await http.get<PageResponse<NoticeDto>>(`/notices${query}`);
  return res.data;
}

export async function getNoticeDetail(id: number): Promise<NoticeDto> {
  const res = await http.get<NoticeDto>(`/notices/${id}`);
  return res.data;
}

export type PlacementKey = "HOME_BOTTOM" | "MY_TICKET";

export type ClientAdDto = {
  id: number;
  title: string;
  imageUrl: string;
  placement: PlacementKey;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getPlacementAd(placement: PlacementKey): Promise<ClientAdDto | null> {
  const res = await http.get<ClientAdDto>(`/api/ads`, {
    params: { placement },
  });

  if (res.status === 204 || !res.data) {
    return null;
  }

  return res.data;
}
