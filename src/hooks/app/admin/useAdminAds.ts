import { useCallback, useEffect } from "react";
import { getPlacementAd } from "@/api/app/notice/noticeApi";
import { appQueryKeys, useAppQuery } from "@/lib/query";

type UseAdminAdsOptions = {
  onError: (message: string) => void;
};

export const useAdminAds = ({ onError }: UseAdminAdsOptions) => {
  const homeBottomAdQuery = useAppQuery({
    queryKey: appQueryKeys.adminPlacementAd("HOME_BOTTOM"),
    queryFn: ({ signal }) => getPlacementAd("HOME_BOTTOM", { signal }),
    staleTime: 60_000,
  });

  const myTicketAdQuery = useAppQuery({
    queryKey: appQueryKeys.adminPlacementAd("MY_TICKET"),
    queryFn: ({ signal }) => getPlacementAd("MY_TICKET", { signal }),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (homeBottomAdQuery.error) {
      onError(homeBottomAdQuery.error.message || "광고 정보를 불러오지 못했습니다.");
      return;
    }
    if (myTicketAdQuery.error) {
      onError(myTicketAdQuery.error.message || "광고 정보를 불러오지 못했습니다.");
    }
  }, [homeBottomAdQuery.error, myTicketAdQuery.error, onError]);

  const reloadAds = useCallback(async () => {
    await Promise.all([homeBottomAdQuery.refetch(), myTicketAdQuery.refetch()]);
  }, [homeBottomAdQuery, myTicketAdQuery]);

  return {
    adLoading:
      homeBottomAdQuery.isPending ||
      myTicketAdQuery.isPending ||
      homeBottomAdQuery.isFetching ||
      myTicketAdQuery.isFetching,
    homeBottomAd: homeBottomAdQuery.data ?? null,
    myTicketAd: myTicketAdQuery.data ?? null,
    reloadAds,
  };
};
