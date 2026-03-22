// 역할: 앱 전역 React Query 키 팩토리를 정의해 캐시 키 규칙을 일관되게 유지합니다.
export type NoticeListKeyParams = {
  keyword: string;
  category: string;
  page: number;
  size: number;
};

export type AdminNoticeListKeyParams = {
  keyword: string;
  status: "ACTIVE" | "DELETED" | "ALL";
  page: number;
  size: number;
};

export const appQueryKeys = {
  homeImages: () => ["home", "images"] as const,
  homeLineup: () => ["home", "lineup"] as const,
  homeEmergencyNotice: () => ["home", "emergency-notice"] as const,
  homeBottomAd: () => ["home", "ad", "HOME_BOTTOM"] as const,
  adminEmergencyNotice: () => ["admin", "emergency-notice"] as const,
  adminNotices: (params: AdminNoticeListKeyParams) => ["admin", "notices", params] as const,
  adminPlacementAd: (placement: "HOME_BOTTOM" | "MY_TICKET") =>
    ["admin", "ad", { placement }] as const,
  boothMapData: (date: string) => ["boothmap", "data", { date }] as const,
  boothMapBoothDetail: (boothId: number) => ["boothmap", "booth-detail", { boothId }] as const,
  boothMapPubDetail: (pubId: number) => ["boothmap", "pub-detail", { pubId }] as const,
  myTicketList: () => ["ticketing", "my-ticket", "list"] as const,
  myTicketAd: () => ["ticketing", "my-ticket", "ad"] as const,
  myPageProfile: () => ["mypage", "profile"] as const,
  ticketingQueueStatus: (eventId: string) => ["ticketing", "queue-status", { eventId }] as const,
  ticketingWristbandStats: (eventId: string) => ["ticketing", "wristband-stats", { eventId }] as const,
  noticeList: (params: NoticeListKeyParams) => ["notice", "list", params] as const,
  noticeDetail: (id: number) => ["notice", "detail", { id }] as const,
  timetablePerformances: (date: string) => ["timetable", "performances", { date }] as const,
  timetableContentImages: () => ["timetable", "content-images"] as const,
};
