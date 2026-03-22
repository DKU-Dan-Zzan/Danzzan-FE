import {
  getBoothSummary,
  getPubDetail,
} from "@/api/app/boothmap/boothmapApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";

export const useBoothDetailQuery = (boothId: number | null) => {
  return useAppQuery({
    queryKey: appQueryKeys.boothMapBoothDetail(boothId ?? -1),
    enabled: boothId !== null,
    queryFn: ({ signal }) => {
      if (boothId === null) {
        throw new Error("부스 상세 조회 대상이 없습니다.");
      }
      return getBoothSummary(boothId, undefined, { signal });
    },
    staleTime: 5 * 60_000,
  });
};

export const usePubDetailQuery = (pubId: number | null) => {
  return useAppQuery({
    queryKey: appQueryKeys.boothMapPubDetail(pubId ?? -1),
    enabled: pubId !== null,
    queryFn: ({ signal }) => {
      if (pubId === null) {
        throw new Error("주점 상세 조회 대상이 없습니다.");
      }
      return getPubDetail(pubId, undefined, { signal });
    },
    staleTime: 5 * 60_000,
  });
};
