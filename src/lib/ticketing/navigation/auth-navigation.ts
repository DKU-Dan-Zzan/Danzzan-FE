// 역할: 티켓팅 도메인 공통 로직(매퍼/유틸/네비게이션)을 제공하는 모듈입니다.
import { MY_TICKET_PATH, getMyTicketNavigationTarget } from "@/lib/common/my-ticket-navigation";
import { resolveScopedRedirect } from "@/lib/common/auth-redirect";
import { TICKETING_PATH } from "@/lib/common/ticketing-navigation";

export const TICKETING_DEFAULT_PATH = TICKETING_PATH;

export { MY_TICKET_PATH, getMyTicketNavigationTarget };

export const resolveTicketingLoginRedirect = (redirectParam: string | null) => {
  return resolveScopedRedirect(redirectParam, {
    scope: "/ticket",
    fallback: TICKETING_DEFAULT_PATH,
  });
};
