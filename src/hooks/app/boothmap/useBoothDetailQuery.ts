// 역할: Booth Detail 서버 상태 조회와 캐시 정책을 캡슐화한 훅이다.

import {
  getBoothSummary,
  getPubDetail,
} from "@/api/app/boothmap/boothmapApi";
import { useLanguage } from "@/i18n";
import { appQueryKeys, useAppQuery } from "@/lib/query";

export const useBoothDetailQuery = (boothId: number | null, date: string | null) => {
  const { language } = useLanguage();
  return useAppQuery({
    queryKey: appQueryKeys.boothMapBoothDetail(language, boothId ?? -1, date ?? ""),
    enabled: boothId !== null && date !== null,
    queryFn: ({ signal }) => {
      if (boothId === null || date === null) {
        throw new Error("부스 상세 조회 대상이 없습니다.");
      }
      return getBoothSummary(boothId, date, { signal });
    },
    staleTime: 5 * 60_000,
  });
};

export const usePubDetailQuery = (pubId: number | null, date: string | null) => {
  const { language } = useLanguage();
  return useAppQuery({
    queryKey: appQueryKeys.boothMapPubDetail(language, pubId ?? -1, date ?? ""),
    enabled: pubId !== null && date !== null,
    queryFn: ({ signal }) => {
      if (pubId === null || date === null) {
        throw new Error("주점 상세 조회 대상이 없습니다.");
      }
      return getPubDetail(pubId, date, { signal });
    },
    staleTime: 5 * 60_000,
  });
};
