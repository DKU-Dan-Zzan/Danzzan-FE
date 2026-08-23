// 역할: 앱 전역 React Query 키 팩토리를 정의해 캐시 키 규칙을 일관되게 유지합니다.
import type { Language } from "@/store/common/languageStore";

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
  placementAds: (placement: "HOME_BOTTOM" | "MY_TICKET") => ["ads", "active", { placement }] as const,
  adminAds: () => ["admin", "ads"] as const,
  adminEmergencyNotice: () => ["admin", "emergency-notice"] as const,
  adminNotices: (params: AdminNoticeListKeyParams) => ["admin", "notices", params] as const,
  adminPlacementAd: (placement: "HOME_BOTTOM" | "MY_TICKET") =>
    ["admin", "ad", { placement }] as const,
  // 아래 boothmap/notice/timetable 키들은 BE가 lang 파라미터로 응답 내용을 바꾸는
  // 엔드포인트(GET /booths/**, /map/**, /notices, /timetable/**)를 사용하므로
  // 언어 전환 시 이전 언어의 캐시가 그대로 보이지 않도록 언어를 키에 포함한다.
  boothMapData: (language: Language, date: string) => ["boothmap", "data", language, { date }] as const,
  boothMapBoothDetail: (language: Language, boothId: number, date: string) =>
    ["boothmap", "booth-detail", language, { boothId, date }] as const,
  boothMapPubDetail: (language: Language, pubId: number, date: string) =>
    ["boothmap", "pub-detail", language, { pubId, date }] as const,
  ticketingEvents: () => ["ticketing", "events"] as const,
  ticketingWaitingRoomAd: () => ["ticketing", "waiting-room-ad"] as const,
  myTicketList: () => ["ticketing", "my-ticket", "list"] as const,
  myPageProfile: () => ["mypage", "profile"] as const,
  ticketingQueueStatus: (eventId: string) => ["ticketing", "queue-status", { eventId }] as const,
  ticketingWristbandStats: (eventId: string) => ["ticketing", "wristband-stats", { eventId }] as const,
  noticeList: (language: Language, params: NoticeListKeyParams) =>
    ["notice", "list", language, params] as const,
  noticeDetail: (language: Language, id: number) => ["notice", "detail", language, { id }] as const,
  timetablePerformances: (language: Language, date: string) =>
    ["timetable", "performances", language, { date }] as const,
  timetableContentImages: (language: Language) => ["timetable", "content-images", language] as const,
  timetableDisplayConfig: (language: Language) => ["timetable", "display-config", language] as const,
  adminTimetablePerformances: (date: string) => ["admin", "timetable", "performances", { date }] as const,
  adminTimetableArtists: () => ["admin", "timetable", "artists"] as const,
};
