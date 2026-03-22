import { http } from "@/lib/http";
import { adGateway } from "@/api/common/adGateway";
import { parseNoticeDetailContract, parseNoticeListContract } from "@/api/app/notice/noticeContract";

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
};

export type NoticeDto = {
  id: number;
  title: string;
  content: string;
  author: string;
  category: string | null;
  isPinned: boolean;
  thumbnailImageUrl?: string | null;
  imageUrls?: string[] | null;
  createdAt: string;
  updatedAt: string;
};

export type NoticeListParams = {
  keyword?: string;
  category?: string;
  page?: number;
  size?: number;
};

type RequestOptions = {
  signal?: AbortSignal;
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
  options?: RequestOptions,
): Promise<PageResponse<NoticeDto>> {
  const query = buildQuery({
    keyword: params.keyword,
    category: params.category,
    page: params.page ?? 0,
    size: params.size ?? 10,
  });

  const endpoint = `/notices${query}`;
  const res = await http.get<unknown>(endpoint, {
    signal: options?.signal,
  });
  return parseNoticeListContract(res.data, endpoint);
}

export async function getNoticeDetail(id: number, options?: RequestOptions): Promise<NoticeDto> {
  const endpoint = `/notices/${id}`;
  const res = await http.get<unknown>(endpoint, {
    signal: options?.signal,
  });
  return parseNoticeDetailContract(res.data, endpoint);
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

export async function getPlacementAd(
  placement: PlacementKey,
  options?: RequestOptions,
): Promise<ClientAdDto | null> {
  const ad = await adGateway.getPlacementAd(placement, {
    prefer: "web",
    signal: options?.signal,
  });
  if (!ad) {
    return null;
  }

  return {
    id: ad.id ?? 0,
    title: ad.title ?? ad.altText ?? "광고 배너",
    imageUrl: ad.imageUrl,
    placement,
    isActive: ad.isActive,
    createdAt: ad.createdAt ?? "",
    updatedAt: ad.updatedAt ?? "",
  };
}
