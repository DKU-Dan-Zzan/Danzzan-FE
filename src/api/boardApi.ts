import { createHttpClient } from "@/api/httpClient";
import {
  mapLostFoundListDtoToModel,
  mapNoticeListDtoToModel,
} from "@/mappers/boardMapper";
import { authStore } from "@/store/authStore";
import type {
  LostFoundItemDto,
  LostFoundListResponseDto,
  NoticeDto,
  NoticeListResponseDto,
} from "@/types/dto/board.dto";
import type {
  LostFoundInput,
  LostFoundItem,
  Notice,
  NoticeInput,
} from "@/types/model/board.model";
import { env, requireEnv } from "@/utils/env";

const getBoardClient = () =>
  createHttpClient({
    baseUrl: requireEnv(env.boardApiBaseUrl, "VITE_BOARD_API_BASE_URL"),
    getAccessToken: authStore.getAccessToken,
  });

export const boardApi = {
  listNotices: async (): Promise<Notice[]> => {
    const client = getBoardClient();
    // TODO: Confirm notice list endpoint.
    const dto = await client.get<NoticeListResponseDto>("/notices");
    return mapNoticeListDtoToModel(dto ?? {});
  },
  createNotice: async (payload: NoticeInput): Promise<Notice> => {
    const client = getBoardClient();
    // TODO: Confirm notice create endpoint.
    const dto = await client.post<NoticeDto>("/notices", {
      title: payload.title,
      content: payload.content,
      author: payload.author,
      isUrgent: payload.isUrgent,
    });
    return mapNoticeListDtoToModel({ items: [dto ?? {}] })[0];
  },
  listLostItems: async (): Promise<LostFoundItem[]> => {
    const client = getBoardClient();
    // TODO: Confirm lost&found list endpoint.
    const dto = await client.get<LostFoundListResponseDto>("/lost-items");
    return mapLostFoundListDtoToModel(dto ?? {});
  },
  createLostItem: async (payload: LostFoundInput): Promise<LostFoundItem> => {
    const client = getBoardClient();
    // TODO: Confirm lost&found create endpoint.
    const dto = await client.post<LostFoundItemDto>("/lost-items", {
      name: payload.name,
      description: payload.description,
      foundLocation: payload.foundLocation,
      foundDate: payload.foundDate,
      isClaimed: false,
    });
    return mapLostFoundListDtoToModel({ items: [dto ?? {}] })[0];
  },
  updateLostItemClaimed: async (
    id: string,
    isClaimed: boolean,
  ): Promise<LostFoundItem> => {
    const client = getBoardClient();
    // TODO: Confirm lost&found update endpoint.
    const dto = await client.patch<LostFoundItemDto>(`/lost-items/${id}`,
      { isClaimed },
    );
    return mapLostFoundListDtoToModel({ items: [dto ?? {}] })[0];
  },
};
