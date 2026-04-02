// 역할: notice api 관련 HTTP 요청 함수를 제공하는 API 어댑터다.

import { http } from "@/lib/http";
import {
  parseNoticeDetailContract,
  parseNoticeListContract,
  type NoticeDto,
  type PageResponse,
} from "@/api/app/notice/noticeContract";

export type { NoticeDto, PageResponse } from "@/api/app/notice/noticeContract";

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

