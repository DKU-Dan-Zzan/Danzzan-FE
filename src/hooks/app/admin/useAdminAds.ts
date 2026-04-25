// 역할: Admin 광고 전체 목록 상태와 부수효과를 캡슐화한 훅이다.

import { useCallback, useEffect } from "react";
import { getAdminAds } from "@/api/app/admin/adminApi";
import type { AdvertisementResponse } from "@/api/app/admin/adminApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";

export type ClientAdDto = AdvertisementResponse;

type UseAdminAdsOptions = {
  onError: (message: string) => void;
};

export const useAdminAds = ({ onError }: UseAdminAdsOptions) => {
  const allAdsQuery = useAppQuery({
    queryKey: appQueryKeys.adminAds(),
    queryFn: ({ signal }) => getAdminAds({ signal }),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (allAdsQuery.error) {
      onError(allAdsQuery.error.message || "광고 정보를 불러오지 못했습니다.");
    }
  }, [allAdsQuery.error, onError]);

  const reloadAds = useCallback(async () => {
    await allAdsQuery.refetch();
  }, [allAdsQuery]);

  return {
    adLoading: allAdsQuery.isPending || allAdsQuery.isFetching,
    allAds: (allAdsQuery.data ?? []) as ClientAdDto[],
    reloadAds,
  };
};
