export type NoticeListKeyParams = {
  keyword: string;
  category: string;
  page: number;
  size: number;
};

export const appQueryKeys = {
  homeImages: () => ["home", "images"] as const,
  homeLineup: () => ["home", "lineup"] as const,
  homeEmergencyNotice: () => ["home", "emergency-notice"] as const,
  homeBottomAd: () => ["home", "ad", "HOME_BOTTOM"] as const,
  myTicketList: () => ["ticketing", "my-ticket", "list"] as const,
  myTicketAd: () => ["ticketing", "my-ticket", "ad"] as const,
  noticeList: (params: NoticeListKeyParams) => ["notice", "list", params] as const,
  noticeDetail: (id: number) => ["notice", "detail", { id }] as const,
  timetablePerformances: (date: string) => ["timetable", "performances", { date }] as const,
  timetableContentImages: () => ["timetable", "content-images"] as const,
};
