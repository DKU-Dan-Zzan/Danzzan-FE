import { useCallback, useState } from "react";
import { getPlacementAd, type ClientAdDto } from "@/api/app/notice/noticeApi";

type UseAdminAdsOptions = {
  onError: (message: string) => void;
};

export const useAdminAds = ({ onError }: UseAdminAdsOptions) => {
  const [adLoading, setAdLoading] = useState(false);
  const [homeBottomAd, setHomeBottomAd] = useState<ClientAdDto | null>(null);
  const [myTicketAd, setMyTicketAd] = useState<ClientAdDto | null>(null);

  const reloadAds = useCallback(async () => {
    try {
      setAdLoading(true);
      const [homeBottom, myTicket] = await Promise.all([
        getPlacementAd("HOME_BOTTOM"),
        getPlacementAd("MY_TICKET"),
      ]);
      setHomeBottomAd(homeBottom);
      setMyTicketAd(myTicket);
    } catch (error) {
      onError(error instanceof Error ? error.message : "광고 정보를 불러오지 못했습니다.");
    } finally {
      setAdLoading(false);
    }
  }, [onError]);

  return {
    adLoading,
    homeBottomAd,
    myTicketAd,
    reloadAds,
  };
};
